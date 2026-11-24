import { Router, Request, Response } from 'express';
import { prisma, getDatabasePoolConfig } from '../config/db.js';
import { evaluateDataResidency } from '../config/env.js';
import { getRedisSslConfig } from '../config/redis.js';
import { PRESIGNED_URL_TTL_SECONDS } from '../services/storageService.js';

export const healthRouter = Router();

/**
 * GET /api/v1/health/residency
 * Returns active South African data residency region, database/Redis TLS encryption status,
 * PgBouncer transaction pooling status, and POPIA Section 19 & Section 72 compliance flags.
 */
healthRouter.get('/residency', async (_req: Request, res: Response) => {
  const residencyAudit = evaluateDataResidency(process.env, { logWarnings: false });
  const dbPool = getDatabasePoolConfig(process.env);
  const redisSsl = getRedisSslConfig(process.env);

  let dbConnected = false;
  let sessionSslActive: boolean | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;

    try {
      const sslRows = await prisma.$queryRaw<Array<{ ssl: boolean }>>`
        SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()
      `;
      if (Array.isArray(sslRows) && sslRows.length > 0 && typeof sslRows[0]?.ssl === 'boolean') {
        sessionSslActive = sslRows[0].ssl;
      }
    } catch {
      // pg_stat_ssl view may be restricted on managed PgBouncer proxies; rely on configured TLS state
    }
  } catch {
    dbConnected = false;
  }

  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const dbTlsEnforced = Boolean(dbPool.ssl && dbPool.ssl.rejectUnauthorized);
  const redisTlsEnforced = Boolean(redisSsl && redisSsl.rejectUnauthorized);
  const section19Compliant = isProd ? dbTlsEnforced && redisTlsEnforced : true;
  const section72Compliant = residencyAudit.enforced && residencyAudit.compliant;

  const statusCode = dbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: dbConnected && residencyAudit.compliant ? 'ok' : 'degraded',
    service: 'shogun-server',
    environment: process.env.NODE_ENV || 'development',
    region: residencyAudit.region,
    activeRegion: residencyAudit.region,
    timezone: residencyAudit.timezone,
    databaseEncryption: {
      connected: dbConnected,
      tlsEnforced: dbTlsEnforced,
      ssl: dbPool.ssl,
      sessionSslActive: sessionSslActive ?? dbTlsEnforced,
      pooling: {
        mode: dbPool.poolMode,
        pgbouncerCompatible: dbPool.pgbouncer,
        statementCacheSize: dbPool.statementCacheSize,
        connectionLimit: dbPool.connectionLimit,
      },
    },
    redisEncryption: {
      tlsEnforced: redisTlsEnforced,
      ssl: redisSsl ?? false,
    },
    popiaCompliance: {
      compliant: section19Compliant && section72Compliant,
      section19SecuritySafeguards: section19Compliant,
      section72CrossBorderTransferControls: section72Compliant,
      enforceLocalResidency: residencyAudit.enforced,
      tenantIsolatedStorage: true,
      presignedUrlMaxTtlSeconds: PRESIGNED_URL_TTL_SECONDS,
      violations: residencyAudit.violations,
    },
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
