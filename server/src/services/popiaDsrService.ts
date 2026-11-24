import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { toTenantUuid, withPopiaRlsTx } from '../utils/popiaTenantRls.js';

export const SARS_STATUTORY_RETENTION_DAYS = 1825; // 5 years (SARS Tax Administration Act 28 of 2011 s29)

export type PopiaSubjectType = 'contact' | 'lead' | 'account' | 'user';
export type PopiaConsentPurpose =
  | 'crm_processing'
  | 'marketing'
  | 'ai_mcp_processing'
  | 'cross_border_sync';
export type PopiaLawfulBasis =
  | 'consent'
  | 'contract'
  | 'legitimate_interest'
  | 'legal_obligation';
export type PopiaRetentionModule =
  | 'leads'
  | 'contacts'
  | 'accounts'
  | 'deals'
  | 'audit_logs';
export type PopiaExpiryAction = 'anonymize' | 'hard_delete';
export type PopiaActorAgent = 'human' | 'Sentinel' | 'Worker' | 'Auditor';
export type PopiaAuditAction =
  | 'READ_PII'
  | 'EXPORT_PII'
  | 'ANONYMIZE'
  | 'DELETE'
  | 'CONSENT_CHANGE';

const PII_CUSTOM_FIELD_KEY_PATTERN =
  /(email|phone|mobile|cell|tel|address|street|postal|zip|id_?number|rsa_?id|identity|passport|tax_?id|vat|bank|account_?num|iban|dob|birth|ssn|director|contact_?name|ip_?address|whatsapp)/i;

/**
 * Scrub PII keys inside arbitrary JSON customFields while preserving non-PII aggregate/telemetry metrics.
 */
export function scrubCustomFieldsPii(
  customFields: unknown,
  extraComplianceMetadata?: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (customFields && typeof customFields === 'object' && !Array.isArray(customFields)) {
    for (const [key, value] of Object.entries(customFields as Record<string, unknown>)) {
      if (PII_CUSTOM_FIELD_KEY_PATTERN.test(key)) {
        result[key] = null;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = scrubCustomFieldsPii(value);
      } else {
        result[key] = value;
      }
    }
  }

  if (extraComplianceMetadata) {
    Object.assign(result, extraComplianceMetadata);
  }

  return result;
}

export interface AppendPopiaAuditParams {
  tenantId: string;
  actorUserId?: string | null;
  actorAgent?: PopiaActorAgent;
  action: PopiaAuditAction;
  entityType: string;
  entityId: string;
  fieldsAccessed: Record<string, unknown> | string[];
  ipAddress?: string | null;
}

/**
 * Append an immutable record to `popia_audit_logs` within a tenant-scoped RLS transaction.
 */
export async function appendPopiaAuditLog(params: AppendPopiaAuditParams) {
  return withPopiaRlsTx(params.tenantId, async (tx, tenantUuid) => {
    return tx.popiaAuditLog.create({
      data: {
        tenantId: tenantUuid,
        actorUserId: params.actorUserId ?? null,
        actorAgent: params.actorAgent ?? 'human',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        fieldsAccessed: params.fieldsAccessed as Prisma.InputJsonValue,
        ipAddress: params.ipAddress ?? null,
      },
    });
  });
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildSubjectExportCsv(bundle: {
  subjectType: PopiaSubjectType;
  subjectId: string;
  tenantId: string;
  exportedAt: string;
  subject: Record<string, unknown>;
  consentHistory: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  deals: Array<Record<string, unknown>>;
  quotes: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  bookings: Array<Record<string, unknown>>;
  socialInteractions: Array<Record<string, unknown>>;
}): string {
  const lines: string[] = [
    ['section', 'record_id', 'field_or_summary', 'value', 'captured_at']
      .map(escapeCsvCell)
      .join(','),
  ];

  for (const [field, val] of Object.entries(bundle.subject)) {
    lines.push(
      ['SUBJECT_PROFILE', bundle.subjectId, field, val, bundle.exportedAt]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const consent of bundle.consentHistory) {
    lines.push(
      [
        'CONSENT_RECORD',
        consent.id,
        `${consent.purpose} (${consent.lawfulBasis})`,
        consent.granted ? 'GRANTED' : 'WITHDRAWN',
        consent.withdrawnAt || consent.capturedAt,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const proj of bundle.projects) {
    lines.push(
      ['PROJECT_LINK', proj.id, proj.title, proj.code || 'active', proj.createdAt]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const deal of bundle.deals) {
    lines.push(
      ['DEAL_INTERACTION', deal.id, deal.dealName, `${deal.currency} ${deal.amount} (${deal.stage})`, deal.createdAt]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const inv of bundle.invoices) {
    lines.push(
      ['FINANCIAL_INVOICE', inv.id, inv.invoiceNumber, `Total: ${inv.totalAmount} (${inv.status})`, inv.issueDate]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const booking of bundle.bookings) {
    lines.push(
      ['BOOKING_INTERACTION', booking.id, booking.title, booking.status, booking.startTime]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const soc of bundle.socialInteractions) {
    lines.push(
      ['SOCIAL_INTERACTION', soc.id, soc.platform, soc.content, soc.publishedAt]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}

export interface PopiaSubjectExportResult {
  formatVersion: '1.0';
  popiaSection: 'Section 23 - Access to Personal Information';
  tenantId: string;
  subjectType: PopiaSubjectType;
  subjectId: string;
  exportedAt: string;
  auditLogId: string;
  bundle: {
    subject: Record<string, unknown>;
    consentHistory: Array<Record<string, unknown>>;
    projectInteractions: {
      projects: Array<Record<string, unknown>>;
      deals: Array<Record<string, unknown>>;
      quotes: Array<Record<string, unknown>>;
      invoices: Array<Record<string, unknown>>;
      bookings: Array<Record<string, unknown>>;
      socialInteractions: Array<Record<string, unknown>>;
      activityLogs: Array<Record<string, unknown>>;
    };
  };
  json: string;
  csv: string;
}

/**
 * POPIA Section 23 – Data Subject Right of Access & Portability.
 * Compiles a machine-readable JSON & CSV bundle of all personal/juristic information,
 * consent records, and linked CRM/project/financial interactions, logging `EXPORT_PII`.
 */
export async function exportSubjectData(
  tenantId: string,
  subjectType: PopiaSubjectType,
  subjectId: string,
  options?: {
    actorUserId?: string | null;
    actorAgent?: PopiaActorAgent;
    ipAddress?: string | null;
  }
): Promise<PopiaSubjectExportResult> {
  if (!tenantId || !subjectId) {
    throw Object.assign(new Error('tenantId and subjectId are required.'), { status: 400 });
  }

  let subjectRecord: Record<string, unknown> | null = null;
  let projects: Array<Record<string, unknown>> = [];
  let deals: Array<Record<string, unknown>> = [];
  let quotes: Array<Record<string, unknown>> = [];
  let invoices: Array<Record<string, unknown>> = [];
  let bookings: Array<Record<string, unknown>> = [];
  let socialInteractions: Array<Record<string, unknown>> = [];

  if (subjectType === 'contact') {
    const contact = await prisma.contact.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!contact) {
      throw Object.assign(new Error(`Contact "${subjectId}" not found in tenant.`), { status: 404 });
    }
    subjectRecord = contact as unknown as Record<string, unknown>;

    const linkedProjects = await prisma.project.findMany({
      where: {
        tenantId,
        OR: [{ primaryContactId: subjectId }, { accountId: contact.accountId }],
      },
    });
    projects = linkedProjects as unknown as Array<Record<string, unknown>>;
    const projectIds = linkedProjects.map((p) => p.id);

    deals = (await prisma.deal.findMany({
      where: { tenantId, contactId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    quotes = (await prisma.quote.findMany({
      where: { tenantId, contactId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    if (projectIds.length > 0) {
      invoices = (await prisma.projectInvoice.findMany({
        where: { tenantId, projectId: { in: projectIds } },
      })) as unknown as Array<Record<string, unknown>>;
    }

    bookings = (await prisma.booking.findMany({
      where: { tenantId, contactId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    socialInteractions = (await prisma.socialInteraction.findMany({
      where: { tenantId, linkedContactId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;
  } else if (subjectType === 'lead') {
    const lead = await prisma.lead.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!lead) {
      throw Object.assign(new Error(`Lead "${subjectId}" not found in tenant.`), { status: 404 });
    }
    subjectRecord = lead as unknown as Record<string, unknown>;
  } else if (subjectType === 'account') {
    const account = await prisma.account.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!account) {
      throw Object.assign(new Error(`Juristic Account "${subjectId}" not found in tenant.`), { status: 404 });
    }
    subjectRecord = account as unknown as Record<string, unknown>;

    const linkedProjects = await prisma.project.findMany({
      where: { tenantId, accountId: subjectId },
    });
    projects = linkedProjects as unknown as Array<Record<string, unknown>>;
    const projectIds = linkedProjects.map((p) => p.id);

    deals = (await prisma.deal.findMany({
      where: { tenantId, accountId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    quotes = (await prisma.quote.findMany({
      where: { tenantId, accountId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    if (projectIds.length > 0) {
      invoices = (await prisma.projectInvoice.findMany({
        where: { tenantId, projectId: { in: projectIds } },
      })) as unknown as Array<Record<string, unknown>>;
    }

    bookings = (await prisma.booking.findMany({
      where: { tenantId, accountId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    socialInteractions = (await prisma.socialInteraction.findMany({
      where: { tenantId, linkedAccountId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;
  } else if (subjectType === 'user') {
    const user = await prisma.user.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!user) {
      throw Object.assign(new Error(`User "${subjectId}" not found in tenant.`), { status: 404 });
    }
    const { passwordHash: _omitted, ...safeUser } = user;
    subjectRecord = safeUser as unknown as Record<string, unknown>;

    projects = (await prisma.project.findMany({
      where: { tenantId, ownerId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;

    bookings = (await prisma.booking.findMany({
      where: { tenantId, hostUserId: subjectId },
    })) as unknown as Array<Record<string, unknown>>;
  } else {
    throw Object.assign(new Error(`Unsupported subjectType "${subjectType}".`), { status: 400 });
  }

  const activityLogs = (await prisma.entityActivityLog.findMany({
    where: { tenantId, entityId: subjectId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  })) as unknown as Array<Record<string, unknown>>;

  const { consentHistory, auditEntry } = await withPopiaRlsTx(
    tenantId,
    async (tx, tenantUuid) => {
      const consents = await tx.popiaConsentRecord.findMany({
        where: {
          tenantId: tenantUuid,
          subjectType,
          subjectId,
        },
        orderBy: { capturedAt: 'desc' },
      });

      const log = await tx.popiaAuditLog.create({
        data: {
          tenantId: tenantUuid,
          actorUserId: options?.actorUserId ?? null,
          actorAgent: options?.actorAgent ?? 'human',
          action: 'EXPORT_PII',
          entityType: subjectType,
          entityId: subjectId,
          fieldsAccessed: {
            subjectFields: Object.keys(subjectRecord || {}),
            consentRecordsCount: consents.length,
            projectsCount: projects.length,
            dealsCount: deals.length,
            quotesCount: quotes.length,
            invoicesCount: invoices.length,
            bookingsCount: bookings.length,
          },
          ipAddress: options?.ipAddress ?? null,
        },
      });

      return {
        consentHistory: consents as unknown as Array<Record<string, unknown>>,
        auditEntry: log,
      };
    }
  );

  const exportedAt = new Date().toISOString();
  const bundle = {
    subject: subjectRecord,
    consentHistory,
    projectInteractions: {
      projects,
      deals,
      quotes,
      invoices,
      bookings,
      socialInteractions,
      activityLogs,
    },
  };

  const jsonPayload = JSON.stringify(
    {
      formatVersion: '1.0',
      popiaSection: 'Section 23 - Access to Personal Information',
      tenantId,
      subjectType,
      subjectId,
      exportedAt,
      ...bundle,
    },
    null,
    2
  );

  const csvPayload = buildSubjectExportCsv({
    subjectType,
    subjectId,
    tenantId,
    exportedAt,
    subject: subjectRecord,
    consentHistory,
    projects,
    deals,
    quotes,
    invoices,
    bookings,
    socialInteractions,
  });

  return {
    formatVersion: '1.0',
    popiaSection: 'Section 23 - Access to Personal Information',
    tenantId,
    subjectType,
    subjectId,
    exportedAt,
    auditLogId: auditEntry.id,
    bundle,
    json: jsonPayload,
    csv: csvPayload,
  };
}

export interface PopiaErasureResult {
  success: boolean;
  popiaSection: 'Section 24 - Right to Erasure & Anonymization';
  tenantId: string;
  subjectType: PopiaSubjectType;
  subjectId: string;
  actionTaken: 'anonymized' | 'deleted';
  scrubbedFields: string[];
  consentsWithdrawn: number;
  legalHold: {
    active: boolean;
    retentionYears: number;
    retentionDays: number;
    retainUntil: string | null;
    statutoryBasis: string | null;
    retainedInvoiceCount: number;
    retainedInvoiceSubtotal: number;
    retainedInvoiceTaxTotal: number;
    retainedInvoiceTotalAmount: number;
  };
  auditLogId: string;
  erasedAt: string;
}

/**
 * POPIA Section 24 – Right to Erasure / Destruction of Personal Information.
 * Scrubs personal/juristic PII while retaining legally mandated SARS financial/invoice records
 * for 5 years (1825 days) under an explicit legal-hold flag, and logs an immutable audit trail entry.
 */
export async function executeRightToErasure(
  tenantId: string,
  subjectType: PopiaSubjectType,
  subjectId: string,
  actorUserId?: string | null,
  options?: {
    actorAgent?: PopiaActorAgent;
    ipAddress?: string | null;
    reason?: string;
    preferHardDeleteWhenUnlinked?: boolean;
  }
): Promise<PopiaErasureResult> {
  if (!tenantId || !subjectId) {
    throw Object.assign(new Error('tenantId and subjectId are required.'), { status: 400 });
  }

  const now = new Date();
  const sarsCutoff = new Date(now.getTime() - SARS_STATUTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  let retainedInvoices: Array<{
    id: string;
    issueDate: Date;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
  }> = [];
  let hasRelationalLinks = false;
  let scrubbedFields: string[] = [];
  let actionTaken: 'anonymized' | 'deleted' = 'anonymized';

  if (subjectType === 'contact') {
    const contact = await prisma.contact.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!contact) {
      throw Object.assign(new Error(`Contact "${subjectId}" not found in tenant.`), { status: 404 });
    }

    const linkedProjects = await prisma.project.findMany({
      where: {
        tenantId,
        OR: [{ primaryContactId: contact.id }, { accountId: contact.accountId }],
      },
      select: { id: true },
    });
    const projectIds = linkedProjects.map((p) => p.id);

    if (projectIds.length > 0) {
      hasRelationalLinks = true;
      retainedInvoices = await prisma.projectInvoice.findMany({
        where: {
          tenantId,
          projectId: { in: projectIds },
          issueDate: { gte: sarsCutoff },
        },
        select: {
          id: true,
          issueDate: true,
          subtotal: true,
          taxTotal: true,
          totalAmount: true,
        },
      });
    }

    const linkedQuotesCount = await prisma.quote.count({
      where: { tenantId, contactId: contact.id },
    });
    const linkedDealsCount = await prisma.deal.count({
      where: { tenantId, contactId: contact.id },
    });
    if (linkedQuotesCount > 0 || linkedDealsCount > 0) {
      hasRelationalLinks = true;
    }

    const legalHoldActive = retainedInvoices.length > 0;
    const latestInvoiceMs = retainedInvoices.reduce(
      (max, inv) => Math.max(max, new Date(inv.issueDate).getTime()),
      0
    );
    const retainUntil = legalHoldActive
      ? new Date(latestInvoiceMs + SARS_STATUTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

    if (!legalHoldActive && !hasRelationalLinks && options?.preferHardDeleteWhenUnlinked) {
      await prisma.contact.delete({ where: { id: contact.id } });
      actionTaken = 'deleted';
      scrubbedFields = ['ALL_CONTACT_FIELDS_HARD_DELETED'];
    } else {
      const complianceMeta = {
        popiaAnonymized: true,
        popiaErasedAt: now.toISOString(),
        popiaErasureReason: options?.reason ?? 'POPIA Section 24 Data Subject Erasure',
        sarsLegalHold: legalHoldActive,
        sarsLegalHoldUntil: retainUntil,
        retainedInvoiceCount: retainedInvoices.length,
        retainedInvoiceTotalAmount: retainedInvoices.reduce((s, i) => s + i.totalAmount, 0),
      };

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          salutation: null,
          firstName: 'Redacted',
          lastName: 'Redacted',
          email: `redacted-${contact.id}@anonymized.local`,
          secondaryEmail: null,
          phone: null,
          mobile: null,
          jobTitle: null,
          department: null,
          mailingStreet: null,
          mailingCity: null,
          mailingState: null,
          mailingPostalCode: null,
          mailingCountry: null,
          description: null,
          customFields: scrubCustomFieldsPii(contact.customFields, complianceMeta) as Prisma.InputJsonValue,
        },
      });

      // Scrub guest PII on linked appointment bookings while keeping slot audit counts
      await prisma.booking.updateMany({
        where: { tenantId, contactId: contact.id },
        data: {
          guestName: 'Redacted',
          guestEmail: `redacted-${contact.id}@anonymized.local`,
          guestPhone: null,
          guestNotes: null,
        },
      });

      // Scrub linked social handles
      await prisma.socialInteraction.updateMany({
        where: { tenantId, linkedContactId: contact.id },
        data: {
          authorName: 'Redacted',
          authorHandle: '@redacted',
          authorAvatar: null,
        },
      });

      actionTaken = 'anonymized';
      scrubbedFields = [
        'salutation',
        'firstName',
        'lastName',
        'email',
        'secondaryEmail',
        'phone',
        'mobile',
        'jobTitle',
        'department',
        'mailingStreet',
        'mailingCity',
        'mailingState',
        'mailingPostalCode',
        'mailingCountry',
        'description',
        'customFields',
      ];
    }
  } else if (subjectType === 'lead') {
    const lead = await prisma.lead.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!lead) {
      throw Object.assign(new Error(`Lead "${subjectId}" not found in tenant.`), { status: 404 });
    }

    if (lead.convertedAccountId) {
      const accountProjects = await prisma.project.findMany({
        where: { tenantId, accountId: lead.convertedAccountId },
        select: { id: true },
      });
      if (accountProjects.length > 0) {
        hasRelationalLinks = true;
        retainedInvoices = await prisma.projectInvoice.findMany({
          where: {
            tenantId,
            projectId: { in: accountProjects.map((p) => p.id) },
            issueDate: { gte: sarsCutoff },
          },
          select: {
            id: true,
            issueDate: true,
            subtotal: true,
            taxTotal: true,
            totalAmount: true,
          },
        });
      }
    }

    const legalHoldActive = retainedInvoices.length > 0;

    if (!legalHoldActive && !lead.isConverted && options?.preferHardDeleteWhenUnlinked) {
      await prisma.lead.delete({ where: { id: lead.id } });
      actionTaken = 'deleted';
      scrubbedFields = ['ALL_LEAD_FIELDS_HARD_DELETED'];
    } else {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          salutation: null,
          firstName: 'Redacted',
          lastName: 'Redacted',
          company: 'Redacted',
          title: null,
          email: `redacted-${lead.id}@anonymized.local`,
          secondaryEmail: null,
          phone: null,
          mobile: null,
          website: null,
          street: null,
          city: null,
          state: null,
          postalCode: null,
          country: null,
          description: null,
          customFields: scrubCustomFieldsPii(lead.customFields, {
            popiaAnonymized: true,
            popiaErasedAt: now.toISOString(),
            sarsLegalHold: legalHoldActive,
          }) as Prisma.InputJsonValue,
        },
      });
      actionTaken = 'anonymized';
      scrubbedFields = [
        'salutation',
        'firstName',
        'lastName',
        'company',
        'title',
        'email',
        'secondaryEmail',
        'phone',
        'mobile',
        'website',
        'street',
        'city',
        'state',
        'postalCode',
        'country',
        'description',
        'customFields',
      ];
    }
  } else if (subjectType === 'account') {
    const account = await prisma.account.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!account) {
      throw Object.assign(new Error(`Juristic Account "${subjectId}" not found in tenant.`), { status: 404 });
    }

    const linkedProjects = await prisma.project.findMany({
      where: { tenantId, accountId: account.id },
      select: { id: true },
    });
    if (linkedProjects.length > 0) {
      hasRelationalLinks = true;
      retainedInvoices = await prisma.projectInvoice.findMany({
        where: {
          tenantId,
          projectId: { in: linkedProjects.map((p) => p.id) },
          issueDate: { gte: sarsCutoff },
        },
        select: {
          id: true,
          issueDate: true,
          subtotal: true,
          taxTotal: true,
          totalAmount: true,
        },
      });
    }

    const legalHoldActive = retainedInvoices.length > 0;
    const latestInvoiceMs = retainedInvoices.reduce(
      (max, inv) => Math.max(max, new Date(inv.issueDate).getTime()),
      0
    );
    const retainUntil = legalHoldActive
      ? new Date(latestInvoiceMs + SARS_STATUTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accountName: `Redacted Juristic Entity (${account.accountNumber})`,
        domain: null,
        primaryPhone: null,
        secondaryPhone: null,
        email: `redacted-${account.id}@anonymized.local`,
        website: null,
        billingStreet: null,
        billingCity: null,
        billingState: null,
        billingPostalCode: null,
        billingCountry: null,
        shippingStreet: null,
        shippingCity: null,
        shippingState: null,
        shippingPostalCode: null,
        shippingCountry: null,
        description: null,
        customFields: scrubCustomFieldsPii(account.customFields, {
          popiaAnonymized: true,
          popiaErasedAt: now.toISOString(),
          sarsLegalHold: legalHoldActive,
          sarsLegalHoldUntil: retainUntil,
        }) as Prisma.InputJsonValue,
      },
    });

    actionTaken = 'anonymized';
    scrubbedFields = [
      'accountName',
      'domain',
      'primaryPhone',
      'secondaryPhone',
      'email',
      'website',
      'billingStreet',
      'billingCity',
      'billingState',
      'billingPostalCode',
      'billingCountry',
      'shippingStreet',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
      'description',
      'customFields',
    ];
  } else if (subjectType === 'user') {
    const user = await prisma.user.findFirst({
      where: { id: subjectId, tenantId },
    });
    if (!user) {
      throw Object.assign(new Error(`User "${subjectId}" not found in tenant.`), { status: 404 });
    }

    const ownedProjects = await prisma.project.findMany({
      where: { tenantId, ownerId: user.id },
      select: { id: true },
    });
    if (ownedProjects.length > 0) {
      retainedInvoices = await prisma.projectInvoice.findMany({
        where: {
          tenantId,
          projectId: { in: ownedProjects.map((p) => p.id) },
          issueDate: { gte: sarsCutoff },
        },
        select: {
          id: true,
          issueDate: true,
          subtotal: true,
          taxTotal: true,
          totalAmount: true,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: 'Redacted',
        email: `redacted-${user.id}@anonymized.local`,
        photoURL: null,
      },
    });

    actionTaken = 'anonymized';
    scrubbedFields = ['displayName', 'email', 'photoURL'];
  } else {
    throw Object.assign(new Error(`Unsupported subjectType "${subjectType}".`), { status: 400 });
  }

  const retainedInvoiceSubtotal = retainedInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const retainedInvoiceTaxTotal = retainedInvoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
  const retainedInvoiceTotalAmount = retainedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const legalHoldActive = retainedInvoices.length > 0;
  const latestInvoiceMs = retainedInvoices.reduce(
    (max, inv) => Math.max(max, new Date(inv.issueDate).getTime()),
    0
  );
  const retainUntil = legalHoldActive
    ? new Date(latestInvoiceMs + SARS_STATUTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Withdraw active consents & append immutable audit log inside POPIA RLS transaction
  const { consentsWithdrawn, auditLogId } = await withPopiaRlsTx(
    tenantId,
    async (tx, tenantUuid) => {
      const withdrawResult = await tx.popiaConsentRecord.updateMany({
        where: {
          tenantId: tenantUuid,
          subjectType,
          subjectId,
          granted: true,
        },
        data: {
          granted: false,
          withdrawnAt: now,
        },
      });

      if (withdrawResult.count > 0) {
        await tx.popiaAuditLog.create({
          data: {
            tenantId: tenantUuid,
            actorUserId: actorUserId ?? null,
            actorAgent: options?.actorAgent ?? 'human',
            action: 'CONSENT_CHANGE',
            entityType: subjectType,
            entityId: subjectId,
            fieldsAccessed: {
              consentsWithdrawn: withdrawResult.count,
              trigger: 'right_to_erasure',
            },
            ipAddress: options?.ipAddress ?? null,
          },
        });
      }

      const erasureAudit = await tx.popiaAuditLog.create({
        data: {
          tenantId: tenantUuid,
          actorUserId: actorUserId ?? null,
          actorAgent: options?.actorAgent ?? 'human',
          action: actionTaken === 'deleted' ? 'DELETE' : 'ANONYMIZE',
          entityType: subjectType,
          entityId: subjectId,
          fieldsAccessed: {
            scrubbedFields,
            sarsLegalHold: legalHoldActive,
            retainedInvoiceCount: retainedInvoices.length,
            retainedInvoiceTotalAmount,
            retainUntil,
            reason: options?.reason ?? 'POPIA Section 24 Right to Erasure',
          },
          ipAddress: options?.ipAddress ?? null,
        },
      });

      return {
        consentsWithdrawn: withdrawResult.count,
        auditLogId: erasureAudit.id,
      };
    }
  );

  return {
    success: true,
    popiaSection: 'Section 24 - Right to Erasure & Anonymization',
    tenantId,
    subjectType,
    subjectId,
    actionTaken,
    scrubbedFields,
    consentsWithdrawn,
    legalHold: {
      active: legalHoldActive,
      retentionYears: 5,
      retentionDays: SARS_STATUTORY_RETENTION_DAYS,
      retainUntil,
      statutoryBasis: legalHoldActive
        ? 'SARS Tax Administration Act 28 of 2011 Section 29 (5-Year Financial Record Retention)'
        : null,
      retainedInvoiceCount: retainedInvoices.length,
      retainedInvoiceSubtotal,
      retainedInvoiceTaxTotal,
      retainedInvoiceTotalAmount,
    },
    auditLogId,
    erasedAt: now.toISOString(),
  };
}

export const DEFAULT_POPIA_RETENTION_POLICIES: Array<{
  moduleName: PopiaRetentionModule;
  retentionDays: number;
  actionOnExpiry: PopiaExpiryAction;
  isActive: boolean;
}> = [
  { moduleName: 'leads', retentionDays: 365, actionOnExpiry: 'anonymize', isActive: true },
  { moduleName: 'contacts', retentionDays: 1095, actionOnExpiry: 'anonymize', isActive: true },
  { moduleName: 'accounts', retentionDays: 1825, actionOnExpiry: 'anonymize', isActive: true },
  { moduleName: 'deals', retentionDays: 1825, actionOnExpiry: 'anonymize', isActive: true },
  { moduleName: 'audit_logs', retentionDays: 1825, actionOnExpiry: 'anonymize', isActive: true },
];

export async function getOrSeedPopiaRetentionPolicies(tenantId: string) {
  return withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
    const existing = await tx.popiaRetentionPolicy.findMany({
      where: { tenantId: tenantUuid },
      orderBy: { moduleName: 'asc' },
    });

    if (existing.length > 0) {
      return existing;
    }

    const created = [];
    for (const preset of DEFAULT_POPIA_RETENTION_POLICIES) {
      const row = await tx.popiaRetentionPolicy.create({
        data: {
          tenantId: tenantUuid,
          moduleName: preset.moduleName,
          retentionDays: preset.retentionDays,
          actionOnExpiry: preset.actionOnExpiry,
          isActive: preset.isActive,
        },
      });
      created.push(row);
    }

    return created;
  });
}

export const popiaDsrService = {
  SARS_STATUTORY_RETENTION_DAYS,
  toTenantUuid,
  scrubCustomFieldsPii,
  appendPopiaAuditLog,
  exportSubjectData,
  executeRightToErasure,
  getOrSeedPopiaRetentionPolicies,
};

export default popiaDsrService;
