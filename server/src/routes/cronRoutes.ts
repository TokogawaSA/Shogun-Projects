import { Router } from 'express';
import { runRecurringTasksCron } from '../controllers/cronController.js';

export const cronRouter = Router();

// Cron triggers (guarded by X-Cron-Secret header)
cronRouter.post('/recurring-tasks', runRecurringTasksCron);

export default cronRouter;
