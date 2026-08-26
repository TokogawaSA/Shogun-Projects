import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma, disconnectDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health Check / Diagnostics Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'shogun-server',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'shogun-server',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[Shogun Server] REST API listening on port ${PORT}`);
});

const handleShutdown = async () => {
  console.log('[Shogun Server] Shutting down gracefully...');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default app;
