import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

const INACTIVITY_THRESHOLD_DAYS = 45;

/**
 * Cloud Functions Gen 2 Scheduled Cron Job: evaluateClientHealth
 * Runs daily at midnight.
 * Evaluates active client accounts. If no linked projects or tasks have activity in >45 days:
 * 1. Flags account status to 'churn_risk'.
 * 2. Injects an automated retention review task into the client account's primary project or admin queue.
 */
export const evaluateClientHealth = onSchedule(
  'every 24 hours',
  async () => {
    console.log('[evaluateClientHealth] Initiating daily client retention and churn risk analysis...');
    const now = Date.now();
    const thresholdMs = INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    try {
      // 1. Query all active_client accounts
      const accountsSnap = await db
        .collection('accounts')
        .where('status', '==', 'active_client')
        .get();

      if (accountsSnap.empty) {
        console.log('[evaluateClientHealth] No active client accounts found.');
        return;
      }

      for (const docSnap of accountsSnap.docs) {
        const account = docSnap.data();
        const accountId = docSnap.id;

        // 2. Check for recent project updates
        const projectsSnap = await db
          .collection('projects')
          .where('accountId', '==', accountId)
          .orderBy('updatedAt', 'desc')
          .limit(1)
          .get();

        let lastActivityDate = account.updatedAt || account.createdAt || new Date(0).toISOString();
        let targetProjectId: string | null = null;

        if (!projectsSnap.empty) {
          const proj = projectsSnap.docs[0].data();
          targetProjectId = projectsSnap.docs[0].id;
          if (proj.updatedAt && proj.updatedAt > lastActivityDate) {
            lastActivityDate = proj.updatedAt;
          }
        }

        // Check if last activity is older than 45 days
        const lastActivityMs = new Date(lastActivityDate).getTime();
        const isStale = now - lastActivityMs > thresholdMs;

        if (isStale) {
          console.warn(
            `[evaluateClientHealth] Account ${accountId} ("${account.name}") is inactive for > ${INACTIVITY_THRESHOLD_DAYS} days. Flagging as churn_risk.`
          );

          // Update Account Status
          await db.collection('accounts').doc(accountId).update({
            status: 'churn_risk',
            updatedAt: new Date().toISOString(),
          });

          // Create Automated Churn Prevention Task
          const retentionTaskId = `TSK-RETENTION-${Math.floor(100 + Math.random() * 900)}`;
          const retentionTask = {
            id: retentionTaskId,
            projectId: targetProjectId || 'proj-shogun-1',
            title: `Client Retention Review: ${account.name} (Churn Risk)`,
            description: `Account has shown 0 project or task activities for over ${INACTIVITY_THRESHOLD_DAYS} days. Conduct account review and schedule executive outreach.`,
            status: 'todo',
            priority: 'urgent',
            category: 'Database & Identity',
            assignedAgent: 'Auditor',
            creatorId: 'System:evaluateClientHealth',
            dueDate: 'Within 48h',
            progress: 0,
            relatedEntityType: 'account',
            relatedEntityId: accountId,
            subtasks: [
              { id: 'st-r1', title: 'Audit last delivered milestones and support tickets', completed: false, createdAt: new Date().toISOString() },
              { id: 'st-r2', title: 'Schedule stakeholder check-in call with client owner', completed: false, createdAt: new Date().toISOString() },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (targetProjectId) {
            await db
              .collection('projects')
              .doc(targetProjectId)
              .collection('tasks')
              .doc(retentionTaskId)
              .set(retentionTask);
          } else {
            await db
              .collection('projects')
              .doc('proj-shogun-1')
              .collection('tasks')
              .doc(retentionTaskId)
              .set(retentionTask);
          }
        }
      }

      console.log('[evaluateClientHealth] Churn evaluation completed.');
    } catch (error) {
      console.error('[evaluateClientHealth Error]:', error);
      throw error;
    }
  }
);
