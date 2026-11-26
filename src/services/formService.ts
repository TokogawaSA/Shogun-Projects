import { apiClient } from './api';
import {
  WebForm,
  FormSubmissionRecord,
} from '../types/form';

export const formService = {
  async getForms(): Promise<WebForm[]> {
    try {
      const res = await apiClient.get<WebForm[]>('/forms');
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('[formService] Failed to fetch forms:', err);
      return [];
    }
  },

  async getFormById(idOrSlug: string): Promise<WebForm | null> {
    try {
      const res = await apiClient.get<WebForm>(`/forms/${idOrSlug}`);
      return res && res.id ? res : null;
    } catch (err) {
      console.error('[formService] Failed to fetch form:', err);
      return null;
    }
  },

  async createForm(form: Partial<WebForm>): Promise<WebForm> {
    return await apiClient.post<WebForm>('/forms', form);
  },

  async updateForm(id: string, updates: Partial<WebForm>): Promise<WebForm> {
    return await apiClient.put<WebForm>(`/forms/${id}`, updates);
  },

  async deleteForm(id: string): Promise<boolean> {
    await apiClient.delete(`/forms/${id}`);
    return true;
  },

  async getFormSubmissions(formId: string): Promise<FormSubmissionRecord[]> {
    try {
      const res = await apiClient.get<FormSubmissionRecord[]>(`/forms/${formId}/submissions`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('[formService] Failed to fetch form submissions:', err);
      return [];
    }
  },

  async simulateRouting(
    form: WebForm,
    submissionData: Record<string, any>
  ): Promise<{
    matchedRule: any;
    targetModule: string;
    fieldMappings: Record<string, string>;
    triggerWorkflowId?: string;
    willCreateSecondaryProject?: boolean;
    simulatedOutcome: string;
  }> {
    return await apiClient.post(`/forms/${form.id}/simulate-route`, {
      form,
      submissionData,
    });
  },

  async submitPublicForm(
    slugOrId: string,
    submissionData: Record<string, any>
  ): Promise<{
    success: boolean;
    message: string;
    submissionId: string;
    routedModule?: string;
    createdEntityIds?: any[];
    redirectUrl?: string;
  }> {
    return await apiClient.post(`/forms/public/${slugOrId}/submit`, submissionData);
  },
};
