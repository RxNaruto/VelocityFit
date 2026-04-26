import { getCache } from '../data/cache.js';
import * as userRepo from '../models/userRepository.js';
import config from '../config/index.js';
import type { LeaderboardRow, RankInfo } from '../types/domain.js';
import type { User } from '@prisma/client';

export const KEY = 'leaderboard:global';
const cache = getCache();

function formatRow(user: User, score: number, rank: number): LeaderboardRow {
    return {
        rank: rank + 1,
        userId: user.id,
        username: user.username,
        name: user.name,
        profilePhotoUrl: user.profilePhotoUrl || '',
        points: score,
    };
}

export async function setUserScore(userId: string, score: number): Promise<void> {
    await cache.zadd(KEY, score, userId);
}

export async function removeUser(userId: string): Promise<void> {
    await cache.zrem(KEY, userId);
}

export async function getTop(
    limit: number = config.leaderboard.snapshotSize
): Promise<LeaderboardRow[]> {
    const entries = await cache.zrevrangeWithScores(KEY, 0, limit - 1);
    if (entries.length === 0) return [];
    // Batch-fetch users in one query rather than N+1.
    const users = await Promise.all(entries.map((e) => userRepo.findById(e.member)));
    const rows: LeaderboardRow[] = [];
    entries.forEach((e, i) => {
        const u = users[i];
        if (u) rows.push(formatRow(u, e.score, i));
    });
    return rows;
}

export async function getRank(userId: string): Promise<RankInfo> {
    const [rank, score, total] = await Promise.all([
        cache.zrevrank(KEY, userId),
        cache.zscore(KEY, userId),
        cache.zcard(KEY),
    ]);
    return {
        rank: rank === null ? null : rank + 1,
        points: score === null ? 0 : score,
        totalUsers: total,
    };
}

export async function getSnapshot(): Promise<LeaderboardRow[]> {
    return getTop(config.leaderboard.snapshotSize);
}

export async function clear(): Promise<void> {
    const users = await userRepo.findAll();
    for (const u of users) {
        await cache.zrem(KEY, u.id);
    }
}
