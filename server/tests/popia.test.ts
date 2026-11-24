import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { withPopiaRlsTx } from '../src/utils/popiaTenantRls.js';
import {
  appendPopiaAuditLog,
  exportSubjectData,
  executeRightToErasure,
} from '../src/services/popiaDsrService.js';
import { runPopiaRetentionSweep } from '../src/workers/popiaWorker.js';

describe('Phase 2 – POPIA Governance Engine Integration Suite (RLS, Immutability & DSR)', () => {
  const tenantAUuid = crypto.randomUUID();
  const tenantBUuid = crypto.randomUUID();
  let testUserId = '';
  let testAccountId = '';
  let testContactId = '';
  let testProjectId = '';
  let testLeadId = '';

  beforeAll(async () => {
    // Provision two isolated tenants in PostgreSQL for end-to-end DSR, Retention & RLS verification
    await prisma.tenant.create({
      data: {
        id: tenantAUuid,
        name: 'Shogun SA Architecture Studio (Tenant A)',
        domain: `tenant-a-${tenantAUuid.slice(0, 8)}.co.za`,
        industry: 'Architecture & Engineering',
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantBUuid,
        name: 'Cape Town Coastal Developments (Tenant B)',
        domain: `tenant-b-${tenantBUuid.slice(0, 8)}.co.za`,
        industry: 'Real Estate',
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenantAUuid,
        email: `info.officer.${tenantAUuid.slice(0, 8)}@shogun.co.za`,
        passwordHash: 'hashed_test_secret',
        displayName: 'Naledi Pandor (Information Officer)',
        role: 'admin',
        isTenantAdmin: true,
      },
    });
    testUserId = adminUser.id;

    const account = await prisma.account.create({
      data: {
        tenantId: tenantAUuid,
        accountNumber: 'ACC-ZA-001',
        accountName: 'Sandton Precinct Holdings (Pty) Ltd',
        email: 'finance@sandtonprecinct.co.za',
        primaryPhone: '+27-11-555-0100',
        assignedUserId: testUserId,
        createdById: testUserId,
      },
    });
    testAccountId = account.id;

    const contact = await prisma.contact.create({
      data: {
        tenantId: tenantAUuid,
        contactNumber: 'CON-ZA-001',
        salutation: 'Mr.',
        firstName: 'Sipho',
        lastName: 'Nkosi',
        accountId: testAccountId,
        email: 'sipho.nkosi@sandtonprecinct.co.za',
        secondaryEmail: 'sipho.personal@example.co.za',
        phone: '+27-11-555-0144',
        mobile: '+27-82-555-0144',
        jobTitle: 'Development Director',
        department: 'Capital Projects',
        mailingStreet: '100 Maude Street, Sandton',
        mailingCity: 'Johannesburg',
        mailingState: 'Gauteng',
        mailingPostalCode: '2196',
        mailingCountry: 'South Africa',
        description: 'Key signatory for Phase 1 mixed-use tower.',
        assignedUserId: testUserId,
        createdById: testUserId,
        customFields: {
          rsaIdNumber: '8504125089081',
          personalMobileWhatsapp: '+27-82-555-0144',
          preferredSegment: 'enterprise_aec',
        },
      },
    });
    testContactId = contact.id;

    const project = await prisma.project.create({
      data: {
        tenantId: tenantAUuid,
        title: 'Sandton Green Star Tower',
        ownerId: testUserId,
        accountId: testAccountId,
        primaryContactId: testContactId,
        code: 'JHB-TOWER-01',
      },
    });
    testProjectId = project.id;

    // Create two SARS-regulated tax invoices linked to the project
    await prisma.projectInvoice.createMany({
      data: [
        {
          tenantId: tenantAUuid,
          projectId: testProjectId,
          invoiceNumber: 'INV-SARS-2026-001',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          status: 'paid',
          subtotal: 100000,
          taxTotal: 15000,
          totalAmount: 115000,
        },
        {
          tenantId: tenantAUuid,
          projectId: testProjectId,
          invoiceNumber: 'INV-SARS-2026-002',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          status: 'accepted',
          subtotal: 60000,
          taxTotal: 9000,
          totalAmount: 69000,
        },
      ],
    });

    const lead = await prisma.lead.create({
      data: {
        tenantId: tenantAUuid,
        leadNumber: 'LEAD-ZA-099',
        firstName: 'Lerato',
        lastName: 'Mokoena',
        company: 'Rosebank Studio',
        email: 'lerato@rosebankstudio.co.za',
        phone: '+27-11-555-0999',
        assignedUserId: testUserId,
        createdById: testUserId,
        customFields: {
          cellNumber: '+27-83-555-0999',
          campaignCode: 'JHB-EXPO',
        },
      },
    });
    testLeadId = lead.id;

    // Backdate lead updatedAt beyond 365 days for automated retention sweep test
    const fourHundredDaysAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    await prisma.$executeRaw`
      UPDATE "crm_leads" SET "updatedAt" = ${fourHundredDaysAgo} WHERE "id" = ${testLeadId}
    `;
  });

  afterAll(async () => {
    // Clean up mutable POPIA consent & retention rows and test tenants
    // (popia_audit_logs is append-only immutable by PostgreSQL trigger design)
    try {
      await withPopiaRlsTx(tenantAUuid, async (tx, tUuid) => {
        await tx.popiaConsentRecord.deleteMany({ where: { tenantId: tUuid } });
        await tx.popiaRetentionPolicy.deleteMany({ where: { tenantId: tUuid } });
      });
      await withPopiaRlsTx(tenantBUuid, async (tx, tUuid) => {
        await tx.popiaConsentRecord.deleteMany({ where: { tenantId: tUuid } });
        await tx.popiaRetentionPolicy.deleteMany({ where: { tenantId: tUuid } });
      });
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAUuid, tenantBUuid] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('throws a PostgreSQL trigger error when attempting to UPDATE or DELETE a row in popia_audit_logs', async () => {
    const auditRow = await appendPopiaAuditLog({
      tenantId: tenantAUuid,
      actorUserId: testUserId,
      actorAgent: 'Auditor',
      action: 'READ_PII',
      entityType: 'contact',
      entityId: testContactId,
      fieldsAccessed: ['firstName', 'lastName', 'email', 'rsaIdNumber'],
      ipAddress: '196.25.1.10',
    });

    expect(auditRow.id).toBeDefined();

    // 1. Attempt UPDATE via Prisma client -> must throw PostgreSQL trigger error
    await expect(
      prisma.popiaAuditLog.update({
        where: { id: auditRow.id },
        data: { action: 'DELETE' },
      })
    ).rejects.toThrow(/POPIA_AUDIT_LOG_IMMUTABLE/);

    // 2. Attempt DELETE via Prisma client -> must throw PostgreSQL trigger error
    await expect(
      prisma.popiaAuditLog.delete({
        where: { id: auditRow.id },
      })
    ).rejects.toThrow(/POPIA_AUDIT_LOG_IMMUTABLE/);

    // 3. Attempt raw SQL DELETE inside tenant RLS session -> must also throw trigger error
    await expect(
      withPopiaRlsTx(tenantAUuid, async (tx) => {
        await tx.$executeRaw`DELETE FROM "popia_audit_logs" WHERE "id" = ${auditRow.id}::uuid`;
      })
    ).rejects.toThrow(/POPIA_AUDIT_LOG_IMMUTABLE/);

    // Verify original immutable record remains unaltered
    const persisted = await withPopiaRlsTx(tenantAUuid, async (tx) =>
      tx.popiaAuditLog.findUnique({ where: { id: auditRow.id } })
    );
    expect(persisted).not.toBeNull();
    expect(persisted?.action).toBe('READ_PII');
  });

  it('enforces PostgreSQL RLS so Tenant A cannot read or write Tenant B PopiaConsentRecord entries', async () => {
    const consentA = await withPopiaRlsTx(tenantAUuid, async (tx, tUuid) =>
      tx.popiaConsentRecord.create({
        data: {
          tenantId: tUuid,
          subjectType: 'contact',
          subjectId: testContactId,
          purpose: 'crm_processing',
          lawfulBasis: 'contract',
          granted: true,
          sourceIp: '196.25.1.20',
        },
      })
    );

    const consentB = await withPopiaRlsTx(tenantBUuid, async (tx, tUuid) =>
      tx.popiaConsentRecord.create({
        data: {
          tenantId: tUuid,
          subjectType: 'lead',
          subjectId: 'lead-tenant-b-secret',
          purpose: 'marketing',
          lawfulBasis: 'consent',
          granted: true,
          sourceIp: '196.25.2.50',
        },
      })
    );

    // Query WITHOUT any application-level WHERE filter under Tenant A's RLS context
    const visibleToTenantA = await withPopiaRlsTx(tenantAUuid, async (tx) =>
      tx.popiaConsentRecord.findMany()
    );

    expect(visibleToTenantA.length).toBeGreaterThanOrEqual(1);
    expect(visibleToTenantA.some((r) => r.id === consentA.id)).toBe(true);
    expect(visibleToTenantA.some((r) => r.id === consentB.id)).toBe(false);
    expect(visibleToTenantA.every((r) => r.tenantId === tenantAUuid)).toBe(true);

    // Direct primary-key lookup of Tenant B's consent record from Tenant A's RLS session returns null
    const crossTenantLookup = await withPopiaRlsTx(tenantAUuid, async (tx) =>
      tx.popiaConsentRecord.findUnique({ where: { id: consentB.id } })
    );
    expect(crossTenantLookup).toBeNull();

    // Cross-tenant INSERT spoofing Tenant B's tenantId from Tenant A's RLS session is blocked by WITH CHECK
    await expect(
      withPopiaRlsTx(tenantAUuid, async (tx) =>
        tx.popiaConsentRecord.create({
          data: {
            tenantId: tenantBUuid,
            subjectType: 'contact',
            subjectId: 'spoofed-contact',
            purpose: 'marketing',
            lawfulBasis: 'consent',
            granted: true,
          },
        })
      )
    ).rejects.toThrow(/row-level security policy/i);
  });

  it('compiles Section 23 export bundle and scrubs Contact PII on executeRightToErasure while preserving SARS invoice totals', async () => {
    // 1. Verify Section 23 Subject Data Export (JSON + CSV)
    const exported = await exportSubjectData(tenantAUuid, 'contact', testContactId, {
      actorUserId: testUserId,
    });
    expect(exported.bundle.subject.email).toBe('sipho.nkosi@sandtonprecinct.co.za');
    expect(exported.bundle.consentHistory.length).toBeGreaterThanOrEqual(1);
    expect(exported.bundle.projectInteractions.invoices).toHaveLength(2);
    expect(exported.csv).toContain('SUBJECT_PROFILE');
    expect(exported.csv).toContain('FINANCIAL_INVOICE');

    // 2. Execute Section 24 Right to Erasure
    const erasure = await executeRightToErasure(
      tenantAUuid,
      'contact',
      testContactId,
      testUserId,
      { reason: 'Data subject withdrew consent and requested erasure' }
    );

    expect(erasure.success).toBe(true);
    expect(erasure.actionTaken).toBe('anonymized');
    expect(erasure.consentsWithdrawn).toBeGreaterThanOrEqual(1);

    // Verify SARS 5-year legal-hold flags & invoice total preservation
    expect(erasure.legalHold.active).toBe(true);
    expect(erasure.legalHold.retainedInvoiceCount).toBe(2);
    expect(erasure.legalHold.retainedInvoiceSubtotal).toBe(160000);
    expect(erasure.legalHold.retainedInvoiceTaxTotal).toBe(24000);
    expect(erasure.legalHold.retainedInvoiceTotalAmount).toBe(184000);

    // Verify Contact PII is scrubbed in PostgreSQL
    const scrubbedContact = await prisma.contact.findUniqueOrThrow({
      where: { id: testContactId },
    });
    expect(scrubbedContact.firstName).toBe('Redacted');
    expect(scrubbedContact.lastName).toBe('Redacted');
    expect(scrubbedContact.email).toBe(`redacted-${testContactId}@anonymized.local`);
    expect(scrubbedContact.secondaryEmail).toBeNull();
    expect(scrubbedContact.phone).toBeNull();
    expect(scrubbedContact.mobile).toBeNull();
    expect(scrubbedContact.mailingStreet).toBeNull();
    expect(scrubbedContact.description).toBeNull();

    const scrubbedCustomFields = scrubbedContact.customFields as Record<string, any>;
    expect(scrubbedCustomFields.rsaIdNumber).toBeNull();
    expect(scrubbedCustomFields.personalMobileWhatsapp).toBeNull();
    expect(scrubbedCustomFields.preferredSegment).toBe('enterprise_aec');
    expect(scrubbedCustomFields.sarsLegalHold).toBe(true);

    // Verify linked ProjectInvoice records & financial totals remain 100% preserved in PostgreSQL
    const persistedInvoices = await prisma.projectInvoice.findMany({
      where: { projectId: testProjectId },
      orderBy: { invoiceNumber: 'asc' },
    });
    expect(persistedInvoices).toHaveLength(2);
    const totalPreserved = persistedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const subtotalPreserved = persistedInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const taxPreserved = persistedInvoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
    expect(subtotalPreserved).toBe(160000);
    expect(taxPreserved).toBe(24000);
    expect(totalPreserved).toBe(184000);
  });

  it('anonymizes expired inactive leads via popiaRetentionWorker and records Worker audit entries', async () => {
    await withPopiaRlsTx(tenantAUuid, async (tx, tUuid) => {
      await tx.popiaRetentionPolicy.upsert({
        where: {
          tenantId_moduleName: {
            tenantId: tUuid,
            moduleName: 'leads',
          },
        },
        update: {
          retentionDays: 365,
          actionOnExpiry: 'anonymize',
          isActive: true,
        },
        create: {
          tenantId: tUuid,
          moduleName: 'leads',
          retentionDays: 365,
          actionOnExpiry: 'anonymize',
          isActive: true,
        },
      });
    });

    const sweepResult = await runPopiaRetentionSweep(tenantAUuid);
    expect(sweepResult.recordsAnonymized).toBeGreaterThanOrEqual(1);
    expect(sweepResult.auditLogsWritten).toBeGreaterThanOrEqual(1);

    const scrubbedLead = await prisma.lead.findUniqueOrThrow({
      where: { id: testLeadId },
    });
    expect(scrubbedLead.firstName).toBe('Redacted');
    expect(scrubbedLead.email).toBe(`redacted-${testLeadId}@anonymized.local`);
    expect(scrubbedLead.phone).toBeNull();
    expect((scrubbedLead.customFields as Record<string, any>).cellNumber).toBeNull();
    expect((scrubbedLead.customFields as Record<string, any>).campaignCode).toBe('JHB-EXPO');
  });
});
