import { withTenantTx } from '../utils/tenantTx.js';
import { prisma } from '../config/db.js';

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
}

export interface GeneratedTasksResult {
  createdTaskIds: string[];
  taskCount: number;
  projectId: string;
  message: string;
  tasks: Array<{ id: string; title: string; priority: string; status: string }>;
}

/**
 * MCP Tool 1: summarizeAccountContext (PostgreSQL + withTenantTx)
 * Aggregates account firmographics, pipeline deals, projects, and tasks into an executive briefing.
 */
export async function summarizeAccountContext(
  tenantId: string,
  accountId: string
): Promise<AccountContextSummary> {
  return withTenantTx(tenantId, async (tx) => {
    // 1. Fetch Account
    const account = await tx.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        contacts: { select: { id: true, firstName: true, lastName: true, email: true } },
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

    const accountName = account.accountName || 'Unnamed Client';
    const industry = account.industry || 'Enterprise';
    const rating = account.rating || 'active';
    const customFields = (account.customFields as Record<string, any>) || {};
    const status = customFields.status || customFields.lifecycle_stage || 'active_client';

    // 2. Aggregate Deals
    const totalDealsCount = account.deals.length;
    const totalDealValue = account.deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // 3. Aggregate Tasks across linked Projects
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

      completedTasksCount = projectTasks.filter((t) => t.status === 'done' || t.status === 'completed').length;
      openTasksCount = projectTasks.length - completedTasksCount;
    }

    // 4. Compile Structured Executive Summary Markdown
    const executiveSummary =
      `# Executive Briefing: ${accountName}\n` +
      `**Industry**: ${industry} | **Rating**: ${rating.toUpperCase()} | **Status**: ${status}\n\n` +
      `### Commercial Pipeline Overview\n` +
      `- **Active Deals**: ${totalDealsCount} record(s)\n` +
      `- **Total Portfolio Pipeline Value**: $${totalDealValue.toLocaleString('en-US')}\n\n` +
      `### Project Delivery & Operational Velocity\n` +
      `- **Linked Projects**: ${projectIds.length} active\n` +
      `- **Sprint Deliverables**: ${completedTasksCount} completed / ${openTasksCount} in pipeline\n` +
      `- **Stakeholder Contacts Registered**: ${account.contacts.length} stakeholder(s)\n\n` +
      `*Summary generated via Antigravity 2.0 MCP Intelligence Engine.*`;

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
      executiveSummary,
    };
  });
}

/**
 * MCP Tool 2: generateTasksFromMeetingNotes (PostgreSQL + withTenantTx)
 * Parses unstructured meeting notes into actionable tasks and batch writes them to PostgreSQL inside a single transaction.
 */
export async function generateTasksFromMeetingNotes(
  tenantId: string,
  accountId: string,
  meetingNotes: string,
  targetProjectId?: string,
  userId?: string
): Promise<GeneratedTasksResult> {
  if (!meetingNotes || !meetingNotes.trim()) {
    throw new Error('Meeting notes string cannot be empty.');
  }

  return withTenantTx(tenantId, async (tx) => {
    // 1. Resolve target project ID
    let projectId = targetProjectId;
    if (!projectId) {
      const project = await tx.project.findFirst({
        where: { accountId, tenantId },
        orderBy: { createdAt: 'desc' },
      });

      if (project) {
        projectId = project.id;
      } else {
        // Fallback to any active project or create an onboarding project
        const anyProject = await tx.project.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });

        if (anyProject) {
          projectId = anyProject.id;
        } else {
          // Resolve owner
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

    // 2. Extract action items from meeting notes text
    const lines = meetingNotes.split('\n');
    const actionItems: string[] = [];

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
          actionItems.push(cleaned);
        }
      }
    }

    // Fallback to paragraph excerpt if no bullet lines detected
    if (actionItems.length === 0) {
      actionItems.push(meetingNotes.slice(0, 120) + (meetingNotes.length > 120 ? '...' : ''));
    }

    // Resolve creator user
    let creatorId = userId;
    if (!creatorId) {
      const defaultUser = await tx.user.findFirst({ where: { tenantId } });
      creatorId = defaultUser?.id || 'usr-system';
    }

    const createdTaskIds: string[] = [];
    const createdTasksSummary: Array<{ id: string; title: string; priority: string; status: string }> = [];

    // 3. Batch insert tasks with subtask checklists
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

    // 4. Record Activity Log
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

    console.log(`[MCP Tools] Generated ${createdTaskIds.length} tasks in project ${projectId} for account ${accountId}`);

    return {
      createdTaskIds,
      taskCount: createdTaskIds.length,
      projectId: projectId!,
      message: `Successfully generated ${createdTaskIds.length} tasks in project ${projectId} linked to account ${accountId}.`,
      tasks: createdTasksSummary,
    };
  });
}
