import { Redis, RedisOptions } from 'ioredis';
import { parseEnv } from './env.js';

export interface RedisSslConfig {
  rejectUnauthorized: boolean;
}

/**
 * Resolve POPIA Section 19 TLS settings for Redis / BullMQ connections.
 * Enforces `ssl: { rejectUnauthorized: true }` in production.
 */
export function getRedisSslConfig(rawEnv: NodeJS.ProcessEnv = process.env): RedisSslConfig | undefined {
  const cfg = parseEnv(rawEnv);
  const isProd = cfg.NODE_ENV === 'production';
  const isTlsUrl = Boolean(cfg.REDIS_URL?.startsWith('rediss://'));

  if (isProd || cfg.REDIS_TLS || isTlsUrl) {
    return { rejectUnauthorized: true };
  }

  return undefined;
}

/**
 * Construct Redis connection options from environment variables.
 * Enforces strict TLS (`tls: { rejectUnauthorized: true }`) in production.
 */
export function getRedisOptions(rawEnv: NodeJS.ProcessEnv = process.env): RedisOptions {
  const cfg = parseEnv(rawEnv);
  const sslConfig = getRedisSslConfig(rawEnv);

  const retryStrategy = (times: number) => {
    if (times > 3) {
      return null; // Stop retrying to prevent hanging without Redis server
    }
    return Math.min(times * 200, 1000);
  };

  if (cfg.REDIS_URL) {
    return {
      tls: sslConfig,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy,
    };
  }

  return {
    host: cfg.REDIS_HOST,
    port: cfg.REDIS_PORT,
    password: cfg.REDIS_PASSWORD || undefined,
    tls: sslConfig,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy,
  };
}

export const redisConnectionOptions: RedisOptions = getRedisOptions(process.env);

/**
 * Factory function to create dedicated Redis client instances
 */
export function createRedisConnection(rawEnv: NodeJS.ProcessEnv = process.env): Redis {
  const options = getRedisOptions(rawEnv);
  const url = rawEnv.REDIS_URL;
  const client = url ? new Redis(url, options) : new Redis(options);

  // Attach default error listener to prevent unhandled EventEmitter crash
  client.on('error', () => {
    // Suppress unhandled crash when Redis server is offline
  });

  return client;
}

// Default singleton Redis client
let defaultClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!defaultClient) {
    defaultClient = createRedisConnection(process.env);
    defaultClient.on('error', () => {
      // Suppress unhandled Redis error spam when offline
    });
  }
  return defaultClient;
}

export async function disconnectRedis(): Promise<void> {
  if (defaultClient) {
    try {
      await defaultClient.quit();
    } catch {
      defaultClient.disconnect();
    }
    defaultClient = null;
  }
}

export default getRedisClient;
