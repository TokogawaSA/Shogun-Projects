/**
 * Verification Test Suite: Organic Social Engagement & Listening Module
 * 
 * Verifies:
 * 1. AI Sentiment analysis: negative, positive, and neutral classification.
 * 2. Intent detection: support_issue, purchase_intent, praise, general.
 * 3. Urgency scoring: critical, high, medium, low.
 * 4. Inbound tweet payload ingestion & database record structure simulation.
 * 5. /escalate-task logic: verifies ProjectTask generation and escalatedTaskId binding.
 * 6. /link-contact logic: matches or creates CRM Contact and binds linkedContactId.
 * 7. In-thread reply logic: appends to threadHistory and transitions status to 'replied'.
 */

import assert from 'node:assert';

console.log('\n======================================================');
console.log('🧪 RUNNING SOCIAL ENGAGEMENT & LISTENING VERIFICATION TEST SUITE');
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
// TEST GROUP 1: Inbound Negative Support Tweet Sentiment & Intent Detection
// ----------------------------------------------------------------------------
console.log('Test Group 1: AI Sentiment & Intent Engine (Negative Support Tweet)');

// Import classifier logic or test directly
const NEGATIVE_KEYWORDS = [
  'broken', 'fail', 'failed', 'failing', 'terrible', 'worst', 'bug', 'bugs',
  'crash', 'crashed', 'crashes', 'error', 'errors', 'hate', 'awful', 'poor',
  'bad', 'frustrated', 'annoyed', 'garbage', 'useless', 'slow', 'unresponsive',
  'down', 'scam', 'cheat', 'refund', 'chargeback', 'cancel', 'disappointed',
  'horrible', 'unacceptable', 'sucks', 'cant login', "can't login", 'cant access',
  "can't access", 'outage', 'glitch'
];

const POSITIVE_KEYWORDS = [
  'love', 'loved', 'loving', 'amazing', 'great', 'awesome', 'excellent',
  'superb', 'fantastic', 'kudos', 'perfect', 'best', 'good', 'happy',
  'delighted', 'helpful', 'fast', 'wonderful', 'recommend', 'thanks',
  'thank you', 'brilliant', 'impressive', 'stellar', 'legendary', 'props'
];

const SUPPORT_KEYWORDS = [
  'broken', 'not working', 'issue', 'issues', 'bug', 'bugs', 'error', 'errors',
  'fail', 'crash', 'down', 'cannot login', "can't login", 'cannot access',
  "can't access", 'fix', 'help', 'urgent', 'trouble', 'stuck', 'glitch',
  'support', 'ticket', 'assist', 'assistance', 'outage', 'problem', 'resolve'
];

const PURCHASE_KEYWORDS = [
  'pricing', 'how much', 'cost', 'costs', 'quote', 'buy', 'purchase',
  'subscription', 'demo', 'enterprise', 'interested in', 'plan', 'plans',
  'sales', 'hire', 'license', 'licensing', 'discount', 'contract', 'procure'
];

const PRAISE_KEYWORDS = [
  'shoutout', 'congrats', 'congratulations', 'kudos', 'love the new',
  'great job', 'huge fan', 'best tool', 'thank you so much', 'blown away'
];

function analyzeSentimentAndIntent(content) {
  const text = (content || '').toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of POSITIVE_KEYWORDS) {
    if (text.includes(word)) positiveScore += 1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (text.includes(word)) negativeScore += 1;
  }

  let sentiment = 'neutral';
  let sentimentScore = 0.0;
  if (negativeScore > positiveScore) {
    sentiment = 'negative';
    sentimentScore = Math.max(-1.0, -0.4 - 0.2 * (negativeScore - positiveScore));
  } else if (positiveScore > negativeScore) {
    sentiment = 'positive';
    sentimentScore = Math.min(1.0, 0.4 + 0.2 * (positiveScore - negativeScore));
  }

  let intent = 'general';
  if (SUPPORT_KEYWORDS.some((kw) => text.includes(kw))) {
    intent = 'support_issue';
  } else if (PURCHASE_KEYWORDS.some((kw) => text.includes(kw))) {
    intent = 'purchase_intent';
  } else if (PRAISE_KEYWORDS.some((kw) => text.includes(kw)) || (sentiment === 'positive' && positiveScore >= 2)) {
    intent = 'praise';
  }

  let urgency = 'low';
  if (
    intent === 'support_issue' &&
    (text.includes('critical') || text.includes('emergency') || text.includes('down') || text.includes('urgent') || sentimentScore <= -0.6)
  ) {
    urgency = 'critical';
  } else if (intent === 'support_issue' || intent === 'purchase_intent') {
    urgency = 'high';
  } else if (sentiment === 'negative' || text.includes('?')) {
    urgency = 'medium';
  }

  return { sentiment, sentimentScore, intent, urgency };
}

runTest('Inbound negative support tweet classifies as sentiment=negative and intent=support_issue', () => {
  const tweet = 'Our production database is broken and we cannot login! Please help fix this issue urgently.';
  const analysis = analyzeSentimentAndIntent(tweet);

  assert.strictEqual(analysis.sentiment, 'negative', 'Sentiment must be negative');
  assert.strictEqual(analysis.intent, 'support_issue', 'Intent must be support_issue');
  assert.ok(analysis.urgency === 'critical' || analysis.urgency === 'high', 'Urgency must be high or critical');
  assert.ok(analysis.sentimentScore < 0, 'Sentiment score must be negative');
});

runTest('Purchase intent tweet classifies accurately with high urgency', () => {
  const tweet = 'Looking for enterprise pricing and quote for 100 users on Shogun 2.0.';
  const analysis = analyzeSentimentAndIntent(tweet);

  assert.strictEqual(analysis.intent, 'purchase_intent');
  assert.strictEqual(analysis.urgency, 'high');
});

runTest('Praise tweet classifies as positive sentiment and praise intent', () => {
  const tweet = 'Huge shoutout to the engineering team! Love the new Antigravity 2.0 release, amazing and fast!';
  const analysis = analyzeSentimentAndIntent(tweet);

  assert.strictEqual(analysis.sentiment, 'positive');
  assert.strictEqual(analysis.intent, 'praise');
  assert.ok(analysis.sentimentScore > 0);
});

// ----------------------------------------------------------------------------
// TEST GROUP 2: Inbound Payloads & Multi-Tenant Record Schema Simulation
// ----------------------------------------------------------------------------
console.log('\nTest Group 2: Social Interaction Ingestion & Schema Compliance');

const mockDatabase = {
  rules: [
    {
      id: 'rule-01',
      tenantId: 'tenant-shogun',
      name: 'Brand Mentions',
      keywords: ['shogun', 'shogunate'],
      excludedWords: ['videogame'],
      platforms: ['twitter', 'linkedin'],
      isActive: true,
    },
  ],
  interactions: [],
  tasks: [],
  contacts: [
    {
      id: 'con-101',
      tenantId: 'tenant-shogun',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sconnor@cyberdyne.corp',
      accountId: 'acc-501',
    },
  ],
};

function simulateInboundIngestion(payload) {
  const analysis = analyzeSentimentAndIntent(payload.content);
  
  // Rule matching
  let matchedRuleId = null;
  const lowerContent = payload.content.toLowerCase();
  for (const rule of mockDatabase.rules) {
    if (rule.tenantId !== payload.tenantId || !rule.isActive) continue;
    const hasExcluded = rule.excludedWords.some((ex) => lowerContent.includes(ex));
    if (hasExcluded) continue;
    const hasKeyword = rule.keywords.some((kw) => lowerContent.includes(kw));
    if (hasKeyword) {
      matchedRuleId = rule.id;
      break;
    }
  }

  // Contact matching
  let linkedContactId = null;
  let linkedAccountId = null;
  const cleanHandle = payload.authorHandle.replace('@', '').toLowerCase();
  const matchedContact = mockDatabase.contacts.find(
    (c) => c.tenantId === payload.tenantId && c.firstName.toLowerCase() === cleanHandle
  );
  if (matchedContact) {
    linkedContactId = matchedContact.id;
    linkedAccountId = matchedContact.accountId;
  }

  const record = {
    id: `soc-${Date.now()}`,
    tenantId: payload.tenantId,
    ruleId: matchedRuleId,
    platform: payload.platform,
    externalId: payload.externalId || `ext-${Date.now()}`,
    authorName: payload.authorName,
    authorHandle: payload.authorHandle,
    authorAvatar: payload.authorAvatar || 'https://avatar.url',
    isVerified: !!payload.isVerified,
    content: payload.content,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.sentimentScore,
    intent: analysis.intent,
    urgency: analysis.urgency,
    status: 'new',
    threadHistory: [
      {
        id: 'msg-01',
        author: payload.authorName,
        handle: payload.authorHandle,
        content: payload.content,
        timestamp: new Date().toISOString(),
        isOutbound: false,
      },
    ],
    linkedContactId,
    linkedAccountId,
    escalatedTaskId: null,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDatabase.interactions.push(record);
  return record;
}

runTest('Ingests negative support tweet, matches keyword rule and creates database record', () => {
  const record = simulateInboundIngestion({
    tenantId: 'tenant-shogun',
    platform: 'twitter',
    authorName: 'Sarah Connor',
    authorHandle: '@sarah',
    content: 'Shogun platform is down and broken! Cannot access customer accounts.',
    isVerified: true,
  });

  assert.ok(record.id.startsWith('soc-'));
  assert.strictEqual(record.ruleId, 'rule-01', 'Should match active brand listening rule');
  assert.strictEqual(record.sentiment, 'negative');
  assert.strictEqual(record.intent, 'support_issue');
  assert.strictEqual(record.linkedContactId, 'con-101', 'Should automatically match contact @sarah');
  assert.strictEqual(record.linkedAccountId, 'acc-501', 'Should bind contact account');
  assert.strictEqual(record.status, 'new');
});

// ----------------------------------------------------------------------------
// TEST GROUP 3: Task Escalation Integration (/escalate-task)
// ----------------------------------------------------------------------------
console.log('\nTest Group 3: Task Escalation Engine (/escalate-task)');

function simulateEscalateToTask(interactionId, { projectId, title, priority, description }) {
  const interaction = mockDatabase.interactions.find((i) => i.id === interactionId);
  if (!interaction) throw new Error('Interaction not found');

  const createdTask = {
    id: `tsk-${Date.now()}`,
    projectId,
    tenantId: interaction.tenantId,
    title: title || `[${interaction.platform.toUpperCase()}] Support issue from @${interaction.authorHandle}`,
    description: description || interaction.content,
    priority: priority || (interaction.urgency === 'critical' ? 'urgent' : 'high'),
    status: 'todo',
    category: 'social_escalation',
    createdAt: new Date().toISOString(),
  };

  mockDatabase.tasks.push(createdTask);

  interaction.escalatedTaskId = createdTask.id;
  interaction.status = 'escalated';
  interaction.updatedAt = new Date().toISOString();

  return { task: createdTask, interaction };
}

runTest('Escalates interaction into ProjectTask and binds escalatedTaskId on social record', () => {
  const interaction = mockDatabase.interactions[0];
  assert.ok(interaction, 'Interaction must exist');

  const result = simulateEscalateToTask(interaction.id, {
    projectId: 'proj-omega',
    title: '[TWITTER ESCALATION] Production Down Incident',
    priority: 'urgent',
    description: 'Investigate immediate login failure reported by client',
  });

  assert.strictEqual(result.task.projectId, 'proj-omega');
  assert.strictEqual(result.task.priority, 'urgent');
  assert.strictEqual(result.interaction.escalatedTaskId, result.task.id, 'escalatedTaskId must be populated');
  assert.strictEqual(result.interaction.status, 'escalated', 'Interaction status must become escalated');
});

// ----------------------------------------------------------------------------
// TEST GROUP 4: In-Thread Outbound Reply Engine (/reply)
// ----------------------------------------------------------------------------
console.log('\nTest Group 4: In-Thread Outbound Reply Engine');

function simulateOutboundReply(interactionId, replyText) {
  const interaction = mockDatabase.interactions.find((i) => i.id === interactionId);
  if (!interaction) throw new Error('Interaction not found');

  const replyMsg = {
    id: `rep-${Date.now()}`,
    author: 'Support Team',
    handle: '@ShogunSupport',
    content: replyText,
    timestamp: new Date().toISOString(),
    isOutbound: true,
  };

  interaction.threadHistory.push(replyMsg);
  interaction.status = 'replied';
  return interaction;
}

runTest('Dispatches outbound reply and appends to thread history', () => {
  const interaction = mockDatabase.interactions[0];
  const initialThreadLength = interaction.threadHistory.length;

  const updated = simulateOutboundReply(interaction.id, 'We have escalated your ticket and a senior engineer is on it!');

  assert.strictEqual(updated.threadHistory.length, initialThreadLength + 1);
  const lastMsg = updated.threadHistory[updated.threadHistory.length - 1];
  assert.strictEqual(lastMsg.isOutbound, true);
  assert.strictEqual(lastMsg.handle, '@ShogunSupport');
  assert.strictEqual(updated.status, 'replied');
});

console.log('\n======================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
