import config from "../config/index.js";
import { createRedisCache } from "./redisCache.js";

/**
 * Pluggable cache with a Redis-compatible subset of commands. The in-memory
 * adapter implemented here covers exactly the operations the leaderboard
 * and points services need. The shape mirrors `ioredis` so when a Redis
 * URL becomes available we can ship a `redisCache.ts` adapter exposing
 * the same surface and swap by switching `CACHE_DRIVER` in `.env`.
 */

export interface ZEntry {
    member: string;
    score: number;
}

export interface Cache {
    zadd(key: string, score: number, member: string): Promise<number>;
    zincrby(key: string, increment: number, member: string): Promise<number>;
    zrem(key: string, member: string): Promise<number>;
    zscore(key: string, member: string): Promise<number | null>;
    zrevrank(key: string, member: string): Promise<number | null>;
    zcard(key: string): Promise<number>;
    zrevrangeWithScores(key: string, start?: number, stop?: number): Promise<ZEntry[]>;
    set(key: string, value: string | number): Promise<'OK'>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    flushAll(): Promise<void>;
}

class InMemoryCache implements Cache {
    private kv = new Map<string, string>();
    private zsets = new Map<string, Map<string, number>>();
    private sortedCache = new Map<string, ZEntry[] | null>();

    private zset(key: string): Map<string, number> {
        let z = this.zsets.get(key);
        if (!z) {
            z = new Map();
            this.zsets.set(key, z);
        }
        return z;
    }

    private invalidateSorted(key: string): void {
        this.sortedCache.set(key, null);
    }

    private sorted(key: string): ZEntry[] {
        const cached = this.sortedCache.get(key);
        if (cached) return cached;
        const z = this.zset(key);
        const arr: ZEntry[] = Array.from(z.entries()).map(([member, score]) => ({ member, score }));
        arr.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.member.localeCompare(b.member);
        });
        this.sortedCache.set(key, arr);
        return arr;
    }

    async zadd(key: string, score: number, member: string): Promise<number> {
        this.zset(key).set(member, Number(score));
        this.invalidateSorted(key);
        return 1;
    }

    async zincrby(key: string, increment: number, member: string): Promise<number> {
        const z = this.zset(key);
        const next = (z.get(member) || 0) + Number(increment);
        z.set(member, next);
        this.invalidateSorted(key);
        return next;
    }

    async zrem(key: string, member: string): Promise<number> {
        const z = this.zset(key);
        const had = z.delete(member);
        if (had) this.invalidateSorted(key);
        return had ? 1 : 0;
    }

    async zscore(key: string, member: string): Promise<number | null> {
        const v = this.zset(key).get(member);
        return v === undefined ? null : v;
    }

    async zrevrank(key: string, member: string): Promise<number | null> {
        const sorted = this.sorted(key);
        const idx = sorted.findIndex((e) => e.member === member);
        return idx === -1 ? null : idx;
    }

    async zcard(key: string): Promise<number> {
        return this.zset(key).size;
    }

    async zrevrangeWithScores(key: string, start = 0, stop = -1): Promise<ZEntry[]> {
        const sorted = this.sorted(key);
        const end = stop < 0 ? sorted.length + stop + 1 : stop + 1;
        return sorted.slice(start, end).map((e) => ({ ...e }));
    }

    async set(key: string, value: string | number): Promise<'OK'> {
        this.kv.set(key, String(value));
        return 'OK';
    }

    async get(key: string): Promise<string | null> {
        return this.kv.has(key) ? (this.kv.get(key) as string) : null;
    }

    async del(key: string): Promise<number> {
        return this.kv.delete(key) ? 1 : 0;
    }

    async flushAll(): Promise<void> {
        this.kv.clear();
        this.zsets.clear();
        this.sortedCache.clear();
    }
}

let instance: Cache | null = null;

export function getCache(): Cache {
    if (instance) return instance;
    switch (config.cache.driver) {
        case 'redis':
            if (!config.cache.url) {
                console.warn('[cache] redis driver requested but REDIS_URL is empty; falling back to memory');
                instance = new InMemoryCache();
                break;
            }
            instance = createRedisCache(config.cache.url);
            break;
        case 'memory':
        default:
            instance = new InMemoryCache();
    }
    return instance;
}
