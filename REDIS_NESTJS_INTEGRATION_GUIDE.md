# Complete Guide: Resilient Redis Integration in NestJS

> **Goal:** A step-by-step blueprint to implement high-performance, fail-open Redis caching in any NestJS project using `ioredis`.

---

## 1. Architectural Philosophy & Resiliency Design

When integrating Redis into a production NestJS application, standard default connection configurations can cause your application to **crash on startup or hang on requests** if the Redis server is temporarily unreachable or offline.

### The Fail-Open Pattern
Our implementation uses a **fail-open pattern**:
* **Connection Resilience**: `lazyConnect: true` prevents NestJS initialization from blocking or crashing if Redis is down.
* **Bounded Retries**: Limits retry attempts on boot (`maxRetriesPerRequest: 1`) so server startup is never stalled.
* **Offline Fallback**: If Redis is offline, calls to `get()`, `set()`, `del()`, and `delByPattern()` log warnings gracefully and return `null` without throwing unhandled runtime exceptions. Your app continues serving traffic directly from the primary database (e.g., PostgreSQL).

---

## 2. Package Installation

Install `ioredis` and its TypeScript definitions:

```bash
# npm
npm install ioredis
npm install --save-dev @types/ioredis

# pnpm
pnpm add ioredis
pnpm add -D @types/ioredis

# yarn
yarn add ioredis
yarn add -D @types/ioredis
```

---

## 3. Environment Variables Setup

Add the following environment variables to your `.env.example` and `.env` files:

```env
# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_URL=""               # Optional connection string (e.g. redis://default:pass@redis-server:6379)
REDIS_ENABLED="true"       # Toggle caching on/off
```

---

## 4. Step-by-Step Implementation

### Step 4.1: Create `RedisService` (`src/redis/redis.service.ts`)

```typescript
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
```

---

### Step 4.2: Create Global `RedisModule` (`src/redis/redis.module.ts`)

```typescript
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

---

### Step 4.3: Register `RedisModule` in `AppModule` (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule, // Registered globally
    UsersModule,
  ],
})
export class AppModule {}
```

---

## 5. Practical Usage Patterns in NestJS Services

### Pattern A: Read-Through Cache Strategy

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilyTreeService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  async getFamilyTree(familyId: string, rootPersonId: string, depth: number = 3) {
    const cacheKey = `family:${familyId}:tree:${rootPersonId}:depth:${depth}`;

    // 1. Try cache first
    const cachedTree = await this.redisService.get<any>(cacheKey);
    if (cachedTree) {
      return cachedTree;
    }

    // 2. Fetch from Database if cache miss
    const tree = await this.fetchTreeFromDatabase(familyId, rootPersonId, depth);

    // 3. Store in Redis with TTL (e.g., 3600 seconds / 1 hour)
    await this.redisService.set(cacheKey, tree, 3600);

    return tree;
  }

  private async fetchTreeFromDatabase(familyId: string, rootPersonId: string, depth: number) {
    // Database query logic
    return { familyId, rootPersonId, nodes: [] };
  }
}
```

### Pattern B: Cache Invalidation on Mutation

```typescript
@Injectable()
export class RelationshipService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  async createRelationship(familyId: string, data: any) {
    // 1. Mutate Database
    const relationship = await this.prismaService.relationship.create({ data });

    // 2. Invalidate all cached trees for this family
    await this.redisService.delByPattern(`family:${familyId}:*`);

    return relationship;
  }
}
```

---

## 6. Unit Testing Setup (`src/redis/redis.service.spec.ts`)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle get gracefully when Redis is disconnected', async () => {
    const result = await service.get('test:key');
    expect(result).toBeNull();
  });

  it('should handle set gracefully when Redis is disconnected', async () => {
    await expect(service.set('test:key', { foo: 'bar' })).resolves.not.toThrow();
  });

  it('should handle delByPattern gracefully when Redis is disconnected', async () => {
    await expect(service.delByPattern('family:*')).resolves.not.toThrow();
  });
});
```

---

## 7. Production Best Practices & Recommendations

1. **Use `delByPattern` with Cursor Scanning**: Standard Redis `keys *` blocks the single-threaded Redis engine. Our implementation uses `scanStream` to iterate safely over keys without blocking production traffic.
2. **Upstash / Managed Redis**: If using Upstash or AWS ElastiCache, simply set `REDIS_URL="rediss://default:password@xxx.upstash.io:6379"`. The `RedisService` automatically parses TLS (`rediss://`) and connection parameters.
3. **Key Naming Convention**: Use namespaced colon-separated keys:  
   * `user:session:<session_id>`
   * `family:<family_id>:tree:<root_id>`
   * `rate_limit:<ip>`

---
*Created for FamilyRoots Architecture Documentation.*
