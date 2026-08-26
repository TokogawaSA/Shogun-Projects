import { Worker } from 'bullmq';
import { createWorkflowWorker } from './workflowWorker.js';
import { createHealthCheckWorker } from './healthCheckWorker.js';
import { createEmailWorker } from './emailWorker.js';
import { disconnectRedis } from '../config/redis.js';

export interface RunningWorkers {
  workflowWorker: Worker;
  healthCheckWorker: Worker;
  emailWorker: Worker;
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

  activeWorkers = {
    workflowWorker,
    healthCheckWorker,
    emailWorker,
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
  ]);

  await disconnectRedis();
  activeWorkers = null;
  console.log('✅ [BullMQ Workers] Worker connections terminated cleanly.');
}

export default startWorkers;
