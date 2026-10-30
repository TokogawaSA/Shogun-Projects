/**
 * Social Media Module Backend Type Definitions
 */

export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'reddit' | 'youtube' | string;
export type SocialSentiment = 'positive' | 'neutral' | 'negative';
export type SocialIntent = 'support_issue' | 'purchase_intent' | 'praise' | 'general';
export type SocialUrgency = 'low' | 'medium' | 'high' | 'critical';
export type SocialInteractionStatus = 'new' | 'in_progress' | 'replied' | 'escalated' | 'resolved' | 'ignored';

export interface SocialThreadMessage {
  id: string;
  author: string;
  handle: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
  isOutbound: boolean;
}

export interface SocialListeningRuleModel {
  id: string;
  tenantId: string;
  name: string;
  keywords: string[];
  excludedWords?: string[] | null;
  platforms: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SocialInteractionModel {
  id: string;
  tenantId: string;
  ruleId?: string | null;
  platform: SocialPlatform;
  externalId?: string | null;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string | null;
  isVerified: boolean;
  content: string;
  mediaUrls?: string[] | null;
  sentiment: SocialSentiment;
  sentimentScore?: number | null;
  intent: SocialIntent;
  urgency: SocialUrgency;
  status: SocialInteractionStatus;
  threadHistory?: SocialThreadMessage[] | null;
  escalatedTaskId?: string | null;
  linkedContactId?: string | null;
  linkedAccountId?: string | null;
  linkedDealId?: string | null;
  postUrl?: string | null;
  publishedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InboundSocialPayload {
  tenantId: string;
  platform: SocialPlatform;
  externalId?: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  isVerified?: boolean;
  content: string;
  mediaUrls?: string[];
  ruleId?: string;
  postUrl?: string;
  publishedAt?: string | Date;
}

export interface OutboundReplyPayload {
  replyText: string;
}

export interface EscalateTaskPayload {
  projectId: string;
  title?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
}

export interface LinkContactPayload {
  contactId?: string;
  newContact?: {
    firstName: string;
    lastName: string;
    email: string;
    accountId?: string;
    phone?: string;
  };
}

export interface SocialQueryFilters {
  page?: number;
  limit?: number;
  platform?: string;
  sentiment?: SocialSentiment;
  intent?: SocialIntent;
  status?: SocialInteractionStatus;
  search?: string;
  contactId?: string;
  accountId?: string;
  urgency?: SocialUrgency;
}
