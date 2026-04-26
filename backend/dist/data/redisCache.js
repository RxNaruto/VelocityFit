import { Redis } from "ioredis";
function asNumberOrNull(v) {
    if (v === null)
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
export function createRedisCache(redisUrl) {
    const client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
    });
    let connectPromise = null;
    async function ensureConnected() {
        if (client.status === "ready")
            return;
        if (!connectPromise) {
            connectPromise = client.connect().then(() => undefined);
        }
        await connectPromise;
    }
    async function zrevrangeWithScores(key, start = 0, stop = -1) {
        await ensureConnected();
        // ioredis supports `WITHSCORES` flag and returns string[].
        const raw = (await client.zrevrange(key, start, stop, "WITHSCORES"));
        const out = [];
        for (let i = 0; i < raw.length; i += 2) {
            const member = raw[i];
            const scoreStr = raw[i + 1];
            if (member === undefined || scoreStr === undefined)
                continue;
            const score = Number(scoreStr);
            out.push({ member, score });
        }
        return out;
    }
    return {
        async zadd(key, score, member) {
            await ensureConnected();
            // Returns number of elements added.
            return await client.zadd(key, Number(score), member);
        },
        async zincrby(key, increment, member) {
            await ensureConnected();
            const v = await client.zincrby(key, Number(increment), member);
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        },
        async zrem(key, member) {
            await ensureConnected();
            return await client.zrem(key, member);
        },
        async zscore(key, member) {
            await ensureConnected();
            return asNumberOrNull(await client.zscore(key, member));
        },
        async zrevrank(key, member) {
            await ensureConnected();
            const v = await client.zrevrank(key, member);
            return v === null ? null : Number(v);
        },
        async zcard(key) {
            await ensureConnected();
            return await client.zcard(key);
        },
        async zrevrangeWithScores(key, start, stop) {
            return await zrevrangeWithScores(key, start, stop);
        },
        async set(key, value) {
            await ensureConnected();
            return await client.set(key, String(value));
        },
        async get(key) {
            await ensureConnected();
            return await client.get(key);
        },
        async del(key) {
            await ensureConnected();
            return await client.del(key);
        },
        async flushAll() {
            await ensureConnected();
            await client.flushall();
        },
    };
}
//# sourceMappingURL=redisCache.js.map