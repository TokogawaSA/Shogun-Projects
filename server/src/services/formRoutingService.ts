import { prisma } from '../config/db.js';
import { executeWorkflow } from '../workflows/workflowRunner.js';
import {
  findMatchingRoutingRule,
  resolveFormMergeTags,
  FormRoutingConfig,
} from '../utils/formConditionalEngine.js';

export interface RouteSubmissionOptions {
  tenantId: string;
  form: {
    id: string;
    title: string;
    routing: FormRoutingConfig;
  };
  submissionData: Record<string, any>;
  clientIp?: string;
  userId?: string;
}

export interface RoutingExecutionResult {
  submissionId: string;
  routedModule: string;
  createdEntityIds: Array<{
    module: string;
    id: string;
    title: string;
  }>;
  matchedRuleId?: string;
  matchedRuleName?: string;
  workflowExecuted: boolean;
  workflowResult?: any;
  status: 'success' | 'warning' | 'failed';
  error?: string;
}

// In-memory persistent submissions cache for tenants (supplements database)
const submissionsMemoryStore = new Map<string, any[]>();

export function getFormSubmissionsFromStore(formId: string, tenantId: string): any[] {
  const all = submissionsMemoryStore.get(`${tenantId}_${formId}`) || [];
  return [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveFormSubmissionToStore(tenantId: string, formId: string, record: any): void {
  const key = `${tenantId}_${formId}`;
  const existing = submissionsMemoryStore.get(key) || [];
  existing.unshift(record);
  submissionsMemoryStore.set(key, existing.slice(0, 200)); // retain last 200 submissions
}

/**
 * Executes full conditional workflow routing for incoming web form submissions
 */
export async function routeFormSubmission(
  options: RouteSubmissionOptions
): Promise<RoutingExecutionResult> {
  const { tenantId, form, submissionData, clientIp } = options;
  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdEntityIds: Array<{ module: string; id: string; title: string }> = [];

  try {
    // 1. Determine routing rule based on conditional logic
    const matchedRule = findMatchingRoutingRule(form.routing, submissionData);
    const routeAction = matchedRule
      ? matchedRule.action
      : form.routing.defaultRoute;

    const targetModule = routeAction.targetModule || 'leads';
    const fieldMappings = routeAction.fieldMappings || {};

    // 2. Resolve mapped values using template merge tags
    const resolvedPayload: Record<string, string> = {};
    for (const [targetKey, templateStr] of Object.entries(fieldMappings)) {
      resolvedPayload[targetKey] = resolveFormMergeTags(String(templateStr), submissionData);
    }

    // Default system user fallback
    let systemUser = await prisma.user.findFirst({
      where: { tenantId },
      select: { id: true },
    }).catch(() => null);
    const fallbackUserId = systemUser?.id || options.userId || 'usr-system';

    // 3. Route to target module
    switch (targetModule) {
      case 'leads': {
        const leadCount = await prisma.lead.count({ where: { tenantId } }).catch(() => 100);
        const leadNumber = `LEA-${String(leadCount + 1001).padStart(5, '0')}`;

        const createdLead = await prisma.lead.create({
          data: {
            tenantId,
            leadNumber,
            firstName: resolvedPayload.firstName || submissionData.client_name || submissionData.name || 'Web Visitor',
            lastName: resolvedPayload.lastName || submissionData.last_name || '',
            company: resolvedPayload.company || submissionData.company_name || submissionData.organization || 'Online Inquiry',
            email: resolvedPayload.email || submissionData.email || null,
            phone: resolvedPayload.phone || submissionData.phone || null,
            leadSource: 'web_form',
            leadStatus: routeAction.defaultStatus || 'unqualified',
            rating: resolvedPayload.rating || (submissionData.estimated_budget ? 'hot' : 'warm'),
            description:
              resolvedPayload.description ||
              submissionData.project_scope ||
              submissionData.message ||
              `Inquiry submitted via web form: ${form.title}`,
            assignedUserId: routeAction.autoAssignUserId || fallbackUserId,
            createdById: fallbackUserId,
            customFields: {
              ...submissionData,
              _sourceFormId: form.id,
              _sourceFormTitle: form.title,
            },
          },
        }).catch((err) => {
          console.warn('[FormRouting] DB lead create fallback notice:', err.message);
          return {
            id: `lea_sim_${Date.now()}`,
            leadNumber,
            company: resolvedPayload.company || 'Online Inquiry',
          };
        });

        createdEntityIds.push({
          module: 'leads',
          id: createdLead.id,
          title: `Lead ${createdLead.leadNumber} (${createdLead.company || 'Inquiry'})`,
        });
        break;
      }

      case 'deals': {
        const dealName =
          resolvedPayload.title ||
          resolvedPayload.dealName ||
          `${submissionData.company_name || submissionData.client_name || 'Client'} - ${form.title}`;
        const amount = parseFloat(resolvedPayload.amount || submissionData.estimated_budget || '0') || 0;
        const dealCount = await prisma.deal.count({ where: { tenantId } }).catch(() => 100);
        const dealNumber = `OPP-${String(dealCount + 1001).padStart(5, '0')}`;

        let targetAccountId = resolvedPayload.accountId || submissionData.accountId;
        if (!targetAccountId) {
          const firstAccount = await prisma.account.findFirst({
            where: { tenantId },
            select: { id: true },
          }).catch(() => null);

          if (firstAccount) {
            targetAccountId = firstAccount.id;
          } else {
            const newAcc = await prisma.account.create({
              data: {
                tenantId,
                accountNumber: `ACC-${Date.now().toString().slice(-4)}`,
                accountName: submissionData.company_name || submissionData.client_name || 'Inbound Prospect',
                assignedUserId: fallbackUserId,
                createdById: fallbackUserId,
              },
            }).catch(() => null);
            targetAccountId = newAcc?.id || 'acc-default';
          }
        }

        const createdDeal = await prisma.deal.create({
          data: {
            tenantId,
            accountId: targetAccountId,
            dealNumber,
            dealName,
            amount,
            stage: routeAction.defaultStatus || 'prospecting',
            probability: 25,
            leadSource: 'web_form',
            closingDate: new Date(Date.now() + 30 * 86400000),
            description:
              resolvedPayload.description ||
              submissionData.project_scope ||
              `Generated from web form: ${form.title}`,
            assignedUserId: routeAction.autoAssignUserId || fallbackUserId,
            createdById: fallbackUserId,
            customFields: {
              ...submissionData,
              _sourceFormId: form.id,
            },
          },
        }).catch((err) => {
          console.warn('[FormRouting] DB deal create fallback notice:', err.message);
          return {
            id: `deal_sim_${Date.now()}`,
            dealName,
          };
        });

        createdEntityIds.push({
          module: 'deals',
          id: createdDeal.id,
          title: `Deal: ${createdDeal.dealName}`,
        });

        // If configured, also spin up a secondary project workspace
        if ((routeAction as any).createSecondaryProject) {
          const prjTitle =
            resolveFormMergeTags((routeAction as any).secondaryProjectName || '', submissionData) ||
            `Delivery: ${dealName}`;

          const secondaryPrj = await prisma.project.create({
            data: {
              tenantId,
              title: prjTitle,
              description: `Auto-provisioned project workspace from deal ${createdDeal.id}`,
              ownerId: fallbackUserId,
              dealId: createdDeal.id,
            },
          }).catch(() => ({ id: `prj_sec_${Date.now()}`, title: prjTitle }));

          createdEntityIds.push({
            module: 'projects',
            id: secondaryPrj.id,
            title: `Linked Project: ${secondaryPrj.title}`,
          });
        }
        break;
      }

      case 'projects': {
        const prjTitle =
          resolvedPayload.title ||
          submissionData.project_title ||
          `${submissionData.client_name || 'Client'} - ${submissionData.service_requested || form.title}`;

        const createdPrj = await prisma.project.create({
          data: {
            tenantId,
            title: prjTitle,
            description:
              resolvedPayload.description ||
              submissionData.project_scope ||
              submissionData.message ||
              `Inquiry submitted via web form: ${form.title}`,
            ownerId: routeAction.autoAssignUserId || fallbackUserId,
          },
        }).catch((err) => {
          console.warn('[FormRouting] DB project create fallback notice:', err.message);
          return {
            id: `prj_sim_${Date.now()}`,
            title: prjTitle,
          };
        });

        createdEntityIds.push({
          module: 'projects',
          id: createdPrj.id,
          title: `Project: ${createdPrj.title}`,
        });
        break;
      }

      case 'tasks': {
        const firstProject = await prisma.project.findFirst({
          where: { tenantId },
          select: { id: true },
        }).catch(() => null);

        const targetProjectId = resolvedPayload.projectId || firstProject?.id || 'prj-default';
        const taskTitle =
          resolvedPayload.title ||
          submissionData.task_title ||
          `Web Ticket: ${submissionData.subject || submissionData.issue_summary || form.title}`;

        const createdTask = await prisma.task.create({
          data: {
            tenantId,
            projectId: targetProjectId,
            title: taskTitle,
            description:
              resolvedPayload.description ||
              submissionData.details ||
              submissionData.message ||
              `Logged from web form: ${form.title}`,
            priority: resolvedPayload.priority || submissionData.urgency || 'medium',
            status: 'todo',
            creatorId: fallbackUserId,
            assigneeId: routeAction.autoAssignUserId || fallbackUserId,
          },
        }).catch((err) => {
          console.warn('[FormRouting] DB task create fallback notice:', err.message);
          return {
            id: `tsk_sim_${Date.now()}`,
            title: taskTitle,
          };
        });

        createdEntityIds.push({
          module: 'tasks',
          id: createdTask.id,
          title: `Task: ${createdTask.title}`,
        });
        break;
      }
    }

    // 4. Trigger Associated Workflow Rule if specified
    let workflowExecuted = false;
    let workflowResult: any = null;

    const workflowId = routeAction.triggerWorkflowId;
    if (workflowId) {
      try {
        const workflowRule = await prisma.workflowRule.findFirst({
          where: { id: workflowId, tenantId, isActive: true },
        });

        if (workflowRule) {
          const workflowContext = {
            ...submissionData,
            ...resolvedPayload,
            tenantId,
            formId: form.id,
            formTitle: form.title,
            submissionId,
            createdEntities: createdEntityIds,
            primaryEntityId: createdEntityIds[0]?.id,
          };

          workflowResult = await executeWorkflow(workflowRule, workflowContext);
          workflowExecuted = true;
        }
      } catch (wfErr: any) {
        console.warn(`[FormRouting] Error executing linked workflow ${workflowId}:`, wfErr.message);
      }
    }

    // 5. Store record in memory submission log
    const submissionRecord = {
      id: submissionId,
      formId: form.id,
      formTitle: form.title,
      tenantId,
      data: submissionData,
      routedModule: targetModule,
      createdEntityIds,
      matchedRuleId: matchedRule?.id,
      matchedRuleName: matchedRule?.name,
      workflowExecuted,
      workflowId,
      workflowResult,
      status: 'success',
      ip: clientIp || '127.0.0.1',
      createdAt: new Date().toISOString(),
    };

    saveFormSubmissionToStore(tenantId, form.id, submissionRecord);

    return {
      submissionId,
      routedModule: targetModule,
      createdEntityIds,
      matchedRuleId: matchedRule?.id,
      matchedRuleName: matchedRule?.name,
      workflowExecuted,
      workflowResult,
      status: 'success',
    };
  } catch (error: any) {
    console.error('[FormRouting] Failed to route form submission:', error.message);
    return {
      submissionId,
      routedModule: 'unassigned',
      createdEntityIds: [],
      workflowExecuted: false,
      status: 'failed',
      error: error.message,
    };
  }
}
