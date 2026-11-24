import crypto from 'node:crypto';
import { withTenantTx } from '../utils/tenantTx.js';
import { piiRedactor } from './piiRedactor.js';

export interface AccountContextSummary {
  accountId: string;
  accountName: string;
  industry: string;
  rating: string;
  status: string;
  totalDealsCount: number;
  totalDealValue: number;
  activeProjectsCount: number;
  completedTasksCount: number;
  openTasksCount: number;
  contactsCount: number;
  deals: Array<{ id: string; dealName: string; amount: number; stage: string }>;
  projects: Array<{ id: string; title: string }>;
  executiveSummary: string;
  processedEntityIds?: string[];
  redactionMeta?: {
    requestId: string;
    redactionCount: number;
    categoriesDetected: string[];
  };
}

export interface GeneratedTasksResult {
  createdTaskIds: string[];
  taskCount: number;
  projectId: string;
  message: string;
  tasks: Array<{ id: string; title: string; priority: string; status: string }>;
  processedEntityIds?: string[];
  redactionMeta?: {
    requestId: string;
    redactionCount: number;
    categoriesDetected: string[];
  };
}

export type ExternalLlmInvokeFn = (sanitizedPromptPayload: {
  tool: string;
  context: Record<string, unknown>;
}) => Promise<string>;

let customLlmProvider: ExternalLlmInvokeFn | null = null;

/**
 * Configure or override the external LLM inference adapter (used by MCP AI runtime and tests
 * to inspect outbound redacted LLM payloads).
 */
export function setExternalLlmProvider(provider: ExternalLlmInvokeFn | null): void {
  customLlmProvider = provider;
}

export function getExternalLlmProvider(): ExternalLlmInvokeFn | null {
  return customLlmProvider;
}

/**
 * MCP Tool 1: summarizeAccountContext (PostgreSQL + withTenantTx + POPIA PII Redaction)
 * Aggregates account firmographics, contacts, pipeline deals, projects, and tasks,
 * sanitizes PII via `piiRedactor.sanitize()` before LLM synthesis, and re-hydrates locally.
 */
export async function summarizeAccountContext(
  tenantId: string,
  accountId: string,
  options?: { requestId?: string; llmInvoke?: ExternalLlmInvokeFn }
): Promise<AccountContextSummary> {
  const requestId = options?.requestId ?? crypto.randomUUID();
  const llmInvoke = options?.llmInvoke ?? customLlmProvider;

  const rawData = await withTenantTx(tenantId, async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
          },
        },
        deals: {
          select: { id: true, dealName: true, amount: true, currency: true, stage: true },
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new Error(`Account with ID "${accountId}" not found in tenant "${tenantId}".`);
    }

    const projectIds = account.projects.map((p) => p.id);
    let completedTasksCount = 0;
    let openTasksCount = 0;

    if (projectIds.length > 0) {
      const projectTasks = await tx.task.findMany({
        where: {
          tenantId,
          projectId: { in: projectIds },
        },
        select: { id: true, status: true },
      });

      completedTasksCount = projectTasks.filter(
        (t) => t.status === 'done' || t.status === 'completed'
      ).length;
      openTasksCount = projectTasks.length - completedTasksCount;
    }

    return {
      account,
      projectIds,
      completedTasksCount,
      openTasksCount,
    };
  });

  const { account, projectIds, completedTasksCount, openTasksCount } = rawData;
  const accountName = account.accountName || 'Unnamed Client';
  const industry = account.industry || 'Enterprise';
  const rating = account.rating || 'active';
  const customFields = (account.customFields as Record<string, any>) || {};
  const status = customFields.status || customFields.lifecycle_stage || 'active_client';
  const totalDealsCount = account.deals.length;
  const totalDealValue = account.deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Build context containing potential PII (emails, phones, SA IDs, CIPC/VAT in description/customFields)
  const outboundContext = {
    accountName,
    email: account.email,
    primaryPhone: account.primaryPhone,
    description: account.description,
    customFields,
    industry,
    rating,
    status,
    contacts: account.contacts,
    deals: account.deals.map((d) => ({
      id: d.id,
      dealName: d.dealName,
      amount: d.amount || 0,
      stage: d.stage,
    })),
    projects: account.projects.map((p) => ({
      id: p.id,
      title: p.title,
    })),
  };

  // 1. Sanitize context before outbound LLM processing
  const redaction = await piiRedactor.sanitize(tenantId, outboundContext, requestId);
  const safeCtx = redaction.sanitized;

  // 2. Synthesize executive summary using ONLY sanitized tokens
  let sanitizedSummaryMarkdown: string;
  if (llmInvoke) {
    sanitizedSummaryMarkdown = await llmInvoke({
      tool: 'summarizeAccountContext',
      context: safeCtx as unknown as Record<string, unknown>,
    });
  } else {
    const primaryStakeholderLine =
      safeCtx.contacts.length > 0
        ? `Primary Contact: ${safeCtx.contacts[0].firstName} ${safeCtx.contacts[0].lastName} (${safeCtx.contacts[0].email}${safeCtx.contacts[0].phone ? `, ${safeCtx.contacts[0].phone}` : ''})\n`
        : '';

    sanitizedSummaryMarkdown =
      `# Executive Briefing: ${safeCtx.accountName}\n` +
      `**Industry**: ${safeCtx.industry} | **Rating**: ${safeCtx.rating.toUpperCase()} | **Status**: ${safeCtx.status}\n` +
      (safeCtx.description ? `**Profile Notes**: ${safeCtx.description}\n` : '') +
      `\n### Commercial Pipeline Overview\n` +
      `- **Active Deals**: ${totalDealsCount} record(s)\n` +
      `- **Total Portfolio Pipeline Value**: $${totalDealValue.toLocaleString('en-US')}\n\n` +
      `### Project Delivery & Operational Velocity\n` +
      `- **Linked Projects**: ${projectIds.length} active\n` +
      `- **Sprint Deliverables**: ${completedTasksCount} completed / ${openTasksCount} in pipeline\n` +
      `- **Stakeholder Contacts Registered**: ${safeCtx.contacts.length} stakeholder(s)\n` +
      primaryStakeholderLine +
      `\n*Summary generated via Antigravity 2.0 MCP Intelligence Engine.*`;
  }

  // 3. Re-hydrate placeholders locally inside South Africa before returning to authenticated client
  const hydratedExecutiveSummary = await piiRedactor.rehydrate(
    tenantId,
    sanitizedSummaryMarkdown,
    requestId
  );

  const processedEntityIds = [
    account.id,
    ...account.contacts.map((c) => c.id),
    ...account.deals.map((d) => d.id),
    ...projectIds,
  ];

  return {
    accountId,
    accountName,
    industry,
    rating,
    status,
    totalDealsCount,
    totalDealValue,
    activeProjectsCount: projectIds.length,
    completedTasksCount,
    openTasksCount,
    contactsCount: account.contacts.length,
    deals: account.deals.map((d) => ({
      id: d.id,
      dealName: d.dealName,
      amount: d.amount || 0,
      stage: d.stage,
    })),
    projects: account.projects.map((p) => ({
      id: p.id,
      title: p.title,
    })),
    executiveSummary: hydratedExecutiveSummary,
    processedEntityIds,
    redactionMeta: {
      requestId,
      redactionCount: redaction.redactionCount,
      categoriesDetected: redaction.categoriesDetected,
    },
  };
}

/**
 * MCP Tool 2: generateTasksFromMeetingNotes (PostgreSQL + withTenantTx + POPIA PII Redaction)
 * Sanitizes unstructured meeting notes before LLM extraction, re-hydrates placeholders locally,
 * and batch writes actionable tasks to PostgreSQL inside a single tenant transaction.
 */
export async function generateTasksFromMeetingNotes(
  tenantId: string,
  accountId: string,
  meetingNotes: string,
  targetProjectId?: string,
  userId?: string,
  options?: { requestId?: string; llmInvoke?: ExternalLlmInvokeFn }
): Promise<GeneratedTasksResult> {
  if (!meetingNotes || !meetingNotes.trim()) {
    throw new Error('Meeting notes string cannot be empty.');
  }

  const requestId = options?.requestId ?? crypto.randomUUID();
  const llmInvoke = options?.llmInvoke ?? customLlmProvider;

  // 1. Sanitize raw meeting notes BEFORE sending to external LLM parser
  const redaction = await piiRedactor.sanitize(tenantId, meetingNotes, requestId);
  const sanitizedNotes = redaction.sanitized;

  let sanitizedNotesToParse = sanitizedNotes;
  if (llmInvoke) {
    sanitizedNotesToParse = await llmInvoke({
      tool: 'generateTasksFromMeetingNotes',
      context: { meetingNotes: sanitizedNotes },
    });
  }

  // 2. Extract action items from sanitized LLM output
  const lines = sanitizedNotesToParse.split('\n');
  const sanitizedActionItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      /^(\d+\.)/.test(trimmed) ||
      trimmed.toLowerCase().includes('todo') ||
      trimmed.toLowerCase().includes('action:')
    ) {
      const cleaned = trimmed.replace(/^([-*•]|\d+\.|\bTODO:?|\bAction:?)\s*/i, '').trim();
      if (cleaned.length > 5) {
        sanitizedActionItems.push(cleaned);
      }
    }
  }

  if (sanitizedActionItems.length === 0) {
    sanitizedActionItems.push(
      sanitizedNotesToParse.slice(0, 120) + (sanitizedNotesToParse.length > 120 ? '...' : '')
    );
  }

  // 3. Re-hydrate placeholders locally inside SA before persisting tenant tasks
  const actionItems = await piiRedactor.rehydrate(
    tenantId,
    sanitizedActionItems,
    requestId
  );

  return withTenantTx(tenantId, async (tx) => {
    let projectId = targetProjectId;
    if (!projectId) {
      const project = await tx.project.findFirst({
        where: { accountId, tenantId },
        orderBy: { createdAt: 'desc' },
      });

      if (project) {
        projectId = project.id;
      } else {
        const anyProject = await tx.project.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });

        if (anyProject) {
          projectId = anyProject.id;
        } else {
          const defaultUser = await tx.user.findFirst({ where: { tenantId } });
          const newProj = await tx.project.create({
            data: {
              tenantId,
              title: `Client Deliverables - Account ${accountId}`,
              accountId,
              ownerId: defaultUser?.id || 'usr-system',
            },
          });
          projectId = newProj.id;
        }
      }
    }

    let creatorId = userId;
    if (!creatorId) {
      const defaultUser = await tx.user.findFirst({ where: { tenantId } });
      creatorId = defaultUser?.id || 'usr-system';
    }

    const createdTaskIds: string[] = [];
    const createdTasksSummary: Array<{ id: string; title: string; priority: string; status: string }> = [];

    for (let i = 0; i < actionItems.length; i++) {
      const item = actionItems[i];
      const taskTitle = item.length > 80 ? item.slice(0, 77) + '...' : item;
      const priority = i === 0 ? 'high' : 'medium';

      const task = await tx.task.create({
        data: {
          tenantId,
          projectId: projectId!,
          title: taskTitle,
          description: `Parsed from AI meeting notes intake for account ${accountId}.\nFull item: ${item}`,
          status: 'todo',
          priority,
          category: 'Client Interface',
          assignedAgent: 'Worker',
          creatorId,
          progress: 0,
          relatedEntityType: 'account',
          relatedEntityId: accountId,
          checklistSubtasks: {
            create: [
              { title: 'Clarify implementation requirements with client contact', completed: false },
              { title: 'Execute code changes and run verification tests', completed: false },
            ],
          },
        },
      });

      createdTaskIds.push(task.id);
      createdTasksSummary.push({
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
      });
    }

    await tx.entityActivityLog.create({
      data: {
        tenantId,
        moduleName: 'tasks',
        entityId: projectId!,
        action: 'created',
        userId: creatorId,
        description: `MCP Agent generated ${createdTaskIds.length} tasks from meeting notes intake`,
        fieldChanges: {
          createdTaskIds,
          taskCount: createdTaskIds.length,
        },
      },
    });

    return {
      createdTaskIds,
      taskCount: createdTaskIds.length,
      projectId: projectId!,
      message: `Successfully generated ${createdTaskIds.length} tasks in project ${projectId} linked to account ${accountId}.`,
      tasks: createdTasksSummary,
      processedEntityIds: [accountId, projectId!, ...createdTaskIds],
      redactionMeta: {
        requestId,
        redactionCount: redaction.redactionCount,
        categoriesDetected: redaction.categoriesDetected,
      },
    };
  });
}
