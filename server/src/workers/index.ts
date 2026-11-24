import { Worker } from 'bullmq';
import { createWorkflowWorker } from './workflowWorker.js';
import { createHealthCheckWorker } from './healthCheckWorker.js';
import { createEmailWorker } from './emailWorker.js';
import { createSocialAnalysisWorker } from './socialWorker.js';
import { createPopiaRetentionWorker } from './popiaWorker.js';
import { createBbbeeExpiryWorker } from './bbbeeExpiryWorker.js';
import { createAccountingSyncWorker } from './accountingSyncWorker.js';
import { disconnectRedis } from '../config/redis.js';

export interface RunningWorkers {
  workflowWorker: Worker;
  healthCheckWorker: Worker;
  emailWorker: Worker;
  socialWorker: Worker;
  popiaRetentionWorker: Worker;
  bbbeeExpiryWorker: Worker;
  accountingSyncWorker: Worker;
}

let activeWorkers: RunningWorkers | null = null;

/**
 * Initialize and start all background BullMQ workers
 */
export function startWorkers(): RunningWorkers {
  if (activeWorkers) {
    return activeWorkers;
  }

  console.log('🚀 [BullMQ Workers] Initializing background queue consumers...');

  const workflowWorker = createWorkflowWorker();
  const healthCheckWorker = createHealthCheckWorker();
  const emailWorker = createEmailWorker();
  const socialWorker = createSocialAnalysisWorker();
  const popiaRetentionWorker = createPopiaRetentionWorker();
  const bbbeeExpiryWorker = createBbbeeExpiryWorker();
  const accountingSyncWorker = createAccountingSyncWorker();

  activeWorkers = {
    workflowWorker,
    healthCheckWorker,
    emailWorker,
    socialWorker,
    popiaRetentionWorker,
    bbbeeExpiryWorker,
    accountingSyncWorker,
  };

  console.log('✅ [BullMQ Workers] All queue workers active and listening for jobs.');
  return activeWorkers;
}

/**
 * Gracefully close all workers and release Redis connections
 */
export async function stopWorkers(): Promise<void> {
  if (!activeWorkers) {
    return;
  }

  console.log('🛑 [BullMQ Workers] Gracefully closing worker instances...');
  await Promise.all([
    activeWorkers.workflowWorker.close(),
    activeWorkers.healthCheckWorker.close(),
    activeWorkers.emailWorker.close(),
    activeWorkers.socialWorker.close(),
    activeWorkers.popiaRetentionWorker.close(),
    activeWorkers.bbbeeExpiryWorker.close(),
    activeWorkers.accountingSyncWorker.close(),
  ]);

  await disconnectRedis();
  activeWorkers = null;
  console.log('✅ [BullMQ Workers] Worker connections terminated cleanly.');
}

export default startWorkers;
