import { apiClient } from '../../../services/api';
import {
  SocialInteraction,
  SocialListeningRule,
  SocialFeedResponse,
  SocialSentiment,
  SocialIntent,
  SocialInteractionStatus,
} from '../../../types/social';

export interface SocialFilterParams {
  page?: number;
  limit?: number;
  platform?: string;
  sentiment?: SocialSentiment | 'all';
  intent?: SocialIntent | 'all';
  status?: SocialInteractionStatus | 'all';
  search?: string;
  contactId?: string;
  accountId?: string;
  urgency?: string;
}

export const socialApi = {
  // 1. Fetch Interactions Feed
  getInteractions: async (params: SocialFilterParams = {}): Promise<SocialFeedResponse> => {
    return apiClient.get<SocialFeedResponse>('/v1/social/interactions', { params });
  },

  // 2. Fetch Single Interaction
  getInteraction: async (id: string): Promise<SocialInteraction> => {
    return apiClient.get<SocialInteraction>(`/v1/social/interactions/${id}`);
  },

  // 3. Dispatch In-Thread Reply
  replyToInteraction: async (id: string, replyText: string): Promise<{ success: boolean; interaction: SocialInteraction }> => {
    return apiClient.post(`/v1/social/interactions/${id}/reply`, { replyText });
  },

  // 4. Escalate to Project Task
  escalateToTask: async (
    id: string,
    payload: { projectId: string; title?: string; priority?: string; description?: string }
  ): Promise<{ success: boolean; task: any; interaction: SocialInteraction }> => {
    return apiClient.post(`/v1/social/interactions/${id}/escalate-task`, payload);
  },

  // 5. Link CRM Contact
  linkContact: async (
    id: string,
    payload: {
      contactId?: string;
      newContact?: { firstName: string; lastName: string; email: string; accountId?: string; phone?: string };
    }
  ): Promise<{ success: boolean; contact: any; interaction: SocialInteraction }> => {
    return apiClient.post(`/v1/social/interactions/${id}/link-contact`, payload);
  },

  // 6. Rules CRUD
  getRules: async (): Promise<SocialListeningRule[]> => {
    return apiClient.get<SocialListeningRule[]>('/v1/social/rules');
  },

  createRule: async (rule: Partial<SocialListeningRule>): Promise<SocialListeningRule> => {
    return apiClient.post<SocialListeningRule>('/v1/social/rules', rule);
  },

  updateRule: async (id: string, rule: Partial<SocialListeningRule>): Promise<SocialListeningRule> => {
    return apiClient.put<SocialListeningRule>(`/v1/social/rules/${id}`, rule);
  },

  deleteRule: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete(`/v1/social/rules/${id}`);
  },

  // 7. Simulate Inbound Mention
  simulateInbound: async (payload: {
    platform?: string;
    authorName?: string;
    authorHandle?: string;
    content: string;
    mediaUrls?: string[];
    isVerified?: boolean;
    postUrl?: string;
  }): Promise<{ success: boolean; data: SocialInteraction }> => {
    return apiClient.post('/v1/social/simulate-inbound', payload);
  },
};

export default socialApi;
