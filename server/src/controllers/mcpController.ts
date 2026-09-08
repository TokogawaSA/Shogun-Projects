import { Request, Response } from 'express';
import { summarizeAccountContext, generateTasksFromMeetingNotes } from '../mcp/crmTools.js';

export async function handleSummarizeAccount(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { accountId } = req.body;

    if (!accountId) {
      res.status(400).json({ error: 'accountId is required in request body.' });
      return;
    }

    const summary = await summarizeAccountContext(tenantId, accountId);
    res.json(summary);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({
      error: 'Failed to summarize account context.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function handleGenerateTasks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const userId = (req.user || req.tenantContext)?.userId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { accountId, meetingNotes, targetProjectId } = req.body;

    if (!accountId || !meetingNotes) {
      res.status(400).json({ error: 'accountId and meetingNotes are required in request body.' });
      return;
    }

    const result = await generateTasksFromMeetingNotes(
      tenantId,
      accountId,
      meetingNotes,
      targetProjectId,
      userId
    );

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to generate tasks from meeting notes.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}
