import config from "../config/index.js";
import { createRedisCache } from "./redisCache.js";
class InMemoryCache {
    kv = new Map();
    zsets = new Map();
    sortedCache = new Map();
    zset(key) {
        let z = this.zsets.get(key);
        if (!z) {
            z = new Map();
            this.zsets.set(key, z);
        }
        return z;
    }
    invalidateSorted(key) {
        this.sortedCache.set(key, null);
    }
    sorted(key) {
        const cached = this.sortedCache.get(key);
        if (cached)
            return cached;
        const z = this.zset(key);
        const arr = Array.from(z.entries()).map(([member, score]) => ({ member, score }));
        arr.sort((a, b) => {
            if (b.score !== a.score)
                return b.score - a.score;
            return a.member.localeCompare(b.member);
        });
        this.sortedCache.set(key, arr);
        return arr;
    }
    async zadd(key, score, member) {
        this.zset(key).set(member, Number(score));
        this.invalidateSorted(key);
        return 1;
    }
    async zincrby(key, increment, member) {
        const z = this.zset(key);
        const next = (z.get(member) || 0) + Number(increment);
        z.set(member, next);
        this.invalidateSorted(key);
        return next;
    }
    async zrem(key, member) {
        const z = this.zset(key);
        const had = z.delete(member);
        if (had)
            this.invalidateSorted(key);
        return had ? 1 : 0;
    }
    async zscore(key, member) {
        const v = this.zset(key).get(member);
        return v === undefined ? null : v;
    }
    async zrevrank(key, member) {
        const sorted = this.sorted(key);
        const idx = sorted.findIndex((e) => e.member === member);
        return idx === -1 ? null : idx;
    }
    async zcard(key) {
        return this.zset(key).size;
    }
    async zrevrangeWithScores(key, start = 0, stop = -1) {
        const sorted = this.sorted(key);
        const end = stop < 0 ? sorted.length + stop + 1 : stop + 1;
        return sorted.slice(start, end).map((e) => ({ ...e }));
    }
    async set(key, value) {
        this.kv.set(key, String(value));
        return 'OK';
    }
    async get(key) {
        return this.kv.has(key) ? this.kv.get(key) : null;
    }
    async del(key) {
        return this.kv.delete(key) ? 1 : 0;
    }
    async flushAll() {
        this.kv.clear();
        this.zsets.clear();
        this.sortedCache.clear();
    }
}
let instance = null;
export function getCache() {
    if (instance)
        return instance;
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
//# sourceMappingURL=cache.js.map