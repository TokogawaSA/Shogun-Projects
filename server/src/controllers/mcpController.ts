import { Request, Response } from 'express';
import { summarizeAccountContext, generateTasksFromMeetingNotes } from '../mcp/crmTools.js';

export async function handleSummarizeAccount(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
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
    res.status(500).json({ error: 'Failed to summarize account context.', details: err.message });
  }
}

export async function handleGenerateTasks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const userId = req.tenantContext!.userId;
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
    res.status(500).json({ error: 'Failed to generate tasks from meeting notes.', details: err.message });
  }
}
