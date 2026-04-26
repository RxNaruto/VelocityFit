import type { WorkoutDTO } from '../types/domain.js';
/**
 * Points formula (deterministic, easy to audit):
 *
 *   per workout day:
 *     base          = 25
 *     exercises     = 5  * # of exercise entries
 *     sets          = 2  * total # of sets across entries
 *     failure sets  = 3  * # of sets marked as taken to failure
 *     streak bonus  = min(streakDays * 5, 100)
 */
export declare const POINTS: {
    readonly PER_WORKOUT: 25;
    readonly PER_EXERCISE: 5;
    readonly PER_SET: 2;
    readonly PER_FAILURE_SET: 3;
    readonly STREAK_PER_DAY: 5;
    readonly STREAK_BONUS_CAP: 100;
};
export declare function pointsForWorkout(workout: WorkoutDTO | null | undefined, streakDays?: number): number;
/**
 * Walks the user's workouts in chronological order so we can compute the
 * streak length at each workout date and credit the streak bonus accordingly.
 */
export declare function totalPointsForUser(userId: string): Promise<number>;
/**
 * Persist new total to the user, update the leaderboard cache, and broadcast
 * a fresh snapshot to any connected SSE clients.
 */
export declare function onWorkoutChanged(userId: string): Promise<number>;
export declare function recomputeAll(): Promise<void>;
export declare function initUser(userId: string): Promise<void>;
//# sourceMappingURL=pointsService.d.ts.map