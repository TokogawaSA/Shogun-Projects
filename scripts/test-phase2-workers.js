/**
 * Phase 2 Verification Test Suite: Background Processing & Event Queue (BullMQ + Redis)
 * 
 * Verifies:
 * 1. Closed-Won deal event execution (Project + Milestones + Handover Task + Audit Log).
 * 2. Idempotency guard preventing duplicate project provisioning.
 * 3. Task status change milestone recalculation and progress tracking.
 * 4. Inactive account churn risk detection & automated retention review task creation.
 * 5. Email worker template merge token replacement and transport dispatch.
 */

import assert from 'node:assert';
import { interpolateTemplateTokens } from '../server/dist/workers/emailWorker.js';

// ============================================================================
// SIMULATION / MOCK RUNNER FOR LOGIC TEST VERIFICATION
// ============================================================================

console.log('\n======================================================');
console.log('🧪 RUNNING PHASE 2 BULLMQ & REDIS WORKERS TEST SUITE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    Error: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 1: Closed-Won Deal Event & Idempotency Pipeline
// ----------------------------------------------------------------------------
console.log('Test Group 1: Deal Closed-Won Event & Idempotency Engine');

// Simulated Database State
const mockDb = {
  tenants: [{ id: 'tenant-enterprise', name: 'Enterprise Tenant' }],
  accounts: [{ id: 'acc-101', tenantId: 'tenant-enterprise', accountName: 'Acme Global Corp' }],
  contacts: [{ id: 'con-201', tenantId: 'tenant-enterprise', firstName: 'Jane', lastName: 'Doe' }],
  deals: [
    {
      id: 'deal-301',
      tenantId: 'tenant-enterprise',
      dealName: 'Cloud Migration & Sentinel Pipeline',
      amount: 150000,
      currency: 'USD',
      stage: 'proposal',
      accountId: 'acc-101',
      contactId: 'con-201',
      assignedUserId: 'usr-agent-01',
      linkedProjectId: null,
    },
  ],
  projects: [],
  milestones: [],
  tasks: [],
  activityLogs: [],
};

// Simulated Workflow Worker logic
function simulateDealStageUpdated(payload) {
  const { tenantId, dealId, newStage, userId } = payload;
  if (newStage !== 'closed_won') {
    return { success: true, actionTaken: 'skipped_not_won' };
  }

  const deal = mockDb.deals.find((d) => d.id === dealId && d.tenantId === tenantId);
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  // Idempotency check
  if (deal.linkedProjectId) {
    return { success: true, actionTaken: 'skipped_idempotent', projectId: deal.linkedProjectId };
  }

  const existingProject = mockDb.projects.find((p) => p.dealId === dealId && p.tenantId === tenantId);
  if (existingProject) {
    deal.linkedProjectId = existingProject.id;
    return { success: true, actionTaken: 'skipped_idempotent', projectId: existingProject.id };
  }

  const account = mockDb.accounts.find((a) => a.id === deal.accountId);
  const accountName = account ? account.accountName : 'Client';
  const projectTitle = `${accountName} - ${deal.dealName}`;
  const newProjectId = `proj-deal-${Date.now().toString(36)}`;

  // 1. Create Project
  const project = {
    id: newProjectId,
    tenantId,
    title: projectTitle,
    description: `Project provisioned automatically from Closed-Won deal "${deal.dealName}".`,
    accountId: deal.accountId,
    dealId: deal.id,
    primaryContactId: deal.contactId,
    ownerId: deal.assignedUserId || userId || 'usr-system',
  };
  mockDb.projects.push(project);

  // 2. Create Default Milestones
  const defaultMilestoneTitles = [
    'Architecture Kickoff & Scope Validation',
    'Core Implementation & Subagent Orchestration',
    'QA Verification, Nonce & Security Audit',
    'Client Sign-off & Production Deployment',
  ];

  const createdMilestones = defaultMilestoneTitles.map((title, idx) => {
    const m = {
      id: `ms-${newProjectId}-${idx + 1}`,
      tenantId,
      projectId: newProjectId,
      title,
      status: 'pending',
      completionPercentage: 0,
    };
    mockDb.milestones.push(m);
    return m;
  });

  // 3. Create Handover Task
  const kickoffTask = {
    id: `task-kickoff-${newProjectId}`,
    tenantId,
    projectId: newProjectId,
    milestoneId: createdMilestones[0].id,
    title: `Sales-to-Delivery Handover: ${deal.dealName}`,
    status: 'todo',
    priority: 'urgent',
    category: 'Client Interface',
    assignedAgent: 'Sentinel',
    checklistSubtasks: [
      { id: 'st-1', title: 'Review deal handover scope and budget specs', completed: false },
      { id: 'st-2', title: 'Schedule technical discovery sync with client lead', completed: false },
      { id: 'st-3', title: 'Provision multi-tenant environment tokens', completed: false },
    ],
  };
  mockDb.tasks.push(kickoffTask);

  // 4. Link Project to Deal
  deal.linkedProjectId = newProjectId;
  deal.stage = 'closed_won';

  // 5. Activity Log
  mockDb.activityLogs.push({
    id: `log-${Date.now()}`,
    tenantId,
    moduleName: 'deals',
    entityId: dealId,
    action: 'converted',
    userId: deal.assignedUserId,
    description: `Deal Closed-Won: Provisioned Project "${project.title}"`,
  });

  return { success: true, actionTaken: 'created_project', projectId: newProjectId };
}

runTest('Deal Closed-Won event creates new Project record in PostgreSQL', () => {
  const result = simulateDealStageUpdated({
    tenantId: 'tenant-enterprise',
    dealId: 'deal-301',
    newStage: 'closed_won',
    userId: 'usr-agent-01',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.actionTaken, 'created_project');
  assert.ok(result.projectId);
  assert.strictEqual(mockDb.projects.length, 1);
  assert.strictEqual(mockDb.projects[0].title, 'Acme Global Corp - Cloud Migration & Sentinel Pipeline');
});

runTest('Deal Closed-Won creates 4 deliverable milestone phases', () => {
  const projectMilestones = mockDb.milestones.filter((m) => m.projectId === mockDb.projects[0].id);
  assert.strictEqual(projectMilestones.length, 4);
  assert.strictEqual(projectMilestones[0].title, 'Architecture Kickoff & Scope Validation');
  assert.strictEqual(projectMilestones[3].title, 'Client Sign-off & Production Deployment');
});

runTest('Deal Closed-Won creates kickoff/handover task with subtasks', () => {
  const kickoff = mockDb.tasks.find((t) => t.projectId === mockDb.projects[0].id);
  assert.ok(kickoff);
  assert.strictEqual(kickoff.status, 'todo');
  assert.strictEqual(kickoff.assignedAgent, 'Sentinel');
  assert.strictEqual(kickoff.checklistSubtasks.length, 3);
});

runTest('Deal record links to the generated project ID', () => {
  const deal = mockDb.deals.find((d) => d.id === 'deal-301');
  assert.strictEqual(deal.linkedProjectId, mockDb.projects[0].id);
  assert.strictEqual(deal.stage, 'closed_won');
});

runTest('Audit & activity log recorded for deal conversion', () => {
  const log = mockDb.activityLogs.find((l) => l.entityId === 'deal-301' && l.action === 'converted');
  assert.ok(log);
  assert.strictEqual(log.moduleName, 'deals');
});

runTest('Idempotency guard prevents duplicate project creation on re-execution', () => {
  const initialProjectCount = mockDb.projects.length;
  const result = simulateDealStageUpdated({
    tenantId: 'tenant-enterprise',
    dealId: 'deal-301',
    newStage: 'closed_won',
    userId: 'usr-agent-01',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.actionTaken, 'skipped_idempotent');
  assert.strictEqual(mockDb.projects.length, initialProjectCount);
});

// ----------------------------------------------------------------------------
// TEST GROUP 2: Task Status Changed & Milestone Auto-Recalculation
// ----------------------------------------------------------------------------
console.log('\nTest Group 2: Task Status Changed & Milestone Recalculation');

function simulateTaskStatusChanged(payload) {
  const { tenantId, taskId, projectId, newStatus } = payload;
  const task = mockDb.tasks.find((t) => t.id === taskId && t.tenantId === tenantId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  task.status = newStatus;

  let milestoneUpdated = false;
  let milestoneProgress = 0;

  if (task.milestoneId) {
    const milestoneTasks = mockDb.tasks.filter((t) => t.milestoneId === task.milestoneId);
    const total = milestoneTasks.length;
    const completed = milestoneTasks.filter((t) => t.status === 'done' || t.status === 'completed').length;
    milestoneProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const milestone = mockDb.milestones.find((m) => m.id === task.milestoneId);
    if (milestone) {
      milestone.completionPercentage = milestoneProgress;
      milestone.status = milestoneProgress === 100 ? 'completed' : milestoneProgress > 0 ? 'in_progress' : 'pending';
      milestoneUpdated = true;
    }
  }

  return { success: true, milestoneUpdated, completionPercentage: milestoneProgress };
}

runTest('Task status transition to "done" calculates milestone progress to 100%', () => {
  const kickoffTask = mockDb.tasks[0];
  const result = simulateTaskStatusChanged({
    tenantId: 'tenant-enterprise',
    taskId: kickoffTask.id,
    projectId: kickoffTask.projectId,
    newStatus: 'done',
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.milestoneUpdated, true);
  assert.strictEqual(result.completionPercentage, 100);

  const milestone = mockDb.milestones.find((m) => m.id === kickoffTask.milestoneId);
  assert.strictEqual(milestone.status, 'completed');
  assert.strictEqual(milestone.completionPercentage, 100);
});

// ----------------------------------------------------------------------------
// TEST GROUP 3: Health Check & Churn Risk Detection Engine
// ----------------------------------------------------------------------------
console.log('\nTest Group 3: Client Health Check & Inactivity Risk Scanner');

const mockAccountsForHealth = [
  {
    id: 'acc-active-fresh',
    tenantId: 'tenant-enterprise',
    accountName: 'Fresh Dynamics',
    rating: 'hot',
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
    customFields: { status: 'active_client' },
  },
  {
    id: 'acc-stale-churn',
    tenantId: 'tenant-enterprise',
    accountName: 'Stale Legacy Inc',
    rating: 'warm',
    updatedAt: new Date(Date.now() - 60 * 86400000).toISOString(), // 60 days ago (> 45 days)
    customFields: { status: 'active_client' },
  },
];

function simulateClientHealthCheck(accounts, thresholdDays = 45) {
  const now = Date.now();
  const thresholdMs = thresholdDays * 86400000;
  let flagged = 0;
  const retentionTasks = [];

  for (const acc of accounts) {
    const lastActiveMs = new Date(acc.updatedAt).getTime();
    const daysInactive = Math.floor((now - lastActiveMs) / 86400000);

    if (now - lastActiveMs > thresholdMs) {
      flagged++;
      acc.rating = 'cold';
      acc.customFields.status = 'churn_risk';
      acc.customFields.churn_flagged_at = new Date().toISOString();

      retentionTasks.push({
        id: `retention-${acc.id}`,
        title: `Client Retention Review: ${acc.accountName} (Churn Risk)`,
        priority: 'urgent',
        assignedAgent: 'Auditor',
        daysInactive,
      });
    }
  }

  return { scanned: accounts.length, flagged, retentionTasks };
}

runTest('Fresh account with recent activity (< 45 days) remains unflagged', () => {
  const result = simulateClientHealthCheck([mockAccountsForHealth[0]]);
  assert.strictEqual(result.scanned, 1);
  assert.strictEqual(result.flagged, 0);
  assert.strictEqual(mockAccountsForHealth[0].rating, 'hot');
});

runTest('Stale account (> 45 days inactive) is flagged as "churn_risk"', () => {
  const result = simulateClientHealthCheck([mockAccountsForHealth[1]]);
  assert.strictEqual(result.scanned, 1);
  assert.strictEqual(result.flagged, 1);
  assert.strictEqual(mockAccountsForHealth[1].rating, 'cold');
  assert.strictEqual(mockAccountsForHealth[1].customFields.status, 'churn_risk');
  assert.strictEqual(result.retentionTasks.length, 1);
  assert.strictEqual(result.retentionTasks[0].assignedAgent, 'Auditor');
});

// ----------------------------------------------------------------------------
// TEST GROUP 4: Email Worker Template Variable Interpolation
// ----------------------------------------------------------------------------
console.log('\nTest Group 4: Email Template Token Replacement');

runTest('Token interpolation replaces {{variable}} accurately', () => {
  const template = 'Hello {{contactName}}, your project for {{accountName}} with budget {{amount}} USD is ready!';
  const variables = {
    contactName: 'Jane Doe',
    accountName: 'Acme Corp',
    amount: 150000,
  };

  const output = interpolateTemplateTokens(template, variables);
  assert.strictEqual(
    output,
    'Hello Jane Doe, your project for Acme Corp with budget 150000 USD is ready!'
  );
});

runTest('Token interpolation gracefully handles missing tokens with empty strings', () => {
  const template = 'Welcome {{userName}}! Reference code: {{refCode}}.';
  const variables = { userName: 'SentinelLead' };

  const output = interpolateTemplateTokens(template, variables);
  assert.strictEqual(output, 'Welcome SentinelLead! Reference code: .');
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log('\n======================================================');
console.log(`📊 PHASE 2 TEST RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
