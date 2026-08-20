import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import {
  type WorkflowRule,
  type WorkflowCondition,
  type SendEmailActionPayload,
  type CreateTaskActionPayload,
  type UpdateFieldActionPayload,
  type CallWebhookActionPayload,
} from 'shogun-projects/src/types/settings';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

const VALID_WORKFLOW_MODULES = new Set([
  'projects',
  'tasks',
  'deals',
  'accounts',
  'contacts',
  'leads',
]);

/**
 * Helper: Resolve nested object field by dot notation (e.g. 'billingDetails.currency' or 'email')
 */
function getFieldValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  if (path in obj) return obj[path];
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

/**
 * Helper: Replace template tokens like {{field}}, {{module.field}}, etc.
 */
function resolveTokens(template: string, data: Record<string, any>, moduleName: string): string {
  if (!template) return '';
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, tokenKey) => {
    let key = tokenKey.trim();
    if (key.startsWith(`${moduleName}.`)) {
      key = key.slice(moduleName.length + 1);
    } else if (key.startsWith('doc.')) {
      key = key.slice(4);
    }
    const val = getFieldValue(data, key);
    return val !== undefined && val !== null ? String(val) : match;
  });
}

/**
 * Helper: Evaluate a single workflow condition
 */
function evaluateCondition(docData: Record<string, any>, condition: WorkflowCondition): boolean {
  const fieldValue = getFieldValue(docData, condition.field);
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue ?? '').toLowerCase() === String(targetValue ?? '').toLowerCase();
    case 'not_equals':
      return String(fieldValue ?? '').toLowerCase() !== String(targetValue ?? '').toLowerCase();
    case 'greater_than': {
      const numField = Number(fieldValue);
      const numTarget = Number(targetValue);
      return !isNaN(numField) && !isNaN(numTarget) && numField > numTarget;
    }
    case 'contains': {
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((item) =>
          String(item).toLowerCase().includes(String(targetValue).toLowerCase())
        );
      }
      return String(fieldValue ?? '')
        .toLowerCase()
        .includes(String(targetValue ?? '').toLowerCase());
    }
    case 'is_empty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    default:
      return false;
  }
}

/**
 * Helper: Send email via tenant email config
 */
async function executeSendEmailAction(
  tenantId: string,
  docData: Record<string, any>,
  moduleName: string,
  action: SendEmailActionPayload
) {
  try {
    // 1. Fetch Email Gateway Config
    const configSnap = await db.doc(`tenants/${tenantId}/email_config/default`).get();
    if (!configSnap.exists) {
      console.warn(`[Workflow Engine] No email config found for tenant ${tenantId}. Skipping send_email.`);
      return;
    }
    const emailConfig = configSnap.data() || {};

    // 2. Resolve Template & Content
    let subject = action.subject || 'Automated Notification';
    let bodyHtml = action.bodyHtml || '<p>Automated workflow trigger notification.</p>';

    if (action.templateId) {
      const templateSnap = await db.doc(`tenants/${tenantId}/templates/${action.templateId}`).get();
      if (templateSnap.exists) {
        const tmpl = templateSnap.data();
        if (tmpl?.subject) subject = tmpl.subject;
        if (tmpl?.bodyHtml) bodyHtml = tmpl.bodyHtml;
      }
    }

    subject = resolveTokens(subject, docData, moduleName);
    bodyHtml = resolveTokens(bodyHtml, docData, moduleName);

    // 3. Resolve Recipient
    let recipient = action.customRecipient;
    if (action.recipientField) {
      const resolved = getFieldValue(docData, action.recipientField);
      if (resolved && typeof resolved === 'string') {
        recipient = resolved;
      }
    }
    if (!recipient) {
      recipient = docData.email || docData.billingEmail || docData.primaryContactEmail;
    }

    if (!recipient) {
      console.warn(`[Workflow Engine] Could not determine recipient for send_email action in tenant ${tenantId}.`);
      return;
    }

    // 4. Dispatch Email
    if (emailConfig.provider === 'smtp' && emailConfig.smtpSettings) {
      const smtp = emailConfig.smtpSettings;
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port),
        secure: smtp.secure ?? Number(smtp.port) === 465,
        auth: { user: smtp.username, pass: smtp.password || '' },
      });

      await transporter.sendMail({
        from: `"${emailConfig.fromName || 'VTiger Hub'}" <${emailConfig.fromEmail}>`,
        to: recipient,
        subject,
        html: bodyHtml,
      });
      console.log(`[Workflow Engine] Email sent via SMTP to ${recipient} (Subject: ${subject})`);
    } else if (emailConfig.provider === 'sendgrid' && emailConfig.apiKey) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${emailConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: emailConfig.fromEmail, name: emailConfig.fromName || 'VTiger Hub' },
          subject,
          content: [{ type: 'text/html', value: bodyHtml }],
        }),
      });
      console.log(`[Workflow Engine] Email sent via SendGrid to ${recipient}`);
    }
  } catch (err) {
    console.error(`[Workflow Engine Error] send_email failed:`, err);
  }
}

/**
 * Cloud Functions Gen 2 Event Trigger: executeWorkflowEngine
 * Listens on `tenants/{tenantId}/{module}/{docId}` and evaluates dynamic automation rules.
 */
export const executeWorkflowEngine = onDocumentWritten(
  'tenants/{tenantId}/{module}/{docId}',
  async (event) => {
    const { tenantId, module: targetModule, docId } = event.params;

    // Filter to supported CRM / Project modules
    if (!VALID_WORKFLOW_MODULES.has(targetModule)) {
      return;
    }

    const change = event.data;
    if (!change) return;

    const beforeData = change.before.exists ? (change.before.data() as Record<string, any>) : null;
    const afterData = change.after.exists ? (change.after.data() as Record<string, any>) : null;

    // Skip deletion events
    if (!afterData) return;

    // Determine Trigger Type
    const isCreate = !beforeData;
    const isStageChanged =
      beforeData &&
      (beforeData.stage !== afterData.stage ||
        beforeData.pipelineStage !== afterData.pipelineStage ||
        beforeData.status !== afterData.status);

    // 1. Fetch active workflow rules for this tenant & module
    const workflowsQuery = await db
      .collection(`tenants/${tenantId}/workflows`)
      .where('targetModule', '==', targetModule)
      .where('isActive', '==', true)
      .get();

    if (workflowsQuery.empty) {
      return;
    }

    const matchingRules: WorkflowRule[] = [];

    for (const docSnap of workflowsQuery.docs) {
      const rule = { id: docSnap.id, ...docSnap.data() } as WorkflowRule;

      // Match trigger types
      let triggerMatches = false;
      if (rule.triggerType === 'on_create' && isCreate) {
        triggerMatches = true;
      } else if (rule.triggerType === 'on_update' && !isCreate) {
        triggerMatches = true;
      } else if (rule.triggerType === 'on_stage_change' && isStageChanged) {
        triggerMatches = true;
      }

      if (!triggerMatches) continue;

      // Evaluate Conditions
      const conditionsPass =
        !rule.conditions ||
        rule.conditions.length === 0 ||
        rule.conditions.every((cond) => evaluateCondition(afterData, cond));

      if (conditionsPass) {
        matchingRules.push(rule);
      }
    }

    if (matchingRules.length === 0) return;

    console.log(
      `[Workflow Engine] Executing ${matchingRules.length} matched workflow rule(s) for ${targetModule}/${docId} in tenant ${tenantId}`
    );

    // 2. Execute Actions for each matched rule
    for (const rule of matchingRules) {
      if (!rule.actions || !Array.isArray(rule.actions)) continue;

      for (const action of rule.actions) {
        try {
          switch (action.type) {
            case 'send_email': {
              await executeSendEmailAction(tenantId, afterData, targetModule, action);
              break;
            }

            case 'create_task': {
              const taskAction = action as CreateTaskActionPayload;
              let dueDateStr: string | undefined;
              if (taskAction.dueDaysFromTrigger) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + Number(taskAction.dueDaysFromTrigger));
                dueDateStr = targetDate.toISOString();
              }

              const taskTitle = resolveTokens(taskAction.title, afterData, targetModule);
              const taskDesc = taskAction.description
                ? resolveTokens(taskAction.description, afterData, targetModule)
                : '';

              const newTaskData = {
                title: taskTitle,
                description: taskDesc,
                priority: taskAction.priority || 'medium',
                status: 'todo',
                tenantId,
                creatorId: 'system_workflow',
                assigneeId: taskAction.assignedUserId || afterData.assignedOwnerId || afterData.assignedRepId || null,
                dueDate: dueDateStr || null,
                relatedEntityType: targetModule,
                relatedEntityId: docId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await db.collection(`tenants/${tenantId}/tasks`).add(newTaskData);
              console.log(
                `[Workflow Engine] Created task "${taskTitle}" triggered by rule ${rule.id}`
              );
              break;
            }

            case 'update_field': {
              const updateAction = action as UpdateFieldActionPayload;
              const currentVal = getFieldValue(afterData, updateAction.fieldName);

              // Guard against self-retrigger loop
              if (currentVal !== updateAction.value) {
                await change.after.ref.update({
                  [updateAction.fieldName]: updateAction.value,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(
                  `[Workflow Engine] Updated field "${updateAction.fieldName}" to "${updateAction.value}" on ${targetModule}/${docId}`
                );
              }
              break;
            }

            case 'call_webhook': {
              const webhookAction = action as CallWebhookActionPayload;
              if (webhookAction.url) {
                let payload: any = {
                  event: rule.triggerType,
                  targetModule,
                  docId,
                  tenantId,
                  data: afterData,
                  triggeredAt: new Date().toISOString(),
                };

                if (webhookAction.payloadTemplate) {
                  const resolvedStr = resolveTokens(
                    webhookAction.payloadTemplate,
                    afterData,
                    targetModule
                  );
                  try {
                    payload = JSON.parse(resolvedStr);
                  } catch {
                    payload = { message: resolvedStr };
                  }
                }

                const response = await fetch(webhookAction.url, {
                  method: webhookAction.method || 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(webhookAction.headers || {}),
                  },
                  body: JSON.stringify(payload),
                });

                console.log(
                  `[Workflow Engine] Triggered webhook ${webhookAction.url} - Status ${response.status}`
                );
              }
              break;
            }
          }
        } catch (actionErr) {
          console.error(
            `[Workflow Engine Error] Action execution failed for rule ${rule.id} on ${targetModule}/${docId}:`,
            actionErr
          );
        }
      }
    }
  }
);
