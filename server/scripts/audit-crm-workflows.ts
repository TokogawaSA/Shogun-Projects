import http from 'http';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { executeWorkflow } from '../src/workflows/workflowRunner.js';
import { processDealStageUpdated } from '../src/workers/workflowWorker.js';

interface AuditReport {
  recordCreation: Record<string, boolean>;
  recordDeletion: Record<string, boolean>;
  workflows: Record<string, boolean>;
  details: string[];
  errors: string[];
}

async function runCrmAudit(): Promise<void> {
  const report: AuditReport = {
    recordCreation: {},
    recordDeletion: {},
    workflows: {},
    details: [],
    errors: [],
  };

  console.log('====================================================');
  console.log('🔍 [CRM AUDIT] Starting Full Verification of CRM & Workflows');
  console.log('====================================================\n');

  // Start internal test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // -----------------------------------------------------------------
    // 1. Authenticate & Obtain Multi-Tenant JWT Token
    // -----------------------------------------------------------------
    console.log('--- Step 1: Admin Authentication ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shogunate.solutions',
        password: 'AdminPassword@2026',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    const tenantId = loginData.tenant?.id || 'tenant-enterprise-root';
    const userId = loginData.user?.id || 'usr-admin-master';

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    report.details.push(`Authenticated as ${loginData.user?.email} (Tenant: ${tenantId})`);
    console.log(`✓ Authenticated as ${loginData.user?.email} (Tenant: ${tenantId})\n`);

    const runId = Date.now().toString().slice(-5);

    // -----------------------------------------------------------------
    // 2. AUDIT: Record Creation across all 4 CRM Modules
    // -----------------------------------------------------------------
    console.log('--- Step 2: Testing Record Creation Across All CRM Modules ---');

    // 2a. Create Account
    const accRes = await fetch(`${baseUrl}/crm/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountName: `Audit Corp ${runId}`,
        domain: `audit${runId}.com`,
        industry: 'Software & Cloud Automation',
        accountType: 'customer',
        rating: 'hot',
        annualRevenue: 3500000,
        billingCity: 'San Francisco',
        billingCountry: 'USA',
      }),
    });
    const createdAccount = await accRes.json();
    if (accRes.ok && createdAccount.id) {
      report.recordCreation['accounts'] = true;
      report.details.push(`Account created successfully: ID=${createdAccount.id}, Name=${createdAccount.accountName}`);
      console.log(`  ✓ Created Account: ID=${createdAccount.id}, Number=${createdAccount.accountNumber}`);
    } else {
      report.recordCreation['accounts'] = false;
      report.errors.push(`Account creation failed: ${JSON.stringify(createdAccount)}`);
      console.error(`  ✗ Failed to create Account:`, createdAccount);
    }

    // 2b. Create Contact (Linked to Account)
    const conRes = await fetch(`${baseUrl}/crm/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Elena',
        lastName: `Rostova ${runId}`,
        accountId: createdAccount.id,
        email: `elena.${runId}@audit.com`,
        phone: '+1 (555) 300-4001',
        jobTitle: 'VP Technology',
        isPrimaryContact: true,
      }),
    });
    const createdContact = await conRes.json();
    if (conRes.ok && createdContact.id) {
      report.recordCreation['contacts'] = true;
      report.details.push(`Contact created successfully: ID=${createdContact.id}, Name=${createdContact.firstName} ${createdContact.lastName}`);
      console.log(`  ✓ Created Contact: ID=${createdContact.id}, Number=${createdContact.contactNumber}`);
    } else {
      report.recordCreation['contacts'] = false;
      report.errors.push(`Contact creation failed: ${JSON.stringify(createdContact)}`);
      console.error(`  ✗ Failed to create Contact:`, createdContact);
    }

    // 2c. Create Deal (Linked to Account & Contact)
    const dealRes = await fetch(`${baseUrl}/crm/deals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dealName: `Audit Opportunity ${runId}`,
        accountId: createdAccount.id,
        contactId: createdContact.id,
        amount: 180000,
        currency: 'USD',
        stage: 'negotiation_review',
        probability: 75,
        dealType: 'new_business',
      }),
    });
    const createdDeal = await dealRes.json();
    if (dealRes.ok && createdDeal.id) {
      report.recordCreation['deals'] = true;
      report.details.push(`Deal created successfully: ID=${createdDeal.id}, Name=${createdDeal.dealName}`);
      console.log(`  ✓ Created Deal: ID=${createdDeal.id}, Number=${createdDeal.dealNumber}`);
    } else {
      report.recordCreation['deals'] = false;
      report.errors.push(`Deal creation failed: ${JSON.stringify(createdDeal)}`);
      console.error(`  ✗ Failed to create Deal:`, createdDeal);
    }

    // 2d. Create Lead
    const leadRes = await fetch(`${baseUrl}/crm/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Marcus',
        lastName: `Vance ${runId}`,
        company: `Vance Dynamics ${runId}`,
        email: `marcus.${runId}@vancedynamics.io`,
        phone: '+1 (555) 789-5555',
        leadStatus: 'pre_qualified',
        rating: 'hot',
        industry: 'Robotics',
        annualRevenue: 2000000,
      }),
    });
    const createdLead = await leadRes.json();
    if (leadRes.ok && createdLead.id) {
      report.recordCreation['leads'] = true;
      report.details.push(`Lead created successfully: ID=${createdLead.id}, Name=${createdLead.firstName} ${createdLead.lastName}`);
      console.log(`  ✓ Created Lead: ID=${createdLead.id}, Number=${createdLead.leadNumber}`);
    } else {
      report.recordCreation['leads'] = false;
      report.errors.push(`Lead creation failed: ${JSON.stringify(createdLead)}`);
      console.error(`  ✗ Failed to create Lead:`, createdLead);
    }

    console.log();

    // -----------------------------------------------------------------
    // 3. AUDIT: Workflows
    // -----------------------------------------------------------------
    console.log('--- Step 3: Testing Workflows ---');

    // 3a. Lead Conversion Workflow
    console.log('Testing 3a: Lead Conversion Workflow (Relational Transaction)...');
    const convertRes = await fetch(`${baseUrl}/crm/leads/${createdLead.id}/convert`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountName: `Converted ${createdLead.company}`,
        createAccount: true,
        createContact: true,
        createDeal: true,
        dealName: `Converted Deal for ${createdLead.company}`,
        dealAmount: 95000,
        dealStage: 'qualification',
      }),
    });
    const convertResult = await convertRes.json();
    if (convertRes.ok && convertResult.success && convertResult.accountId && convertResult.contactId) {
      report.workflows['leadConversion'] = true;
      report.details.push(`Lead conversion workflow passed: Account=${convertResult.accountId}, Contact=${convertResult.contactId}, Deal=${convertResult.dealId}`);
      console.log(`  ✓ Lead Conversion Workflow: Account ${convertResult.accountId}, Contact ${convertResult.contactId}, Deal ${convertResult.dealId}`);
    } else {
      report.workflows['leadConversion'] = false;
      report.errors.push(`Lead conversion workflow failed: ${JSON.stringify(convertResult)}`);
      console.error(`  ✗ Lead Conversion Workflow failed:`, convertResult);
    }

    // 3b. Deal Closed-Won Automated Project Provisioning Workflow
    console.log('Testing 3b: Deal Closed-Won Automated Project Provisioning Workflow...');
    const provisionResult = await processDealStageUpdated({
      tenantId,
      dealId: createdDeal.id,
      previousStage: 'negotiation_review',
      newStage: 'closed_won',
      userId,
    });

    if (provisionResult.success && provisionResult.projectId) {
      report.workflows['dealStageProvisioning'] = true;
      report.details.push(`Deal closed-won workflow passed: Provisioned Project ${provisionResult.projectId}`);
      console.log(`  ✓ Deal Closed-Won Workflow: Provisioned Project ID=${provisionResult.projectId}`);

      // Verify provisioned milestones and handover task
      const projectMilestones = await prisma.projectMilestone.findMany({
        where: { projectId: provisionResult.projectId },
      });
      const kickoffTask = await prisma.task.findFirst({
        where: { projectId: provisionResult.projectId, relatedEntityId: createdDeal.id },
      });

      console.log(`    - Provisioned Milestones count: ${projectMilestones.length}`);
      console.log(`    - Kickoff Task Title: "${kickoffTask?.title}" (Priority: ${kickoffTask?.priority}, Agent: ${kickoffTask?.assignedAgent})`);

      if (projectMilestones.length >= 4 && kickoffTask) {
        report.workflows['dealProjectEntitiesVerified'] = true;
        console.log(`  ✓ Project, 4 Delivery Milestones & Kickoff Task Verified in Database`);
      } else {
        report.workflows['dealProjectEntitiesVerified'] = false;
        report.errors.push('Milestones or kickoff task not found in database');
      }
    } else {
      report.workflows['dealStageProvisioning'] = false;
      report.errors.push(`Deal closed-won workflow failed: ${JSON.stringify(provisionResult)}`);
      console.error(`  ✗ Deal closed-won workflow failed:`, provisionResult);
    }

    // 3c. DAG Workflow Engine: Sequential Condition & Action Node Evaluation
    console.log('Testing 3c: Visual DAG Workflow Engine (IR Graph Traversal & Execution)...');
    const mockWorkflowRule = {
      id: `wf_test_${runId}`,
      tenantId,
      name: 'High-Value Deal VIP Task Workflow',
      graphData: {
        trigger: { id: 'node_trigger', type: 'trigger_event' },
        nodes: [
          { id: 'node_trigger', type: 'trigger' },
          {
            id: 'node_condition',
            type: 'condition',
            data: {
              logicalOperator: 'AND',
              rules: [
                { field: 'amount', operator: 'greater_than', value: 50000 },
                { field: 'stage', operator: 'equals', value: 'negotiation_review' },
              ],
            },
          },
          {
            id: 'node_action_task',
            type: 'action_create_task',
            data: {
              taskTitle: 'VIP Executive Briefing for {{dealName}}',
              description: 'Budget ${{amount}} deal in negotiation. Prepare executive strategy deck.',
              priority: 'urgent',
              dueInDays: 3,
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_condition' },
          { id: 'e2', source: 'node_condition', target: 'node_action_task', sourceHandle: 'true' },
        ],
      },
    };

    const dagResult = await executeWorkflow(mockWorkflowRule, {
      tenantId,
      userId,
      dealName: 'Aetherial Mega Expansion',
      amount: 150000,
      stage: 'negotiation_review',
    });

    if (dagResult.status === 'success' && dagResult.actionsPerformed.length > 0) {
      report.workflows['dagEngineExecution'] = true;
      report.details.push(`DAG workflow engine passed: Executed nodes [${dagResult.executedNodeIds.join(' -> ')}]`);
      console.log(`  ✓ DAG Engine Execution: Path=[${dagResult.executedNodeIds.join(' -> ')}], Actions=${dagResult.actionsPerformed.length}`);
    } else {
      report.workflows['dagEngineExecution'] = false;
      report.errors.push(`DAG engine execution failed: ${JSON.stringify(dagResult)}`);
      console.error(`  ✗ DAG Engine Execution failed:`, dagResult);
    }

    console.log();

    // -----------------------------------------------------------------
    // 4. AUDIT: Record Deletion across all 4 CRM Modules
    // -----------------------------------------------------------------
    console.log('--- Step 4: Testing Record Deletion Across All CRM Modules ---');

    // 4a. Delete Lead
    const delLeadRes = await fetch(`${baseUrl}/crm/leads/${createdLead.id}`, {
      method: 'DELETE',
      headers,
    });
    if (delLeadRes.ok) {
      const leadAfter = await prisma.lead.findUnique({ where: { id: createdLead.id } });
      if (!leadAfter) {
        report.recordDeletion['leads'] = true;
        console.log(`  ✓ Lead ${createdLead.id} successfully deleted from database`);
      } else {
        report.recordDeletion['leads'] = false;
        report.errors.push(`Lead ${createdLead.id} still found in database after delete`);
      }
    } else {
      report.recordDeletion['leads'] = false;
      report.errors.push(`Delete lead failed: status ${delLeadRes.status}`);
    }

    // 4b. Delete Deal
    const delDealRes = await fetch(`${baseUrl}/crm/deals/${createdDeal.id}`, {
      method: 'DELETE',
      headers,
    });
    if (delDealRes.ok) {
      const dealAfter = await prisma.deal.findUnique({ where: { id: createdDeal.id } });
      if (!dealAfter) {
        report.recordDeletion['deals'] = true;
        console.log(`  ✓ Deal ${createdDeal.id} successfully deleted from database`);
      } else {
        report.recordDeletion['deals'] = false;
        report.errors.push(`Deal ${createdDeal.id} still found in database after delete`);
      }
    } else {
      report.recordDeletion['deals'] = false;
      report.errors.push(`Delete deal failed: status ${delDealRes.status}`);
    }

    // 4c. Delete Contact
    const delContactRes = await fetch(`${baseUrl}/crm/contacts/${createdContact.id}`, {
      method: 'DELETE',
      headers,
    });
    if (delContactRes.ok) {
      const contactAfter = await prisma.contact.findUnique({ where: { id: createdContact.id } });
      if (!contactAfter) {
        report.recordDeletion['contacts'] = true;
        console.log(`  ✓ Contact ${createdContact.id} successfully deleted from database`);
      } else {
        report.recordDeletion['contacts'] = false;
        report.errors.push(`Contact ${createdContact.id} still found in database after delete`);
      }
    } else {
      report.recordDeletion['contacts'] = false;
      report.errors.push(`Delete contact failed: status ${delContactRes.status}`);
    }

    // Clean up converted items from 3a before deleting account
    if (convertResult.dealId) {
      await prisma.deal.delete({ where: { id: convertResult.dealId } }).catch(() => {});
    }
    if (convertResult.contactId) {
      await prisma.contact.delete({ where: { id: convertResult.contactId } }).catch(() => {});
    }
    if (convertResult.accountId) {
      await prisma.account.delete({ where: { id: convertResult.accountId } }).catch(() => {});
    }

    // Clean up provisioned project from 3b
    if (provisionResult.projectId) {
      await prisma.task.deleteMany({ where: { projectId: provisionResult.projectId } });
      await prisma.projectMilestone.deleteMany({ where: { projectId: provisionResult.projectId } });
      await prisma.project.delete({ where: { id: provisionResult.projectId } }).catch(() => {});
    }

    // 4d. Delete Account
    const delAccountRes = await fetch(`${baseUrl}/crm/accounts/${createdAccount.id}`, {
      method: 'DELETE',
      headers,
    });
    if (delAccountRes.ok) {
      const accountAfter = await prisma.account.findUnique({ where: { id: createdAccount.id } });
      if (!accountAfter) {
        report.recordDeletion['accounts'] = true;
        console.log(`  ✓ Account ${createdAccount.id} successfully deleted from database`);
      } else {
        report.recordDeletion['accounts'] = false;
        report.errors.push(`Account ${createdAccount.id} still found in database after delete`);
      }
    } else {
      report.recordDeletion['accounts'] = false;
      report.errors.push(`Delete account failed: status ${delAccountRes.status}`);
    }

    console.log();
    console.log('====================================================');
    console.log('📊 [CRM AUDIT SUMMARY]');
    console.log('====================================================');
    console.log('Record Creation:');
    for (const [mod, status] of Object.entries(report.recordCreation)) {
      console.log(`  - ${mod.padEnd(12)}: ${status ? '✓ PASSED' : '✗ FAILED'}`);
    }
    console.log('Record Deletion:');
    for (const [mod, status] of Object.entries(report.recordDeletion)) {
      console.log(`  - ${mod.padEnd(12)}: ${status ? '✓ PASSED' : '✗ FAILED'}`);
    }
    console.log('Workflows:');
    for (const [wf, status] of Object.entries(report.workflows)) {
      console.log(`  - ${wf.padEnd(28)}: ${status ? '✓ PASSED' : '✗ FAILED'}`);
    }

    if (report.errors.length > 0) {
      console.log('\nErrors Encountered:');
      report.errors.forEach((err) => console.log(`  - ${err}`));
    } else {
      console.log('\n🎉 All CRM record creation, workflows, and deletions passed with ZERO errors!');
    }
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runCrmAudit().catch((err) => {
  console.error('[CRM Audit Fatal Error]:', err);
  process.exit(1);
});
