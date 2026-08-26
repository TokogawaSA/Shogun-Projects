import { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Construct Redis connection options from environment variables.
 */
export function getRedisOptions(): RedisOptions {
  if (process.env.REDIS_URL) {
    const isTls = process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_TLS === 'true';
    return {
      tls: isTls ? {} : undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying to prevent hanging without Redis server
        }
        return Math.min(times * 200, 1000);
      },
    };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const isTls = process.env.REDIS_TLS === 'true';

  return {
    host,
    port,
    password,
    tls: isTls ? {} : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // Stop retrying to prevent hanging without Redis server
      }
      return Math.min(times * 200, 1000);
    },
  };
}

export const redisConnectionOptions: RedisOptions = getRedisOptions();

/**
 * Factory function to create dedicated Redis client instances
 */
export function createRedisConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, redisConnectionOptions);
  }
  return new Redis(redisConnectionOptions);
}

// Default singleton Redis client
let defaultClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!defaultClient) {
    defaultClient = createRedisConnection();
    defaultClient.on('error', (err) => {
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
