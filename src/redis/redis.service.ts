import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  async onModuleInit() {
    const enabled = process.env.REDIS_ENABLED !== 'false';
    if (!enabled) {
      this.logger.log('Redis caching is explicitly disabled via REDIS_ENABLED=false');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT) || 6379;
      const password = process.env.REDIS_PASSWORD || undefined;

      const options = {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 3000,
        retryStrategy(times: number) {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts on startup
          }
          return Math.min(times * 500, 2000);
        },
      };

      if (redisUrl && redisUrl.trim().length > 0) {
        this.client = new Redis(redisUrl, options);
      } else {
        this.client = new Redis({
          host,
          port,
          password,
          ...options,
        });
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Redis connected successfully (${redisUrl ? 'via URL' : `${host}:${port}`})`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`Could not connect to Redis server (${err.message}). Application will fall back to direct DB queries.`);
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore disconnect errors during shutdown
      }
    }
  }

  /**
   * Check if Redis connection is currently healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get parsed JSON data or string from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isHealthy() || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (err: any) {
      this.logger.warn(`Redis GET failed for key "${key}": ${err.message}`);
      return null;
    }
  }

  /**
   * Set key-value pair in Redis with optional TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err: any) {
      this.logger.warn(`Redis SET failed for key "${key}": ${err.message}`);
    }
  }

  /**
   * Delete single or multiple keys from Redis
   */
  async del(key: string | string[]): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Redis DEL failed: ${err.message}`);
    }
  }

  /**
   * Delete all keys matching a pattern (e.g. "family:123:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      const keysToDelete: string[] = [];
      for await (const resultKeys of stream) {
        if (resultKeys.length > 0) {
          keysToDelete.push(...resultKeys);
        }
      }

      if (keysToDelete.length > 0) {
        await this.client.del(...keysToDelete);
        this.logger.log(`Invalidated ${keysToDelete.length} Redis cache keys matching pattern "${pattern}"`);
      }
    } catch (err: any) {
      this.logger.warn(`Redis delByPattern failed for pattern "${pattern}": ${err.message}`);
    }
  }
}
