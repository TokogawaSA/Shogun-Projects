import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db.js';
import { createRedisConnection } from './config/redis.js';
import { AuthUserClaims } from './types/auth.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[FATAL SECURITY EXCEPTION] JWT_SECRET must be explicitly defined in environment variables for production execution.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';

export interface AuthenticatedSocket extends Socket {
  user?: AuthUserClaims;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io real-time event gateway with Redis Pub/Sub adapter
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) {
    return io;
  }

  console.log('⚡ [Socket.io Gateway] Initializing Real-Time WebSocket Server...');

  const rawOrigins = [
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : []),
  ].map((o) => o.trim()).filter(Boolean);

  const isProd = process.env.NODE_ENV === 'production';
  const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  const allowedOrigins = isProd
    ? rawOrigins
    : Array.from(new Set([...rawOrigins, ...defaultDevOrigins]));

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (!isProd && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))
        ) {
          callback(null, true);
        } else {
          callback(new Error('WebSocket CORS rejected'));
        }
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Attach Redis adapter for horizontal scaling if Redis is explicitly configured
  if (process.env.REDIS_URL || process.env.ENABLE_REDIS === 'true') {
    try {
      const pubClient = createRedisConnection();
      const subClient = createRedisConnection();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('🔗 [Socket.io Gateway] Redis Pub/Sub Adapter attached successfully.');
    } catch (err: any) {
      console.warn('[Socket.io Gateway] Running without Redis adapter (in-memory fallback):', err.message);
    }
  } else {
    console.log('⚡ [Socket.io Gateway] Running in standalone in-memory mode.');
  }

  // Socket Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.substring(7).trim()
        : null);

    if (!token) {
      console.warn('[Socket.io Auth] Connection rejected: Missing token.');
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserClaims;
      if (!decoded || !decoded.tenantId || !decoded.userId) {
        return next(new Error('Invalid token payload'));
      }

      socket.user = decoded;
      next();
    } catch (err: any) {
      console.warn('[Socket.io Auth] Verification failed:', err.message);
      next(new Error('Unauthorized'));
    }
  });

  // Socket Connection Handlers
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    const tenantRoom = `tenant:${user.tenantId}`;

    // Join tenant-isolated room by default
    socket.join(tenantRoom);
    console.log(`🔌 [Socket.io] User ${user.email} (${user.userId}) connected to ${tenantRoom}`);

    // Join specific project room for live collaborative Kanban & Gantt
    socket.on('join_project_room', async (projectId: string) => {
      if (!projectId) return;
      try {
        const project = await prisma.project.findFirst({
          where: { id: projectId, tenantId: user.tenantId },
          select: { id: true },
        });
        if (!project) {
          console.warn(`⚠️ [Socket.io] User ${user.email} denied access to project room ${projectId}`);
          return;
        }
        const projectRoom = `tenant:${user.tenantId}:project:${projectId}`;
        socket.join(projectRoom);
        console.log(`📍 [Socket.io] User ${user.email} joined project room: ${projectRoom}`);
      } catch (err: any) {
        console.error('[Socket.io] Failed to verify project room ownership:', err.message);
      }
    });

    // Leave project room
    socket.on('leave_project_room', (projectId: string) => {
      if (!projectId) return;
      const projectRoom = `tenant:${user.tenantId}:project:${projectId}`;
      socket.leave(projectRoom);
      console.log(`🚪 [Socket.io] User ${user.email} left project room: ${projectRoom}`);
    });

    // Client-initiated collaborative events
    socket.on('kanban:task_moved', (data: { projectId: string; taskId: string; newStatus: string; position?: number }) => {
      if (!data.projectId) return;
      const projectRoom = `tenant:${user.tenantId}:project:${data.projectId}`;
      socket.to(projectRoom).emit('kanban:task_moved', {
        ...data,
        movedBy: { userId: user.userId, email: user.email },
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('gantt:task_rescheduled', (data: { projectId: string; taskId: string; startDate: string; dueDate: string }) => {
      if (!data.projectId) return;
      const projectRoom = `tenant:${user.tenantId}:project:${data.projectId}`;
      socket.to(projectRoom).emit('gantt:task_rescheduled', {
        ...data,
        rescheduledBy: { userId: user.userId, email: user.email },
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.io] User ${user.email} disconnected (${reason})`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

// ============================================================================
// SERVER-SIDE BROADCAST HELPERS
// ============================================================================

export function broadcastToTenant(tenantId: string, event: string, data: any): void {
  if (!io) return;
  const room = `tenant:${tenantId}`;
  io.to(room).emit(event, data);
}

export function broadcastToProject(tenantId: string, projectId: string, event: string, data: any): void {
  if (!io) return;
  const room = `tenant:${tenantId}:project:${projectId}`;
  io.to(room).emit(event, data);
}

export function broadcastKanbanUpdate(tenantId: string, projectId: string, payload: {
  taskId: string;
  status: string;
  progress?: number;
  userId?: string;
}): void {
  broadcastToProject(tenantId, projectId, 'kanban:task_updated', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastGanttUpdate(tenantId: string, projectId: string, payload: {
  taskId: string;
  milestoneId?: string;
  completionPercentage?: number;
  status?: string;
}): void {
  broadcastToProject(tenantId, projectId, 'gantt:progress_synced', {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

export default initSocketServer;
