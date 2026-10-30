/**
 * Social Media Module Frontend Type Definitions
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

export interface SocialListeningRule {
  id: string;
  tenantId: string;
  name: string;
  keywords: string[];
  excludedWords?: string[] | null;
  platforms: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    interactions: number;
  };
}

export interface SocialInteraction {
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
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  rule?: SocialListeningRule | null;
  escalatedTask?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectId: string;
  } | null;
  linkedContact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountId?: string;
  } | null;
  linkedAccount?: {
    id: string;
    accountName: string;
  } | null;
}

export interface SocialFeedResponse {
  data: SocialInteraction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
