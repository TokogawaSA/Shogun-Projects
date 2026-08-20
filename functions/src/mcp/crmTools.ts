import * as admin from 'firebase-admin';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

export interface AccountContextSummary {
  accountId: string;
  accountName: string;
  industry: string;
  tier: string;
  status: string;
  totalDealsCount: number;
  totalDealValue: number;
  activeProjectsCount: number;
  completedTasksCount: number;
  openTasksCount: number;
  executiveSummary: string;
}

/**
 * MCP Tool 1: summarizeAccountContext
 * Aggregates account firmographics, pipeline deals, project execution metrics,
 * and compiles an executive account management summary.
 */
export async function summarizeAccountContext(accountId: string): Promise<AccountContextSummary> {
  const accountDoc = await db.collection('accounts').doc(accountId).get();
  if (!accountDoc.exists) {
    throw new Error(`Account with ID "${accountId}" not found.`);
  }

  const account = accountDoc.data() || {};
  const accountName = account.name || 'Unnamed Client';

  // 1. Fetch Deals
  const dealsSnap = await db.collection('deals').where('accountId', '==', accountId).get();
  const deals = dealsSnap.docs.map((d) => d.data());
  const totalDealValue = deals.reduce((sum, d) => sum + (Number(d.value) || Number(d.amount) || 0), 0);

  // 2. Fetch Linked Projects
  const projectsSnap = await db.collection('projects').where('accountId', '==', accountId).get();
  const projectIds = projectsSnap.docs.map((p) => p.id);

  let completedTasksCount = 0;
  let openTasksCount = 0;

  for (const pid of projectIds) {
    const tasksSnap = await db.collection('projects').doc(pid).collection('tasks').get();
    for (const tDoc of tasksSnap.docs) {
      const task = tDoc.data();
      if (task.status === 'done') {
        completedTasksCount++;
      } else {
        openTasksCount++;
      }
    }
  }

  const executiveSummary = `Executive Summary for ${accountName} (${account.tier?.toUpperCase()} Tier | Status: ${account.status}): ` +
    `Total of ${deals.length} deals on record valued at $${totalDealValue.toLocaleString()}. ` +
    `Currently active across ${projectIds.length} projects with ${completedTasksCount} completed sprint deliverables ` +
    `and ${openTasksCount} ongoing tasks in pipeline.`;

  return {
    accountId,
    accountName,
    industry: account.industry || 'General',
    tier: account.tier || 'starter',
    status: account.status || 'active_client',
    totalDealsCount: deals.length,
    totalDealValue,
    activeProjectsCount: projectIds.length,
    completedTasksCount,
    openTasksCount,
    executiveSummary,
  };
}

/**
 * MCP Tool 2: generateTasksFromMeetingNotes
 * Parses unstructured meeting notes into actionable engineering tasks
 * and batch writes them to the specified project/account in Firestore.
 */
export async function generateTasksFromMeetingNotes(
  accountId: string,
  meetingNotes: string,
  targetProjectId?: string
): Promise<{ createdTaskIds: string[]; taskCount: number; message: string }> {
  if (!meetingNotes.trim()) {
    throw new Error('Meeting notes string cannot be empty.');
  }

  // Find or determine project ID
  let projectId = targetProjectId;
  if (!projectId) {
    const projectsSnap = await db
      .collection('projects')
      .where('accountId', '==', accountId)
      .limit(1)
      .get();

    if (!projectsSnap.empty) {
      projectId = projectsSnap.docs[0].id;
    } else {
      projectId = 'proj-shogun-1';
    }
  }

  // Extract action lines (lines starting with -, *, TODO, Action:, etc.)
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

  // If no bullet points found, create a structured general task from paragraph
  if (actionItems.length === 0) {
    actionItems.push(meetingNotes.slice(0, 120) + (meetingNotes.length > 120 ? '...' : ''));
  }

  const batch = db.batch();
  const createdTaskIds: string[] = [];

  for (let i = 0; i < actionItems.length; i++) {
    const item = actionItems[i];
    const taskId = `TSK-AI-${Date.now().toString(36)}-${i + 1}`;
    const taskRef = db.collection('projects').doc(projectId).collection('tasks').doc(taskId);

    const newTask = {
      id: taskId,
      projectId,
      title: item.length > 80 ? item.slice(0, 77) + '...' : item,
      description: `Parsed from AI meeting notes intake for account ${accountId}.\nFull item: ${item}`,
      status: 'todo',
      priority: i === 0 ? 'high' : 'medium',
      category: 'Client Interface',
      assignedAgent: 'Worker',
      creatorId: 'Agent:generateTasksFromMeetingNotes',
      dueDate: 'Next Sprint',
      progress: 0,
      relatedEntityType: 'account',
      relatedEntityId: accountId,
      subtasks: [
        { id: `st-m-${i}-1`, title: 'Clarify implementation requirements with client contact', completed: false, createdAt: new Date().toISOString() },
        { id: `st-m-${i}-2`, title: 'Execute code changes and run verification tests', completed: false, createdAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    batch.set(taskRef, newTask);
    createdTaskIds.push(taskId);
  }

  await batch.commit();

  return {
    createdTaskIds,
    taskCount: createdTaskIds.length,
    message: `Successfully generated ${createdTaskIds.length} tasks in project ${projectId} linked to account ${accountId}.`,
  };
}
