import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { enqueueWorkflowEvent } from '../queues/index.js';

export interface UpdateDealInput {
  dealName?: string;
  accountId?: string | null;
  contactId?: string | null;
  amount?: number;
  currency?: string;
  closingDate?: Date | null;
  stage?: string;
  probability?: number;
  dealType?: string | null;
  leadSource?: string | null;
  linkedProjectId?: string | null;
  lostReason?: string | null;
  description?: string | null;
  assignedUserId?: string | null;
  customFields?: any;
}

export async function updateDealWithEvents(
  tenantId: string,
  dealId: string,
  input: UpdateDealInput,
  userId?: string
) {
  return withTenantTx(tenantId, async (tx) => {
    // 1. Fetch current deal state
    const existing = await tx.deal.findFirst({
      where: { id: dealId, tenantId },
    });

    if (!existing) {
      throw new Error(`Deal ${dealId} not found.`);
    }

    const prevStage = existing.stage;
    const isStageChanging = input.stage && input.stage !== prevStage;

    // 2. Perform Deal update
    const updateData: any = {
      ...(input.dealName !== undefined && { dealName: input.dealName }),
      ...(input.accountId !== undefined && { accountId: input.accountId }),
      ...(input.contactId !== undefined && { contactId: input.contactId }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.closingDate !== undefined && { closingDate: input.closingDate }),
      ...(input.stage !== undefined && { stage: input.stage }),
      ...(input.probability !== undefined && { probability: input.probability }),
      ...(input.dealType !== undefined && { dealType: input.dealType }),
      ...(input.leadSource !== undefined && { leadSource: input.leadSource }),
      ...(input.linkedProjectId !== undefined && { linkedProjectId: input.linkedProjectId }),
      ...(input.lostReason !== undefined && { lostReason: input.lostReason }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.assignedUserId !== undefined && { assignedUserId: input.assignedUserId }),
      ...(input.customFields !== undefined && { customFields: input.customFields }),
    };

    const updated = await tx.deal.update({
      where: { id: dealId },
      data: updateData,
    });

    // 3. If stage changed, enqueue domain event to BullMQ
    if (isStageChanging && input.stage) {
      try {
        await enqueueWorkflowEvent(
          'deal.stage_updated',
          {
            tenantId,
            dealId,
            previousStage: prevStage,
            newStage: input.stage,
            userId,
          },
          `workflow-deal-${dealId}-${input.stage}-${Date.now()}`
        );
      } catch (err: any) {
        console.warn(`[dealService] Could not enqueue deal.stage_updated event to Redis:`, err.message);
      }
    }

    return updated;
  });
}
