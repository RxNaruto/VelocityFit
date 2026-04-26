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
export declare function getCache(): Cache;
//# sourceMappingURL=cache.d.ts.map