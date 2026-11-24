import { env, bootResidencyAudit } from './config/env.js';
import { disconnectDatabase } from './config/db.js';
import { startWorkers, stopWorkers } from './workers/index.js';

console.log(
  `[Shogun SA Worker] Booting BullMQ background workers in region "${env.DATA_RESIDENCY_REGION}" (TZ=${env.DEFAULT_TIMEZONE}, POPIA Compliant=${bootResidencyAudit.compliant})`
);

startWorkers();

const handleShutdown = async (signal: string) => {
  console.log(`[Shogun SA Worker] Received ${signal}. Draining BullMQ workers and closing connections...`);
  try {
    await stopWorkers();
  } catch (err: any) {
    console.warn('[Shogun SA Worker] Error stopping workers:', err.message);
  }

  try {
    await disconnectDatabase();
  } catch (err: any) {
    console.warn('[Shogun SA Worker] Error disconnecting database:', err.message);
  }

  console.log('[Shogun SA Worker] Clean shutdown complete.');
  process.exit(0);
};

process.on('SIGTERM', () => void handleShutdown('SIGTERM'));
process.on('SIGINT', () => void handleShutdown('SIGINT'));
