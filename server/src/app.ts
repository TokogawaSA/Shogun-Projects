import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './config/db.js';
import { authenticateTenant } from './middleware/auth.js';

// Route Modules
import { authRouter } from './routes/authRoutes.js';
import { crmRouter } from './routes/crmRoutes.js';
import { projectRouter } from './routes/projectRoutes.js';
import { catalogRouter } from './routes/catalogRoutes.js';
import { ppmRouter } from './routes/ppmRoutes.js';
import { cronRouter } from './routes/cronRoutes.js';
import { settingsRouter } from './routes/settingsRoutes.js';
import { mcpRouter } from './routes/mcpRoutes.js';
import { projectManagementRouter } from './routes/projectManagementRoutes.js';
import { hierarchyRouter } from './routes/hierarchyRoutes.js';
import { formRouter } from './routes/formRoutes.js';
import { socialRouter } from './routes/socialRoutes.js';
import { bookingRouter, publicBookingRouter } from './routes/bookingRoutes.js';

dotenv.config();

export const app = express();

// Security middleware
app.use(helmet());
// Parse CORS origins (supporting both CORS_ORIGIN and CLIENT_ORIGIN from cPanel)
const envOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : []),
].map((o) => o.trim()).filter(Boolean);

const isProd = process.env.NODE_ENV === 'production';
const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
const allowedOrigins = isProd
  ? envOrigins
  : Array.from(new Set([...envOrigins, ...defaultDevOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowed list
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (!isProd && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

// Health check endpoint with database probe
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'shogun-server',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'shogun-server',
      database: 'disconnected',
      ...(process.env.NODE_ENV === 'development' ? { error: err.message } : {}),
      timestamp: new Date().toISOString(),
    });
  }
});

// Public Authentication Routes
app.use('/api/auth', authLimiter, authRouter);

// cPanel Scheduled Worker / Cron Routes (guarded by X-Cron-Secret)
app.use('/api/cron', cronRouter);

// Protected Multi-Tenant Business Logic Routes
app.use('/api/crm', authenticateTenant, crmRouter);
app.use('/api/projects', authenticateTenant, projectRouter);
app.use('/api/catalog', authenticateTenant, catalogRouter);
app.use('/api/ppm', authenticateTenant, ppmRouter);
app.use('/api/pm', authenticateTenant, projectManagementRouter);
app.use('/api/settings', authenticateTenant, settingsRouter);
app.use('/api/mcp', authenticateTenant, mcpRouter);
app.use('/api/hierarchy', authenticateTenant, hierarchyRouter);
app.use('/api/forms', formRouter);
app.use('/api/public/bookings', publicBookingRouter);
app.use('/api/bookings', authenticateTenant, bookingRouter);
app.use('/api/v1/social', authenticateTenant, socialRouter);
app.use('/api/social', authenticateTenant, socialRouter);

// 404 Route Catch-All
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

export default app;
