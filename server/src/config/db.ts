import { PrismaClient } from '@prisma/client';
import { parseEnv } from './env.js';

export interface DatabaseSslConfig {
  rejectUnauthorized: boolean;
}

export interface DatabasePoolConfig {
  ssl: DatabaseSslConfig | false;
  pgbouncer: boolean;
  poolMode: 'transaction';
  statementCacheSize: number;
  connectionLimit: number;
  poolTimeout: number;
}

/**
 * Build POPIA Section 19 compliant TLS and PgBouncer transaction-pooling configuration.
 * Enforces `ssl: { rejectUnauthorized: true }` in production.
 */
export function getDatabasePoolConfig(rawEnv: NodeJS.ProcessEnv = process.env): DatabasePoolConfig {
  const cfg = parseEnv(rawEnv);
  const isProd = cfg.NODE_ENV === 'production';
  const requireSsl = isProd || cfg.DB_SSL;

  return {
    ssl: requireSsl ? { rejectUnauthorized: true } : false,
    pgbouncer: isProd ? true : cfg.DB_PGBOUNCER,
    poolMode: 'transaction',
    statementCacheSize: 0,
    connectionLimit: cfg.DB_CONNECTION_LIMIT,
    poolTimeout: cfg.DB_POOL_TIMEOUT,
  };
}

/**
 * Append or enforce PgBouncer transaction pooling and strict TLS query parameters on a PostgreSQL URI.
 */
function applyPoolingAndSslParams(baseUri: string, poolCfg: DatabasePoolConfig): string {
  const separator = baseUri.includes('?') ? '&' : '?';
  const [basePart, rawQuery = ''] = baseUri.split('?');
  const params = new URLSearchParams(rawQuery);

  if (!params.has('connection_limit')) {
    params.set('connection_limit', String(poolCfg.connectionLimit));
  }
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', String(poolCfg.poolTimeout));
  }

  // PgBouncer-compatible transaction pooling (disables prepared statement collisions)
  if (poolCfg.pgbouncer) {
    params.set('pgbouncer', 'true');
    params.set('statement_cache_size', String(poolCfg.statementCacheSize));
  }

  // Enforce strict TLS verification in production (`ssl: { rejectUnauthorized: true }`)
  if (poolCfg.ssl && poolCfg.ssl.rejectUnauthorized) {
    const existingMode = params.get('sslmode');
    if (!existingMode || existingMode === 'disable' || existingMode === 'prefer' || existingMode === 'allow') {
      params.set('sslmode', 'require');
    }
    params.set('sslaccept', 'strict');
  }

  const queryString = params.toString();
  return queryString ? `${basePart}${separator === '&' || queryString ? '?' : ''}${queryString}` : basePart;
}

/**
 * Construct or normalize the PostgreSQL connection URL with PgBouncer transaction pooling
 * and production TLS safeguards.
 */
export function getDatabaseUrl(rawEnv: NodeJS.ProcessEnv = process.env): string {
  const cfg = parseEnv(rawEnv);
  const poolCfg = getDatabasePoolConfig(rawEnv);

  if (cfg.DATABASE_URL) {
    return applyPoolingAndSslParams(cfg.DATABASE_URL, poolCfg);
  }

  const host = cfg.DB_HOST;
  const port = cfg.DB_PORT;
  const user = encodeURIComponent(cfg.DB_USER);
  const password = encodeURIComponent(cfg.DB_PASSWORD);
  const database = cfg.DB_NAME;
  const schema = cfg.DB_SCHEMA;

  const baseUri = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${encodeURIComponent(schema)}`;
  return applyPoolingAndSslParams(baseUri, poolCfg);
}

// Ensure DATABASE_URL is populated for Prisma engine initialization
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl(process.env);
}

export const dbPoolConfig: DatabasePoolConfig = getDatabasePoolConfig(process.env);

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Singleton Prisma Client Instance with PgBouncer-Compatible Connection Pooling
 */
export const prisma: PrismaClient =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(process.env),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Gracefully close database connection pools on process termination
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
