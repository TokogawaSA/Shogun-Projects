import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import {
  summarizeAccountContext,
  generateTasksFromMeetingNotes,
} from '../mcp/crmTools.js';
import { piiRedactor } from '../mcp/piiRedactor.js';
import { isOffshoreAiProcessingAllowed } from '../utils/tenantConfig.js';
import {
  appendPopiaAuditLog,
  type PopiaActorAgent,
} from '../services/popiaDsrService.js';

export const mcpRouter = Router();

const ALLOWED_MCP_AGENTS = new Set<PopiaActorAgent>(['Sentinel', 'Worker', 'Auditor']);

function resolveMcpActorAgent(req: Request, fallback: 'Sentinel' | 'Worker' | 'Auditor'): PopiaActorAgent {
  const rawAgent =
    (typeof req.headers['x-mcp-agent'] === 'string' ? req.headers['x-mcp-agent'] : '') ||
    (typeof req.body?.actorAgent === 'string' ? req.body.actorAgent : '');
  const trimmed = rawAgent.trim() as PopiaActorAgent;
  if (ALLOWED_MCP_AGENTS.has(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
}

/**
 * POPIA Section 72 Cross-Border AI Guard Middleware.
 * Blocks MCP AI tool invocations with `403 Forbidden` unless the tenant Information Officer
 * has explicitly enabled `allowOffshoreAiProcessing`.
 */
export async function enforceOffshoreAiConsentGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId || req.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }

    const allowed = await isOffshoreAiProcessingAllowed(tenantId);
    if (!allowed) {
      res.status(403).json({
        error:
          'Forbidden: Offshore LLM / MCP AI processing is disabled for this tenant under POPIA Section 72. A Tenant Information Officer must explicitly enable allowOffshoreAiProcessing.',
        code: 'POPIA_S72_OFFSHORE_AI_DISABLED',
      });
      return;
    }

    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to verify POPIA Section 72 AI processing consent.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

mcpRouter.use(enforceOffshoreAiConsentGuard);

/**
 * Wrap any MCP tool execution with:
 * 1. Inbound request body PII sanitization (`piiRedactor.sanitize`)
 * 2. Tool execution with shared `requestId`
 * 3. Outbound response re-hydration (`piiRedactor.rehydrate`)
 * 4. Immutable `PopiaAuditLog` recording (`actorAgent: 'Sentinel' | 'Worker' | 'Auditor'`, `action: 'READ_PII'`)
 */
async function executeGuardedMcpTool<T extends Record<string, any>>(params: {
  req: Request;
  res: Response;
  toolName: string;
  defaultAgent: 'Sentinel' | 'Worker' | 'Auditor';
  entityType: string;
  primaryEntityId: string;
  successStatus?: number;
  invoke: (requestId: string, sanitizedBody: Record<string, any>) => Promise<T>;
}): Promise<void> {
  const { req, res, toolName, defaultAgent, entityType, primaryEntityId } = params;
  const tenantId = (req.user || req.tenantContext)!.tenantId;
  const userId = (req.user || req.tenantContext)?.userId ?? null;
  const actorAgent = resolveMcpActorAgent(req, defaultAgent);
  const requestId = crypto.randomUUID();

  // 1. Sanitize request payload before passing to LLM-backed MCP pipeline
  const inboundRedaction = await piiRedactor.sanitize(tenantId, req.body || {}, requestId);

  // 2. Run MCP tool (which also sanitizes DB-fetched CRM context under the same requestId)
  const rawResult = await params.invoke(requestId, inboundRedaction.sanitized);

  // 3. Re-hydrate any remaining placeholders locally inside SA before returning to authenticated client
  const hydratedResult = await piiRedactor.rehydrate(tenantId, rawResult, requestId);

  const processedEntityIds: string[] = Array.isArray(hydratedResult.processedEntityIds)
    ? hydratedResult.processedEntityIds
    : [primaryEntityId];

  const categories = Array.from(
    new Set([
      ...inboundRedaction.categoriesDetected,
      ...(hydratedResult.redactionMeta?.categoriesDetected || []),
    ])
  );

  // 4. Record immutable POPIA PII access audit entry
  await appendPopiaAuditLog({
    tenantId,
    actorUserId: userId,
    actorAgent,
    action: 'READ_PII',
    entityType,
    entityId: primaryEntityId,
    fieldsAccessed: {
      mcpTool: toolName,
      requestId,
      processedEntityIds,
      redactionCategories: categories,
      redactionCount:
        inboundRedaction.redactionCount + (hydratedResult.redactionMeta?.redactionCount || 0),
    },
    ipAddress: resolveClientIp(req),
  });

  const { processedEntityIds: _internalIds, redactionMeta: _internalMeta, ...publicPayload } =
    hydratedResult;

  res.status(params.successStatus ?? 200).json(publicPayload);
}

/**
 * POST /api/mcp/summarize-account
 */
mcpRouter.post('/summarize-account', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body || {};
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required in request body.' });
      return;
    }

    const tenantId = (req.user || req.tenantContext)!.tenantId;

    await executeGuardedMcpTool({
      req,
      res,
      toolName: 'summarizeAccountContext',
      defaultAgent: 'Sentinel',
      entityType: 'account',
      primaryEntityId: String(accountId),
      invoke: (requestId) => summarizeAccountContext(tenantId, String(accountId), { requestId }),
    });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({
      error: 'Failed to summarize account context.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

/**
 * POST /api/mcp/generate-tasks
 */
mcpRouter.post('/generate-tasks', async (req: Request, res: Response) => {
  try {
    const { accountId, meetingNotes, targetProjectId } = req.body || {};
    if (!accountId || !meetingNotes) {
      res.status(400).json({ error: 'accountId and meetingNotes are required in request body.' });
      return;
    }

    const tenantId = (req.user || req.tenantContext)!.tenantId;
    const userId = (req.user || req.tenantContext)?.userId;

    await executeGuardedMcpTool({
      req,
      res,
      toolName: 'generateTasksFromMeetingNotes',
      defaultAgent: 'Worker',
      entityType: 'account',
      primaryEntityId: String(accountId),
      successStatus: 201,
      invoke: (requestId) =>
        generateTasksFromMeetingNotes(
          tenantId,
          String(accountId),
          String(meetingNotes),
          targetProjectId ? String(targetProjectId) : undefined,
          userId,
          { requestId }
        ),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to generate tasks from meeting notes.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

export default mcpRouter;
