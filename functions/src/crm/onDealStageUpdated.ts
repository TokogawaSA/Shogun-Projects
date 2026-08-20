import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

/**
 * Cloud Firestore Event Trigger: onDealStageUpdated
 * Listens to deals/{dealId} updates.
 * When pipelineStage transitions to 'closed_won' and linkedProjectId is null:
 * 1. Creates a new Project document in 'projects' collection.
 * 2. Assigns accountId, dealId, primaryContactId, and default milestone phases.
 * 3. Updates the deal with the resulting linkedProjectId.
 * 4. Injects an onboarding kickoff task into projects/{projectId}/tasks.
 * 5. Writes an audit log entry into projects/{projectId}/activity_logs and global audit_logs.
 */
export const onDealStageUpdated = onDocumentUpdated(
  'deals/{dealId}',
  async (event) => {
    const change = event.data;
    if (!change) {
      return;
    }

    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) {
      return;
    }

    const { dealId } = event.params;
    const prevStage = beforeData.pipelineStage || beforeData.stage;
    const currentStage = afterData.pipelineStage || afterData.stage;
    const existingProjectId = afterData.linkedProjectId || afterData.projectId;

    // Only trigger when transitioned to 'closed_won' and not yet linked to a project
    if (currentStage !== 'closed_won' || prevStage === 'closed_won' || existingProjectId) {
      return;
    }

    const tenantId = afterData.tenantId || 'tenant-default';
    const accountId = afterData.accountId || afterData.organizationId || null;
    const primaryContactId = afterData.primaryContactId || afterData.contactId || null;
    const dealTitle = afterData.title || 'Enterprise Solution';
    const repId = afterData.assignedRepId || 'usr-admin-master';

    // 1. Fetch Account info for naming and context
    let accountName = 'Client';
    if (accountId) {
      try {
        const accSnap = await db.collection('accounts').doc(accountId).get();
        if (accSnap.exists) {
          accountName = accSnap.data()?.name || accountName;
        } else {
          const orgSnap = await db.collection('organizations').doc(accountId).get();
          if (orgSnap.exists) {
            accountName = orgSnap.data()?.name || accountName;
          }
        }
      } catch (err) {
        console.warn(`[onDealStageUpdated] Could not fetch account ${accountId}:`, err);
      }
    }

    const newProjectId = `proj-deal-${Date.now().toString(36)}`;
    const projectTitle = `${accountName} - ${dealTitle} Project`;

    const newProject = {
      id: newProjectId,
      tenantId,
      title: projectTitle,
      description: `Project provisioned automatically from Closed-Won deal "${dealTitle}" (Deal ID: ${dealId}). Managed via Antigravity 2.0 multi-agent pipelines.`,
      organizationId: accountId || 'org-shogunate-root',
      accountId,
      dealId,
      primaryContactId,
      ownerId: repId,
      members: [repId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones: [
        { id: 'm-1', title: 'Architecture Kickoff & Scope Validation', status: 'pending' },
        { id: 'm-2', title: 'Core Implementation & Subagent Orchestration', status: 'pending' },
        { id: 'm-3', title: 'QA Verification, Nonce & Security Audit', status: 'pending' },
        { id: 'm-4', title: 'Client Sign-off & Production Deployment', status: 'pending' },
      ],
    };

    try {
      // 1. Create Project
      await db.collection('projects').doc(newProjectId).set(newProject);

      // 2. Link Project to Deal
      await db.collection('deals').doc(dealId).update({
        linkedProjectId: newProjectId,
        projectId: newProjectId,
        pipelineStage: 'closed_won',
        updatedAt: new Date().toISOString(),
      });

      // 3. Create Handover & Kickoff Task in Project Subcollection
      const handoverTaskId = `TSK-HANDOVER-${Math.floor(100 + Math.random() * 900)}`;
      const kickoffTask = {
        id: handoverTaskId,
        projectId: newProjectId,
        title: `Sales-to-Delivery Handover: ${dealTitle}`,
        description: `Perform client discovery review, establish communication channels with contact (${primaryContactId || 'primary contact'}), and assign Sentinel subagents.`,
        status: 'todo',
        priority: 'urgent',
        category: 'Client Interface',
        assignedAgent: 'Sentinel',
        creatorId: repId,
        dueDate: 'Day 3 Kickoff',
        progress: 0,
        relatedEntityType: 'deal',
        relatedEntityId: dealId,
        subtasks: [
          { id: 'st-1', title: 'Review deal handover scope and budget specs', completed: false, createdAt: new Date().toISOString() },
          { id: 'st-2', title: 'Schedule technical discovery sync with client lead', completed: false, createdAt: new Date().toISOString() },
          { id: 'st-3', title: 'Provision multi-tenant environment tokens', completed: false, createdAt: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection('projects').doc(newProjectId).collection('tasks').doc(handoverTaskId).set(kickoffTask);

      // 4. Log Audit Entry
      const auditLog = {
        eventType: 'DEAL_CONVERTED_TO_PROJECT',
        dealId,
        projectId: newProjectId,
        projectTitle,
        accountId,
        tenantId,
        performedBy: 'System:onDealStageUpdated',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      await db.collection('projects').doc(newProjectId).collection('activity_logs').add(auditLog);
      await db.collection('audit_logs').add(auditLog);

      console.log(`[onDealStageUpdated] Successfully converted deal ${dealId} to project ${newProjectId}`);
    } catch (error) {
      console.error(`[onDealStageUpdated Error] Failed to convert deal ${dealId}:`, error);
      throw error;
    }
  }
);
