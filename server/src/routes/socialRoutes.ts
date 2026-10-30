import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { broadcastToTenant } from '../socket.js';
import { processInboundSocialInteraction } from '../workers/socialWorker.js';
import { queueSocialInteraction } from '../queues/index.js';
import {
  EscalateTaskPayload,
  LinkContactPayload,
  OutboundReplyPayload,
  SocialThreadMessage,
} from '../types/social.js';

export const socialRouter = Router();

// ============================================================================
// 1. GET /interactions: Paginated, filterable feed
// ============================================================================
socialRouter.get('/interactions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }

    const {
      page = '1',
      limit = '20',
      platform,
      sentiment,
      intent,
      status,
      search,
      contactId,
      accountId,
      urgency,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const takeNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skipNum = (pageNum - 1) * takeNum;

    const where: any = { tenantId };

    if (platform && platform !== 'all') {
      where.platform = platform as string;
    }
    if (sentiment && sentiment !== 'all') {
      where.sentiment = sentiment as string;
    }
    if (intent && intent !== 'all') {
      where.intent = intent as string;
    }
    if (status && status !== 'all') {
      where.status = status as string;
    }
    if (urgency && urgency !== 'all') {
      where.urgency = urgency as string;
    }
    if (contactId) {
      where.linkedContactId = contactId as string;
    }
    if (accountId) {
      where.linkedAccountId = accountId as string;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { authorHandle: { contains: searchTerm, mode: 'insensitive' } },
        { authorName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.socialInteraction.count({ where }),
      prisma.socialInteraction.findMany({
        where,
        skip: skipNum,
        take: takeNum,
        orderBy: { publishedAt: 'desc' },
        include: {
          rule: true,
          escalatedTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              projectId: true,
            },
          },
          linkedContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              accountId: true,
            },
          },
          linkedAccount: {
            select: {
              id: true,
              accountName: true,
            },
          },
        },
      }),
    ]);

    res.json({
      data: items,
      total,
      page: pageNum,
      limit: takeNum,
      totalPages: Math.ceil(total / takeNum),
    });
  } catch (err: any) {
    console.error('[SocialRoutes Error] GET /interactions failed:', err);
    res.status(500).json({
      error: 'Failed to fetch social interactions',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 2. GET /interactions/:id: Fetch single interaction with thread details
// ============================================================================
socialRouter.get('/interactions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const interaction = await prisma.socialInteraction.findFirst({
      where: { id, tenantId },
      include: {
        rule: true,
        escalatedTask: true,
        linkedContact: true,
        linkedAccount: true,
      },
    });

    if (!interaction) {
      res.status(404).json({ error: 'Social interaction not found.' });
      return;
    }

    res.json(interaction);
  } catch (err: any) {
    console.error('[SocialRoutes Error] GET /interactions/:id failed:', err);
    res.status(500).json({
      error: 'Failed to fetch interaction',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 3. POST /interactions/:id/reply: Outbound reply in-thread
// ============================================================================
socialRouter.post('/interactions/:id/reply', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { replyText } = req.body as OutboundReplyPayload;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }
    if (!replyText || replyText.trim() === '') {
      res.status(400).json({ error: 'Reply text cannot be empty.' });
      return;
    }

    const updated = await withTenantTx(tenantId, async (tx) => {
      const existing = await tx.socialInteraction.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new Error('Social interaction not found.');
      }

      // Find user name if available
      let authorName = 'Shogun Support';
      if (userId) {
        const u = await tx.user.findUnique({ where: { id: userId } });
        if (u?.displayName) authorName = u.displayName;
      }

      const existingHistory: SocialThreadMessage[] =
        Array.isArray(existing.threadHistory) ? (existing.threadHistory as any) : [];

      const newOutboundMessage: SocialThreadMessage = {
        id: `rep-${Date.now()}`,
        author: authorName,
        handle: '@ShogunSupport',
        content: replyText.trim(),
        timestamp: new Date().toISOString(),
        isOutbound: true,
      };

      const newThreadHistory = [...existingHistory, newOutboundMessage];

      return await tx.socialInteraction.update({
        where: { id },
        data: {
          threadHistory: newThreadHistory as any,
          status: existing.status === 'new' ? 'replied' : existing.status,
          updatedAt: new Date(),
        },
        include: {
          rule: true,
          escalatedTask: true,
          linkedContact: true,
          linkedAccount: true,
        },
      });
    });

    // Broadcast updated thread real-time
    broadcastToTenant(tenantId, 'social:interaction_updated', updated);

    res.json({
      success: true,
      message: 'Outbound reply dispatched successfully.',
      interaction: updated,
    });
  } catch (err: any) {
    console.error('[SocialRoutes Error] POST /interactions/:id/reply failed:', err);
    res.status(500).json({
      error: 'Failed to dispatch outbound reply',
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 4. POST /interactions/:id/escalate-task: Convert to Project Task
// ============================================================================
socialRouter.post('/interactions/:id/escalate-task', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { projectId, title, priority, description } = req.body as EscalateTaskPayload;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required for task escalation.' });
      return;
    }

    const result = await withTenantTx(tenantId, async (tx) => {
      // 1. Fetch interaction
      const interaction = await tx.socialInteraction.findFirst({
        where: { id, tenantId },
      });

      if (!interaction) {
        throw new Error('Social interaction not found.');
      }

      // 2. Verify project exists in tenant
      const project = await tx.project.findFirst({
        where: { id: projectId, tenantId },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found in this organization.`);
      }

      // 3. Resolve creator ID
      let creatorId = userId;
      if (!creatorId) {
        const defaultUser = await tx.user.findFirst({ where: { tenantId } });
        creatorId = defaultUser?.id || 'usr-system';
      }

      // 4. Determine task title & priority
      const taskTitle =
        title?.trim() ||
        `[${interaction.platform.toUpperCase()}] Support escalation from @${interaction.authorHandle}`;

      const taskPriority =
        priority ||
        (interaction.urgency === 'critical'
          ? 'urgent'
          : interaction.urgency === 'high'
          ? 'high'
          : 'medium');

      const taskDescription =
        description?.trim() ||
        `Social interaction escalated from ${interaction.platform}:\n\n` +
          `Author: ${interaction.authorName} (@${interaction.authorHandle})\n` +
          `Sentiment: ${interaction.sentiment} (Score: ${interaction.sentimentScore})\n` +
          `Detected Intent: ${interaction.intent}\n` +
          `Urgency: ${interaction.urgency}\n\n` +
          `Original Message:\n"${interaction.content}"\n\n` +
          (interaction.postUrl ? `Direct URL: ${interaction.postUrl}` : '');

      // 5. Create Task
      const createdTask = await tx.task.create({
        data: {
          projectId,
          tenantId,
          creatorId: creatorId!,
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          status: 'todo',
          category: 'social_escalation',
          relatedEntityType: interaction.linkedContactId ? 'contact' : 'social',
          relatedEntityId: interaction.linkedContactId || interaction.id,
        },
      });

      // 6. Link task to interaction & mark escalated
      const updatedInteraction = await tx.socialInteraction.update({
        where: { id },
        data: {
          escalatedTaskId: createdTask.id,
          status: 'escalated',
          updatedAt: new Date(),
        },
        include: {
          rule: true,
          escalatedTask: true,
          linkedContact: true,
          linkedAccount: true,
        },
      });

      return { task: createdTask, interaction: updatedInteraction };
    });

    broadcastToTenant(tenantId, 'social:interaction_updated', result.interaction);

    res.json({
      success: true,
      message: 'Social interaction escalated to project task successfully.',
      task: result.task,
      interaction: result.interaction,
    });
  } catch (err: any) {
    console.error('[SocialRoutes Error] POST /interactions/:id/escalate-task failed:', err);
    res.status(500).json({
      error: 'Failed to escalate to project task',
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 5. POST /interactions/:id/link-contact: Match or create CRM Contact
// ============================================================================
socialRouter.post('/interactions/:id/link-contact', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { contactId, newContact } = req.body as LinkContactPayload;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }

    if (!contactId && (!newContact || !newContact.firstName || !newContact.email)) {
      res.status(400).json({
        error: 'Either an existing contactId or newContact (with firstName and email) must be provided.',
      });
      return;
    }

    const result = await withTenantTx(tenantId, async (tx) => {
      const interaction = await tx.socialInteraction.findFirst({
        where: { id, tenantId },
      });

      if (!interaction) {
        throw new Error('Social interaction not found.');
      }

      let targetContactId = contactId;
      let targetAccountId: string | null = null;
      let resolvedContact: any = null;

      if (targetContactId) {
        const contact = await tx.contact.findFirst({
          where: { id: targetContactId, tenantId },
          include: { account: true },
        });

        if (!contact) {
          throw new Error(`Contact ${targetContactId} does not exist in this tenant.`);
        }
        targetAccountId = contact.accountId;
        resolvedContact = contact;
      } else if (newContact) {
        // Resolve default account if not supplied
        let accId = newContact.accountId;
        if (!accId) {
          let defaultAcc = await tx.account.findFirst({ where: { tenantId } });
          if (!defaultAcc) {
            // Auto-create default account for social leads
            let adminUser = await tx.user.findFirst({ where: { tenantId } });
            defaultAcc = await tx.account.create({
              data: {
                tenantId,
                accountNumber: `ACC-${Date.now().toString().slice(-6)}`,
                accountName: `${interaction.authorName}'s Organization`,
                assignedUserId: userId || adminUser?.id || 'usr-system',
                createdById: userId || adminUser?.id || 'usr-system',
              },
            });
          }
          accId = defaultAcc.id;
        }

        let adminUser = await tx.user.findFirst({ where: { tenantId } });
        const createdContact = await tx.contact.create({
          data: {
            tenantId,
            contactNumber: `CON-${Date.now().toString().slice(-6)}`,
            firstName: newContact.firstName,
            lastName: newContact.lastName || 'User',
            email: newContact.email,
            phone: newContact.phone || null,
            accountId: accId,
            assignedUserId: userId || adminUser?.id || 'usr-system',
            createdById: userId || adminUser?.id || 'usr-system',
            description: `Auto-generated from ${interaction.platform} interaction (@${interaction.authorHandle})`,
          },
        });

        targetContactId = createdContact.id;
        targetAccountId = accId;
        resolvedContact = createdContact;
      }

      // Link to interaction
      const updatedInteraction = await tx.socialInteraction.update({
        where: { id },
        data: {
          linkedContactId: targetContactId,
          linkedAccountId: targetAccountId,
          updatedAt: new Date(),
        },
        include: {
          rule: true,
          escalatedTask: true,
          linkedContact: true,
          linkedAccount: true,
        },
      });

      return { contact: resolvedContact, interaction: updatedInteraction };
    });

    broadcastToTenant(tenantId, 'social:interaction_updated', result.interaction);

    res.json({
      success: true,
      message: 'Contact linked to interaction successfully.',
      contact: result.contact,
      interaction: result.interaction,
    });
  } catch (err: any) {
    console.error('[SocialRoutes Error] POST /interactions/:id/link-contact failed:', err);
    res.status(500).json({
      error: 'Failed to link contact',
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 6. GET /rules & POST /rules: CRUD for keyword tracking rules
// ============================================================================
socialRouter.get('/rules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }

    const rules = await prisma.socialListeningRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { interactions: true },
        },
      },
    });

    res.json(rules);
  } catch (err: any) {
    console.error('[SocialRoutes Error] GET /rules failed:', err);
    res.status(500).json({
      error: 'Failed to fetch rules',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

socialRouter.post('/rules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, keywords, excludedWords, platforms, isActive = true } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }
    if (!name || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      res.status(400).json({ error: 'name and an array of keywords are required.' });
      return;
    }

    const created = await prisma.socialListeningRule.create({
      data: {
        tenantId,
        name: name.trim(),
        keywords: keywords.map((k: string) => k.trim()),
        excludedWords: Array.isArray(excludedWords) ? excludedWords.map((e: string) => e.trim()) : [],
        platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['twitter', 'linkedin', 'facebook', 'reddit'],
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('[SocialRoutes Error] POST /rules failed:', err);
    res.status(500).json({
      error: 'Failed to create listening rule',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

socialRouter.put('/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;
    const { name, keywords, excludedWords, platforms, isActive } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }

    const existing = await prisma.socialListeningRule.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Listening rule not found.' });
      return;
    }

    const updated = await prisma.socialListeningRule.update({
      where: { id: ruleId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(Array.isArray(keywords) ? { keywords: keywords.map((k: string) => k.trim()) } : {}),
        ...(Array.isArray(excludedWords) ? { excludedWords: excludedWords.map((e: string) => e.trim()) } : {}),
        ...(Array.isArray(platforms) ? { platforms } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[SocialRoutes Error] PUT /rules/:ruleId failed:', err);
    res.status(500).json({
      error: 'Failed to update listening rule',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

socialRouter.delete('/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { ruleId } = req.params;

    const existing = await prisma.socialListeningRule.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Listening rule not found.' });
      return;
    }

    await prisma.socialListeningRule.delete({
      where: { id: ruleId },
    });

    res.json({ success: true, message: 'Listening rule deleted successfully.' });
  } catch (err: any) {
    console.error('[SocialRoutes Error] DELETE /rules/:ruleId failed:', err);
    res.status(500).json({
      error: 'Failed to delete listening rule',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

// ============================================================================
// 7. POST /simulate-inbound: Simulate inbound payload for testing / ingestion
// ============================================================================
socialRouter.post('/simulate-inbound', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Tenant context required.' });
      return;
    }

    const payload = {
      tenantId,
      platform: req.body.platform || 'twitter',
      authorName: req.body.authorName || 'Simulated User',
      authorHandle: req.body.authorHandle || '@simulated_user',
      authorAvatar: req.body.authorAvatar,
      isVerified: Boolean(req.body.isVerified),
      content: req.body.content || 'Great service! Love the new Shogun 2.0 interface.',
      mediaUrls: req.body.mediaUrls || [],
      postUrl: req.body.postUrl,
      publishedAt: req.body.publishedAt || new Date().toISOString(),
    };

    // Attempt BullMQ ingestion with fallback to direct processor
    let result;
    try {
      if (process.env.ENABLE_WORKERS === 'true' && process.env.REDIS_URL) {
        await queueSocialInteraction(payload);
        result = { status: 'queued', message: 'Payload queued to BullMQ social worker.' };
      } else {
        result = await processInboundSocialInteraction(payload);
      }
    } catch {
      result = await processInboundSocialInteraction(payload);
    }

    res.status(201).json({
      success: true,
      message: 'Inbound social mention processed successfully.',
      data: result,
    });
  } catch (err: any) {
    console.error('[SocialRoutes Error] POST /simulate-inbound failed:', err);
    res.status(500).json({
      error: 'Failed to simulate inbound interaction',
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
    });
  }
});

export default socialRouter;
