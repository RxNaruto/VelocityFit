import * as profileService from './profileService.js';
interface RecentWorkout {
    id: string;
    date: string;
    exerciseCount: number;
    setCount: number;
}
export interface PublicProfile {
    id: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    createdAt: string;
    points: number;
    rank: number | null;
    totalUsers: number;
    stats: profileService.ProfileStats;
    recentWorkouts: RecentWorkout[];
}
/**
 * Builds the *publicly viewable* shape of a user. We intentionally include
 * the same workout statistics so anyone can compare progress, but we never
 * expose `passwordHash`, sessions, or workout-entry detail.
 */
export declare function getPublicProfile(username: string): Promise<PublicProfile>;
export {};
//# sourceMappingURL=userService.d.ts.map