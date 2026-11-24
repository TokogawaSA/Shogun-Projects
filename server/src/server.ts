import { env } from './config/env.js';
import app from './app.js';
import { disconnectDatabase } from './config/db.js';
import { startWorkers, stopWorkers } from './workers/index.js';
import { initSocketServer } from './socket.js';

const PORT = env.PORT;

// Start HTTP server listener
export const server = app.listen(PORT, () => {
  console.log(`[Shogun Server] Multi-Tenant Express REST API running on port ${PORT}`);

  // Initialize Socket.io Real-Time Event Gateway
  try {
    initSocketServer(server);
  } catch (err: any) {
    console.warn('[Shogun Server] Socket.io gateway initialization warning:', err.message);
  }

  // Optionally start BullMQ background queue workers
  if (process.env.ENABLE_WORKERS !== 'false') {
    try {
      startWorkers();
    } catch (err: any) {
      console.warn('[Shogun Server] BullMQ workers not started (Redis may be offline):', err.message);
    }
  }
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`[Shogun Server] Received ${signal}. Gracefully closing server connections...`);
  try {
    await stopWorkers();
  } catch (err: any) {
    console.warn('[Shogun Server] Worker shutdown error:', err.message);
  }

  server.close(async () => {
    await disconnectDatabase();
    console.log('[Shogun Server] Database pool disconnected. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Export app for cPanel Phusion Passenger compatibility
export default app;

