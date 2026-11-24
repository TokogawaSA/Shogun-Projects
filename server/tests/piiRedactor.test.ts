import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { disconnectRedis } from '../src/config/redis.js';
import {
  piiRedactor,
  isValidSouthAfricanId,
  MCP_REDACTION_TTL_SECONDS,
} from '../src/mcp/piiRedactor.js';
import { setExternalLlmProvider } from '../src/mcp/crmTools.js';
import { setOffshoreAiProcessing } from '../src/utils/tenantConfig.js';
import { withPopiaRlsTx } from '../src/utils/popiaTenantRls.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';

describe('Phase 3 – POPIA Deterministic SA PII Redactor & Section 72 MCP Guard', () => {
  const tenantUuid = crypto.randomUUID();
  let testUserId = '';
  let testAccountId = '';
  let testContactId = '';
  let testProjectId = '';
  let authToken = '';

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: tenantUuid,
        name: 'Pretoria FinTech Advisory (Pty) Ltd',
        domain: `pta-fintech-${tenantUuid.slice(0, 8)}.co.za`,
        industry: 'Financial Services',
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `officer.${tenantUuid.slice(0, 8)}@ptafintech.co.za`,
        passwordHash: 'hashed_pw',
        displayName: 'Zanele Dlamini',
        role: 'admin',
        isTenantAdmin: true,
      },
    });
    testUserId = user.id;

    const account = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        accountNumber: 'ACC-PTA-100',
        accountName: 'Karoo Solar Infrastructure (Pty) Ltd',
        email: 'treasury@karoosolar.co.za',
        primaryPhone: '+27 21 555 0188',
        description:
          'Registered CIPC 2018/123456/07 | VAT Number: 4123456789 | FNB Account: 62849102938 | Director ID 8001015009087',
        assignedUserId: testUserId,
        createdById: testUserId,
      },
    });
    testAccountId = account.id;

    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        contactNumber: 'CON-PTA-100',
        firstName: 'Pieter',
        lastName: 'van der Merwe',
        accountId: testAccountId,
        email: 'pieter.vdm@karoosolar.co.za',
        phone: '+27 82 555 0144',
        assignedUserId: testUserId,
        createdById: testUserId,
      },
    });
    testContactId = contact.id;

    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        title: 'Northern Cape Grid Integration',
        ownerId: testUserId,
        accountId: testAccountId,
        primaryContactId: testContactId,
      },
    });
    testProjectId = project.id;

    authToken = jwt.sign(
      {
        userId: testUserId,
        tenantId: tenantUuid,
        email: user.email,
        role: 'admin',
        isTenantAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    setExternalLlmProvider(null);
  });

  afterAll(async () => {
    try {
      await prisma.systemConfig.deleteMany({ where: { tenantId: tenantUuid } });
      await prisma.tenant.deleteMany({ where: { id: tenantUuid } });
    } finally {
      await disconnectRedis();
      await prisma.$disconnect();
    }
  });

  describe('Deterministic South African PII Detection & Redis 5-Minute Vault (piiRedactor.ts)', () => {
    it('validates 13-digit SA ID numbers using YYMMDD calendar rules and Luhn checksum', () => {
      expect(isValidSouthAfricanId('8001015009087')).toBe(true);
      expect(isValidSouthAfricanId('9205150123087')).toBe(true);

      // Invalid Luhn check digit
      expect(isValidSouthAfricanId('8001015009088')).toBe(false);
      // Invalid calendar month (13)
      expect(isValidSouthAfricanId('8013015009084')).toBe(false);
      // Wrong length
      expect(isValidSouthAfricanId('800101500908')).toBe(false);
    });

    it('tokenizes SA IDs, +27 & local SA phones, emails, CIPC reg numbers, SARS VAT/Tax numbers, and bank accounts with 5-minute Redis TTL and restores them locally', async () => {
      const redisStore = new Map<string, { value: string; ex: number }>();
      const mockRedis = {
        set: async (key: string, value: string, _mode: 'EX', ttl: number) => {
          redisStore.set(key, { value, ex: ttl });
          return 'OK' as any;
        },
        get: async (key: string) => redisStore.get(key)?.value ?? null,
        del: async (key: string) => (redisStore.delete(key) ? 1 : 0),
      };

      const rawText = [
        'Director SA ID: 8001015009087 (backup signatory ID 9205150123087)',
        'Mobile: +27 82 555 0144 and Cape Town office 021-555-0188 and Joburg 011 444 9988',
        'Email: treasury@karoosolar.co.za',
        'CIPC Registration: 2018/123456/07',
        'SARS VAT Number: 4123456789',
        'Bank Account: 62849102938',
      ].join(' | ');

      const requestId = 'req-popia-unit-001';
      const sanitizedResult = await piiRedactor.sanitize(
        tenantUuid,
        rawText,
        requestId,
        { redisClient: mockRedis }
      );

      // Verify exact Redis key namespace and 5-minute (300s) TTL
      expect(sanitizedResult.redisKey).toBe(`tenant:${tenantUuid}:mcp:redact:${requestId}`);
      expect(sanitizedResult.ttlSeconds).toBe(MCP_REDACTION_TTL_SECONDS);
      expect(sanitizedResult.ttlSeconds).toBe(300);
      expect(redisStore.get(sanitizedResult.redisKey)?.ex).toBe(300);

      // Assert zero raw PII remains in outbound LLM text
      expect(sanitizedResult.sanitized).not.toContain('8001015009087');
      expect(sanitizedResult.sanitized).not.toContain('9205150123087');
      expect(sanitizedResult.sanitized).not.toContain('+27 82 555 0144');
      expect(sanitizedResult.sanitized).not.toContain('021-555-0188');
      expect(sanitizedResult.sanitized).not.toContain('011 444 9988');
      expect(sanitizedResult.sanitized).not.toContain('treasury@karoosolar.co.za');
      expect(sanitizedResult.sanitized).not.toContain('2018/123456/07');
      expect(sanitizedResult.sanitized).not.toContain('4123456789');
      expect(sanitizedResult.sanitized).not.toContain('62849102938');

      // Assert deterministic category placeholders exist
      expect(sanitizedResult.sanitized).toContain('[SA_ID_1]');
      expect(sanitizedResult.sanitized).toContain('[SA_ID_2]');
      expect(sanitizedResult.sanitized).toContain('[SA_PHONE_1]');
      expect(sanitizedResult.sanitized).toContain('[SA_PHONE_2]');
      expect(sanitizedResult.sanitized).toContain('[SA_PHONE_3]');
      expect(sanitizedResult.sanitized).toContain('[EMAIL_1]');
      expect(sanitizedResult.sanitized).toContain('[CIPC_REG_1]');
      expect(sanitizedResult.sanitized).toContain('[SARS_TAX_1]');
      expect(sanitizedResult.sanitized).toContain('[BANK_ACCT_1]');

      // Simulate LLM response referencing placeholders and verify accurate local re-hydration
      const simulatedLlmReply = `Verified CIPC [CIPC_REG_1] (VAT [SARS_TAX_1], payout [BANK_ACCT_1]) for director [SA_ID_1] reachable at [SA_PHONE_1] or [EMAIL_1].`;
      const rehydrated = await piiRedactor.rehydrate(
        tenantUuid,
        simulatedLlmReply,
        requestId,
        { redisClient: mockRedis }
      );

      expect(rehydrated).toBe(
        'Verified CIPC 2018/123456/07 (VAT 4123456789, payout 62849102938) for director 8001015009087 reachable at +27 82 555 0144 or treasury@karoosolar.co.za.'
      );

      // Verify cross-tenant isolation: another tenant cannot rehydrate Tenant A's requestId
      const crossTenantAttempt = await piiRedactor.rehydrate(
        crypto.randomUUID(),
        simulatedLlmReply,
        requestId,
        { redisClient: mockRedis }
      );
      expect(crossTenantAttempt).toBe(simulatedLlmReply);
    });
  });

  describe('MCP Routes POPIA Section 72 Guard & Audit Logging (/api/mcp/*)', () => {
    it('returns 403 Forbidden on MCP routes when allowOffshoreAiProcessing is false', async () => {
      await setOffshoreAiProcessing(tenantUuid, false, testUserId);

      const server = app.listen(0);
      try {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;

        const summarizeRes = await fetch(`http://127.0.0.1:${port}/api/mcp/summarize-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ accountId: testAccountId }),
        });

        expect(summarizeRes.status).toBe(403);
        const errBody = (await summarizeRes.json()) as any;
        expect(errBody.code).toBe('POPIA_S72_OFFSHORE_AI_DISABLED');

        const tasksRes = await fetch(`http://127.0.0.1:${port}/api/mcp/generate-tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            accountId: testAccountId,
            meetingNotes: '- Follow up with +27 82 555 0144 regarding CIPC 2018/123456/07',
          }),
        });

        expect(tasksRes.status).toBe(403);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('strips SA PII from outbound LLM payloads, re-hydrates responses locally, and logs READ_PII in PopiaAuditLog when allowOffshoreAiProcessing is enabled', async () => {
      await setOffshoreAiProcessing(tenantUuid, true, testUserId);

      const capturedOutboundPayloads: Array<{ tool: string; serialized: string }> = [];

      setExternalLlmProvider(async ({ tool, context }) => {
        const serialized = JSON.stringify(context);
        capturedOutboundPayloads.push({ tool, serialized });

        if (tool === 'summarizeAccountContext') {
          const c = context as any;
          return `# Executive Briefing: ${c.accountName}\nNotes: ${c.description}\nContact: ${c.contacts[0].email} (${c.contacts[0].phone})`;
        }

        return String((context as any).meetingNotes);
      });

      const server = app.listen(0);
      try {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;

        // 1. Invoke summarizeAccountContext as Sentinel agent
        const sumRes = await fetch(`http://127.0.0.1:${port}/api/mcp/summarize-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            'X-MCP-Agent': 'Sentinel',
          },
          body: JSON.stringify({ accountId: testAccountId }),
        });

        expect(sumRes.status).toBe(200);
        const sumBody = (await sumRes.json()) as any;

        // Verify outbound payload sent to LLM was completely stripped of SA PII
        const outboundSummaryPayload = capturedOutboundPayloads.find(
          (p) => p.tool === 'summarizeAccountContext'
        );
        expect(outboundSummaryPayload).toBeDefined();
        expect(outboundSummaryPayload!.serialized).not.toContain('8001015009087');
        expect(outboundSummaryPayload!.serialized).not.toContain('+27 82 555 0144');
        expect(outboundSummaryPayload!.serialized).not.toContain('+27 21 555 0188');
        expect(outboundSummaryPayload!.serialized).not.toContain('2018/123456/07');
        expect(outboundSummaryPayload!.serialized).not.toContain('4123456789');
        expect(outboundSummaryPayload!.serialized).not.toContain('62849102938');
        expect(outboundSummaryPayload!.serialized).not.toContain('pieter.vdm@karoosolar.co.za');
        expect(outboundSummaryPayload!.serialized).toContain('[SA_ID_1]');
        expect(outboundSummaryPayload!.serialized).toContain('[CIPC_REG_1]');
        expect(outboundSummaryPayload!.serialized).toContain('[SA_PHONE_1]');

        // Verify client response was accurately re-hydrated locally
        expect(sumBody.executiveSummary).toContain('8001015009087');
        expect(sumBody.executiveSummary).toContain('2018/123456/07');
        expect(sumBody.executiveSummary).toContain('pieter.vdm@karoosolar.co.za');
        expect(sumBody.executiveSummary).toContain('+27 82 555 0144');

        // 2. Invoke generateTasksFromMeetingNotes as Auditor agent
        const taskRes = await fetch(`http://127.0.0.1:${port}/api/mcp/generate-tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            'X-MCP-Agent': 'Auditor',
          },
          body: JSON.stringify({
            accountId: testAccountId,
            targetProjectId: testProjectId,
            meetingNotes:
              '- Verify CIPC 2018/123456/07 and call Pieter on +27 82 555 0144 for ID 8001015009087',
          }),
        });

        expect(taskRes.status).toBe(201);
        const taskBody = (await taskRes.json()) as any;
        expect(taskBody.taskCount).toBe(1);
        expect(taskBody.tasks[0].title).toContain('2018/123456/07');
        expect(taskBody.tasks[0].title).toContain('+27 82 555 0144');

        const outboundTaskPayload = capturedOutboundPayloads.find(
          (p) => p.tool === 'generateTasksFromMeetingNotes'
        );
        expect(outboundTaskPayload!.serialized).not.toContain('2018/123456/07');
        expect(outboundTaskPayload!.serialized).not.toContain('+27 82 555 0144');
        expect(outboundTaskPayload!.serialized).not.toContain('8001015009087');

        // 3. Verify immutable PopiaAuditLog entries recorded with READ_PII & processedEntityIds
        const auditLogs = await withPopiaRlsTx(tenantUuid, async (tx, tUuid) =>
          tx.popiaAuditLog.findMany({
            where: { tenantId: tUuid, action: 'READ_PII' },
            orderBy: { createdAt: 'desc' },
          })
        );

        expect(auditLogs.length).toBeGreaterThanOrEqual(2);
        const agentsLogged = auditLogs.map((l) => l.actorAgent);
        expect(agentsLogged).toContain('Sentinel');
        expect(agentsLogged).toContain('Auditor');

        const summaryAudit = auditLogs.find(
          (l) => (l.fieldsAccessed as any)?.mcpTool === 'summarizeAccountContext'
        );
        expect(summaryAudit).toBeDefined();
        expect((summaryAudit!.fieldsAccessed as any).processedEntityIds).toContain(testAccountId);
        expect((summaryAudit!.fieldsAccessed as any).processedEntityIds).toContain(testContactId);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
