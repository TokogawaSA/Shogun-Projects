import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Functions Gen 2 Event Trigger:
 * Listens for updates on task documents in the `projects/{projectId}/tasks/{taskId}` subcollection.
 * When a task's `status` field changes, automatically writes an append-only audit entry into `projects/{projectId}/activity_logs`.
 */
export const onTaskStatusChange = onDocumentUpdated(
  'projects/{projectId}/tasks/{taskId}',
  async (event) => {
    const change = event.data;
    if (!change) {
      return;
    }

    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Skip execution if data is missing or status has not changed
    if (!beforeData || !afterData || beforeData.status === afterData.status) {
      return;
    }

    const { projectId, taskId } = event.params;
    const previousStatus = beforeData.status;
    const newStatus = afterData.status;
    const performedBy = afterData.assigneeId || afterData.updatedBy || afterData.creatorId || 'system';
    const taskTitle = afterData.title || beforeData.title || 'Untitled Task';
    const assignedAgent = afterData.assignedAgent || 'None';

    const auditEntry = {
      taskId,
      taskTitle,
      previousStatus,
      newStatus,
      performedBy,
      assignedAgent,
      eventType: 'TASK_STATUS_CHANGED',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      metadata: {
        priority: afterData.priority || 'medium',
        category: afterData.category || 'General',
        source: 'Cloud Functions Gen 2 onDocumentUpdated trigger',
      },
    };

    try {
      const activityLogRef = db
        .collection('projects')
        .doc(projectId)
        .collection('activity_logs');

      const docRef = await activityLogRef.add(auditEntry);
      console.log(
        `[Audit Trail] Successfully recorded status transition for Task ${taskId} (${previousStatus} -> ${newStatus}) in project ${projectId}. Log ID: ${docRef.id}`
      );
    } catch (error) {
      console.error(
        `[Audit Trail Error] Failed to write activity log for Task ${taskId} in project ${projectId}:`,
        error
      );
      throw error;
    }
  }
);

// CRM Cloud Functions Gen 2 Triggers & Endpoints
export { onDealStageUpdated } from './crm/onDealStageUpdated';
export { inboundLeadWebhook } from './crm/inboundLeadWebhook';
export { evaluateClientHealth } from './crm/evaluateClientHealth';

// Agentic AI & MCP Tool Capabilities
export { summarizeAccountContext, generateTasksFromMeetingNotes } from './mcp/crmTools';

// Settings & Administration Hub
export { setUserCustomClaims } from './settings/auth';
export { testEmailConnection, saveEmailCredentials } from './settings/email';
export { executeWorkflowEngine } from './workflows/engine';

