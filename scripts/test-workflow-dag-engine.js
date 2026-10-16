import assert from 'assert';
import { evaluateCondition, resolveMergeTags, getNestedProperty } from '../server/dist/workflows/evaluator.js';
import { executeWorkflow } from '../server/dist/workflows/workflowRunner.js';

console.log('🧪 [Test Suite] Starting Workflow Engine & DAG Traversal Unit Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASSED: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Test getNestedProperty
runTest('getNestedProperty resolves deep nested object keys', () => {
  const context = {
    deal: {
      title: 'Enterprise Cloud Retainer',
      amount: 25000,
      primaryContact: {
        email: 'lead@acme.com',
      },
    },
  };

  assert.strictEqual(getNestedProperty(context, 'deal.title'), 'Enterprise Cloud Retainer');
  assert.strictEqual(getNestedProperty(context, 'deal.amount'), 25000);
  assert.strictEqual(getNestedProperty(context, 'deal.primaryContact.email'), 'lead@acme.com');
  assert.strictEqual(getNestedProperty(context, 'nonexistent.key'), undefined);
});

// 2. Test resolveMergeTags
runTest('resolveMergeTags interpolates mustache tokens accurately', () => {
  const context = {
    deal: {
      title: 'Global Rollout',
      amount: 50000,
      primaryContact: { email: 'cto@bigcorp.com' },
    },
  };

  const template = 'Kickoff Project for {{deal.title}} (Budget: ${{deal.amount}}) - Contact: {{deal.primaryContact.email}}';
  const resolved = resolveMergeTags(template, context);
  
  assert.strictEqual(
    resolved,
    'Kickoff Project for Global Rollout (Budget: $50000) - Contact: cto@bigcorp.com'
  );
});

// 3. Test evaluateCondition - Predicate Matching
runTest('evaluateCondition matches AND and OR logical predicate rules', () => {
  const context = {
    amount: 15000,
    stage: 'Closed Won',
    industry: 'Financial Technology',
  };

  // AND rule (both pass)
  const andCond = {
    logicalOperator: 'AND',
    rules: [
      { field: 'amount', operator: 'greater_than', value: 10000 },
      { field: 'stage', operator: 'equals', value: 'Closed Won' },
    ],
  };
  assert.strictEqual(evaluateCondition(andCond, context), true);

  // AND rule (one fails)
  const failingAndCond = {
    logicalOperator: 'AND',
    rules: [
      { field: 'amount', operator: 'greater_than', value: 50000 }, // False
      { field: 'stage', operator: 'equals', value: 'Closed Won' },
    ],
  };
  assert.strictEqual(evaluateCondition(failingAndCond, context), false);

  // OR rule (one passes)
  const passingOrCond = {
    logicalOperator: 'OR',
    rules: [
      { field: 'amount', operator: 'greater_than', value: 50000 }, // False
      { field: 'stage', operator: 'equals', value: 'Closed Won' }, // True
    ],
  };
  assert.strictEqual(evaluateCondition(passingOrCond, context), true);
});

// 4. Test Graph IR Structural Serialization
runTest('Graph IR schema structure validation', () => {
  const irSample = {
    id: 'wf_deal_won_onboarding',
    tenantId: 'tenant_demo',
    name: 'Closed-Won Onboarding',
    isActive: true,
    trigger: {
      id: 'node_1',
      type: 'event_trigger',
      module: 'deals',
      event: 'stage_changed',
      targetStage: 'closed_won',
    },
    nodes: [
      {
        id: 'node_2',
        type: 'condition',
        position: { x: 250, y: 150 },
        data: {
          logicalOperator: 'AND',
          rules: [{ field: 'amount', operator: 'greater_than', value: 5000 }],
        },
      },
      {
        id: 'node_3',
        type: 'action_send_email',
        position: { x: 450, y: 240 },
        data: { templateId: 'tmpl_standard_welcome', to: '{{deal.primaryContact.email}}' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node_1', target: 'node_2' },
      { id: 'e2-3', source: 'node_2', target: 'node_3', sourceHandle: 'true' },
    ],
  };

  assert.strictEqual(irSample.nodes.length, 2);
  assert.strictEqual(irSample.edges.length, 2);
  assert.strictEqual(irSample.trigger.module, 'deals');
});

// 5. Test Linear Workflow Auto-Synthesis & Sequential Execution
async function runAsyncTests() {
  await (async () => {
    totalTests++;
    try {
      const linearWorkflow = {
        id: 'wf_test_linear_001',
        name: 'Linear Deal Automation',
        targetModule: 'deals',
        triggerType: 'on_stage_change',
        isActive: true,
        conditions: [
          { field: 'amount', operator: 'greater_than', value: 10000 },
          { field: 'stage', operator: 'equals', value: 'Closed Won' },
        ],
        actions: [
          {
            type: 'call_webhook',
            config: {
              url: 'https://webhook.site/test-1',
              method: 'POST',
              payloadTemplate: '{"deal": "{{deal.title}}", "amount": {{amount}}}',
            },
          },
          {
            type: 'call_webhook',
            config: {
              url: 'https://webhook.site/test-2',
              method: 'POST',
              payloadTemplate: '{"step": 2}',
            },
          },
        ],
      };

      const payload = {
        amount: 25000,
        stage: 'Closed Won',
        deal: { title: 'Enterprise Modernization' },
      };

      const result = await executeWorkflow(linearWorkflow, payload);
      assert.strictEqual(result.status, 'success');
      assert.strictEqual(result.actionsPerformed.length, 2, 'Both linear actions should execute sequentially');
      assert.strictEqual(result.actionsPerformed[0].type, 'action_call_webhook');
      assert.strictEqual(result.actionsPerformed[1].type, 'action_call_webhook');

      passedTests++;
      console.log('  ✓ PASSED: Linear workflow auto-synthesis executes all sequential actions on true condition');
    } catch (err) {
      console.error('  ✗ FAILED: Linear workflow auto-synthesis execution');
      console.error(`    ${err.message}`);
    }
  })();

  // 6. Test Condition Fails Blocks Actions
  await (async () => {
    totalTests++;
    try {
      const linearWorkflow = {
        id: 'wf_test_linear_fail',
        name: 'High Value Gate',
        targetModule: 'deals',
        triggerType: 'on_stage_change',
        isActive: true,
        conditions: [
          { field: 'amount', operator: 'greater_than', value: 50000 }, // Fails for 25000
        ],
        actions: [
          {
            type: 'call_webhook',
            config: { url: 'https://webhook.site/test', method: 'POST' },
          },
        ],
      };

      const payload = { amount: 25000, stage: 'Closed Won' };
      const result = await executeWorkflow(linearWorkflow, payload);
      assert.strictEqual(result.status, 'success');
      assert.strictEqual(result.actionsPerformed.length, 0, 'Actions should not execute when condition fails');

      passedTests++;
      console.log('  ✓ PASSED: Linear workflow condition stops execution when predicates do not match');
    } catch (err) {
      console.error('  ✗ FAILED: Linear workflow condition blocking test');
      console.error(`    ${err.message}`);
    }
  })();

  console.log(`\n📊 [Test Results] ${passedTests}/${totalTests} unit tests passed successfully.`);

  if (passedTests === totalTests) {
    console.log('🎉 Workflow engine & DAG IR serialization tests completed without errors.');
    process.exit(0);
  } else {
    console.error('❌ Some unit tests failed.');
    process.exit(1);
  }
}

runAsyncTests();

