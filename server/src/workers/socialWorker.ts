import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { broadcastToTenant } from '../socket.js';
import {
  InboundSocialPayload,
  SocialSentiment,
  SocialIntent,
  SocialUrgency,
  SocialInteractionModel,
} from '../types/social.js';

// ============================================================================
// 1. AI & HEURISTIC SENTIMENT AND INTENT CLASSIFIER
// ============================================================================

export interface AnalysisResult {
  sentiment: SocialSentiment;
  sentimentScore: number;
  intent: SocialIntent;
  urgency: SocialUrgency;
}

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
  'thank you', 'brilliant', 'impressive', 'stellar', 'legendary', 'props',
  'appreciate', 'clean', 'slick'
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
  'sales', 'hire', 'license', 'licensing', 'discount', 'contract', 'procure',
  'trial', 'upgrade'
];

const PRAISE_KEYWORDS = [
  'shoutout', 'congrats', 'congratulations', 'kudos', 'love the new',
  'great job', 'huge fan', 'best tool', 'thank you so much', 'blown away',
  'game changer', 'game-changer', 'hats off'
];

/**
 * Perform AI & sentiment / intent classification on raw text payload
 */
export function analyzeSentimentAndIntent(content: string): AnalysisResult {
  const text = (content || '').toLowerCase();

  // 1. Sentiment Analysis
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of POSITIVE_KEYWORDS) {
    if (text.includes(word)) {
      positiveScore += 1;
    }
  }

  for (const word of NEGATIVE_KEYWORDS) {
    if (text.includes(word)) {
      negativeScore += 1;
    }
  }

  let sentiment: SocialSentiment = 'neutral';
  let sentimentScore = 0.0;

  if (negativeScore > positiveScore) {
    sentiment = 'negative';
    sentimentScore = Math.max(-1.0, -0.4 - (0.2 * (negativeScore - positiveScore)));
  } else if (positiveScore > negativeScore) {
    sentiment = 'positive';
    sentimentScore = Math.min(1.0, 0.4 + (0.2 * (positiveScore - negativeScore)));
  } else {
    sentiment = 'neutral';
    sentimentScore = 0.0;
  }

  // 2. Intent Detection
  let intent: SocialIntent = 'general';

  // Support Issue check
  const isSupport = SUPPORT_KEYWORDS.some((kw) => text.includes(kw));
  // Purchase Intent check
  const isPurchase = PURCHASE_KEYWORDS.some((kw) => text.includes(kw));
  // Praise check
  const isPraise = PRAISE_KEYWORDS.some((kw) => text.includes(kw)) || (sentiment === 'positive' && positiveScore >= 2);

  if (isSupport) {
    intent = 'support_issue';
  } else if (isPurchase) {
    intent = 'purchase_intent';
  } else if (isPraise) {
    intent = 'praise';
  } else {
    intent = 'general';
  }

  // 3. Urgency Scoring
  let urgency: SocialUrgency = 'low';

  if (
    intent === 'support_issue' &&
    (text.includes('critical') ||
      text.includes('emergency') ||
      text.includes('production down') ||
      text.includes('outage') ||
      text.includes('urgent') ||
      sentimentScore <= -0.6)
  ) {
    urgency = 'critical';
  } else if (intent === 'support_issue' || intent === 'purchase_intent') {
    urgency = 'high';
  } else if (sentiment === 'negative' || text.includes('?')) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  return {
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    intent,
    urgency,
  };
}

// ============================================================================
// 2. INGESTION & PROCESSING ENGINE
// ============================================================================

export async function processInboundSocialInteraction(
  payload: InboundSocialPayload
): Promise<SocialInteractionModel> {
  const { tenantId, content, authorHandle, authorName, platform } = payload;

  if (!tenantId) {
    throw new Error('Tenant ID is required for social interaction processing.');
  }
  if (!content) {
    throw new Error('Interaction content cannot be empty.');
  }

  // Run AI analysis
  const analysis = analyzeSentimentAndIntent(content);

  // Store in PostgreSQL with tenant boundary
  const createdRecord = await withTenantTx(tenantId, async (tx) => {
    // 1. Match listening rule if not provided
    let matchedRuleId: string | undefined = payload.ruleId;

    if (!matchedRuleId) {
      const activeRules = await tx.socialListeningRule.findMany({
        where: { tenantId, isActive: true },
      });

      const lowerContent = content.toLowerCase();
      for (const rule of activeRules) {
        const keywords = (rule.keywords as string[]) || [];
        const excluded = (rule.excludedWords as string[]) || [];

        // Must not contain excluded words
        const hasExcluded = excluded.some((ex) => lowerContent.includes(ex.toLowerCase()));
        if (hasExcluded) continue;

        // Must contain at least one keyword
        const hasKeyword = keywords.some((kw) => lowerContent.includes(kw.toLowerCase()));
        if (hasKeyword) {
          matchedRuleId = rule.id;
          break;
        }
      }
    }

    // 2. Match CRM Contact or Account by handle or name
    let linkedContactId: string | undefined;
    let linkedAccountId: string | undefined;

    const cleanHandle = authorHandle ? authorHandle.replace('@', '').toLowerCase() : '';
    if (cleanHandle) {
      const matchedContact = await tx.contact.findFirst({
        where: {
          tenantId,
          OR: [
            { email: { contains: cleanHandle, mode: 'insensitive' } },
            { firstName: { contains: cleanHandle, mode: 'insensitive' } },
            { lastName: { contains: cleanHandle, mode: 'insensitive' } },
          ],
        },
      });

      if (matchedContact) {
        linkedContactId = matchedContact.id;
        linkedAccountId = matchedContact.accountId;
      }
    }

    // 3. Create SocialInteraction record
    const rootThreadMessage = {
      id: `msg-${Date.now()}`,
      author: authorName,
      handle: authorHandle,
      avatarUrl: payload.authorAvatar,
      content,
      timestamp: new Date().toISOString(),
      isOutbound: false,
    };

    const record = await tx.socialInteraction.create({
      data: {
        tenantId,
        ruleId: matchedRuleId || null,
        platform: platform || 'twitter',
        externalId: payload.externalId || `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        authorName: authorName || 'Anonymous User',
        authorHandle: authorHandle || '@anonymous',
        authorAvatar: payload.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorHandle || 'user')}`,
        isVerified: !!payload.isVerified,
        content,
        mediaUrls: payload.mediaUrls || [],
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        intent: analysis.intent,
        urgency: analysis.urgency,
        status: 'new',
        threadHistory: [rootThreadMessage],
        linkedContactId: linkedContactId || null,
        linkedAccountId: linkedAccountId || null,
        postUrl: payload.postUrl || null,
        publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(),
      },
    });

    return record;
  });

  // 4. Emit real-time Socket.io event to tenant room
  try {
    broadcastToTenant(tenantId, 'social:new_interaction', createdRecord);
    console.log(`📡 [Socket.io Event] Broadcasted social:new_interaction to tenant:${tenantId}`);
  } catch (socketErr: any) {
    console.warn('[SocialWorker Socket Warning]:', socketErr.message);
  }

  return createdRecord as unknown as SocialInteractionModel;
}

// ============================================================================
// 3. BULLMQ WORKER INSTANCE
// ============================================================================

export function createSocialAnalysisWorker(): Worker {
  console.log('📡 [SocialWorker] Initializing BullMQ socialAnalysisWorker...');

  const worker = new Worker(
    QUEUE_NAMES.SOCIAL_ANALYSIS,
    async (job: Job<InboundSocialPayload>) => {
      console.log(`📥 [SocialWorker] Processing inbound social job ${job.id} for tenant ${job.data?.tenantId}`);
      return await processInboundSocialInteraction(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [SocialWorker] Job ${job.id} processed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [SocialWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export default createSocialAnalysisWorker;
