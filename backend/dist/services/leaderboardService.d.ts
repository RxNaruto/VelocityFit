import type { LeaderboardRow, RankInfo } from '../types/domain.js';
export declare const KEY = "leaderboard:global";
export declare function setUserScore(userId: string, score: number): Promise<void>;
export declare function removeUser(userId: string): Promise<void>;
export declare function getTop(limit?: number): Promise<LeaderboardRow[]>;
export declare function getRank(userId: string): Promise<RankInfo>;
export declare function getSnapshot(): Promise<LeaderboardRow[]>;
export declare function clear(): Promise<void>;
//# sourceMappingURL=leaderboardService.d.ts.map