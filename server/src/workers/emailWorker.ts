import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { createRedisConnection } from '../config/redis.js';
import { QUEUE_NAMES, EmailJobPayload } from '../queues/index.js';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

/**
 * Replace double-brace template tokens (e.g. {{accountName}}, {{dealTitle}})
 */
export function interpolateTemplateTokens(
  template: string,
  variables: Record<string, any> = {}
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, token) => {
    const value = variables[token];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Send an email message given tenant configuration and payload
 */
export async function sendEmailMessage(payload: EmailJobPayload): Promise<{
  success: boolean;
  messageId?: string;
  recipient: string;
  subject: string;
}> {
  const { tenantId, to, subject, templateVariables, bodyHtml, bodyText, templateKey } = payload;

  return withTenantTx(tenantId, async (tx) => {
    let resolvedSubject = subject;
    let resolvedHtml = bodyHtml || '';
    let resolvedText = bodyText || '';

    // 1. Fetch Email Template if templateKey is provided
    if (templateKey) {
      const template = await tx.emailTemplate.findFirst({
        where: {
          tenantId,
          OR: [
            { name: templateKey },
            { subject: templateKey },
          ],
        },
      });

      if (template) {
        resolvedSubject = interpolateTemplateTokens(template.subject, templateVariables);
        const templateHtml = template.bodyHtml || template.htmlBody || '';
        resolvedHtml = interpolateTemplateTokens(templateHtml, templateVariables);
        resolvedText = interpolateTemplateTokens(templateHtml.replace(/<[^>]*>?/gm, ''), templateVariables);
      }
    } else {
      resolvedSubject = interpolateTemplateTokens(subject, templateVariables);
      if (resolvedHtml) resolvedHtml = interpolateTemplateTokens(resolvedHtml, templateVariables);
      if (resolvedText) resolvedText = interpolateTemplateTokens(resolvedText, templateVariables);
    }

    // 2. Fetch Tenant SMTP Configuration
    const emailConfig = await tx.emailConfig.findUnique({
      where: { tenantId },
    });

    let transporter: nodemailer.Transporter;
    const smtp = (emailConfig?.smtpSettings as Record<string, any>) || {};

    if (smtp.host && smtp.username) {
      transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.secure || smtp.port === 465,
        auth: {
          user: smtp.username,
          pass: smtp.password || '',
        },
      });
    } else {
      // Development / fallback mode: jsonTransport captures email payload without throwing SMTP connection errors
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    const fromAddress = emailConfig?.fromEmail || emailConfig?.senderEmail || process.env.SMTP_FROM || 'notifications@shogunate.solutions';
    const fromName = emailConfig?.fromName || emailConfig?.senderName || 'Shogun Projects Notification';

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: resolvedSubject,
      text: resolvedText || undefined,
      html: resolvedHtml || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    const messageId = info.messageId || `mock-${Date.now()}`;

    // Find system user for audit log
    const defaultUser = await tx.user.findFirst({ where: { tenantId } });
    const systemUserId = defaultUser?.id || 'usr-system';

    // 3. Record Activity Log
    await tx.entityActivityLog.create({
      data: {
        tenantId,
        moduleName: 'emails',
        entityId: messageId,
        action: 'sent',
        userId: systemUserId,
        description: `Email sent to ${to}: "${resolvedSubject}"`,
        fieldChanges: {
          recipient: to,
          templateKey,
          messageId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`[EmailWorker] Email sent to ${to} (Subject: "${resolvedSubject}", Message ID: ${messageId})`);
    return {
      success: true,
      messageId,
      recipient: to,
      subject: resolvedSubject,
    };
  });
}

/**
 * Initialize BullMQ Email Worker
 */
export function createEmailWorker(concurrency = 5): Worker {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job: Job) => {
      console.log(`[EmailWorker] Processing email job ${job.id}...`);
      return await sendEmailMessage(job.data as EmailJobPayload);
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[EmailWorker] Email job ${job.id} dispatched successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Email job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    // Suppress unhandled crash when Redis is offline
    console.warn('[EmailWorker Warning] Redis connection issue:', err.message);
  });

  return worker;
}

export default createEmailWorker;
