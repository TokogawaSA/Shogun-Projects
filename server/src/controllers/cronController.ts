import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

const CRON_SECRET = process.env.CRON_SECRET || 'shogun_cron_secret_key_change_in_production';

/**
 * POST /api/cron/recurring-tasks
 * cPanel cron worker endpoint to generate scheduled recurring task instances.
 */
export async function runRecurringTasksCron(req: Request, res: Response): Promise<void> {
  try {
    const headerSecret = req.headers['x-cron-secret'] || req.query.secret;

    if (!headerSecret || headerSecret !== CRON_SECRET) {
      res.status(403).json({
        error: 'Forbidden: Invalid or missing X-Cron-Secret.',
      });
      return;
    }

    // 1. Fetch recurring task templates
    const recurringTemplates = await prisma.task.findMany({
      where: {
        isRecurring: true,
      },
      include: {
        checklistSubtasks: true,
      },
    });

    let spawnedCount = 0;
    const now = new Date();

    for (const template of recurringTemplates) {
      // Calculate next due date
      let nextDueDate = new Date();
      if (template.recurrenceRule === 'daily') {
        nextDueDate.setDate(now.getDate() + 1);
      } else if (template.recurrenceRule === 'weekly') {
        nextDueDate.setDate(now.getDate() + 7);
      } else if (template.recurrenceRule === 'monthly') {
        nextDueDate.setMonth(now.getMonth() + 1);
      } else {
        nextDueDate.setDate(now.getDate() + 1);
      }

      await prisma.$transaction(async (tx) => {
        // Create new task instance
        const newTask = await tx.task.create({
          data: {
            tenantId: template.tenantId,
            projectId: template.projectId,
            title: `${template.title} [${nextDueDate.toISOString().slice(0, 10)}]`,
            description: template.description,
            status: 'todo',
            priority: template.priority,
            category: template.category,
            assignedAgent: template.assignedAgent,
            progress: 0,
            assigneeId: template.assigneeId,
            creatorId: template.creatorId,
            dueDate: nextDueDate,
            milestoneId: template.milestoneId,
            lineItemId: template.lineItemId,
            estimatedHours: template.estimatedHours,
            actualHours: 0,
            isRecurring: false, // Instances themselves are not templates
            relatedEntityType: template.relatedEntityType,
            relatedEntityId: template.relatedEntityId,
          },
        });

        // Replicate checklist subtasks with reset status
        if (template.checklistSubtasks && template.checklistSubtasks.length > 0) {
          for (const sub of template.checklistSubtasks) {
            await tx.subTask.create({
              data: {
                taskId: newTask.id,
                title: sub.title,
                completed: false,
                assigneeId: sub.assigneeId,
              },
            });
          }
        }
      });

      spawnedCount++;
    }

    res.json({
      success: true,
      message: `cPanel Cron processed ${recurringTemplates.length} templates and spawned ${spawnedCount} task instances.`,
      templatesProcessed: recurringTemplates.length,
      tasksSpawned: spawnedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron Recurring Tasks Error]:', err);
    res.status(500).json({ error: 'Cron execution failed.', details: err.message });
  }
}
