import type { PublicUser } from '../types/domain.js';
type Period = 'all' | 'week' | 'month';
export interface TopExercise {
    exerciseId: string;
    name: string;
    count: number;
}
export interface TopGroup {
    muscleGroupId: string;
    name: string;
    count: number;
}
export interface FavoriteExercise {
    exerciseId: string;
    name: string;
    muscleGroupId: string | null;
    muscleGroupName: string | null;
    totalSets: number;
    totalReps: number;
    sessions: number;
}
export interface ProfileStats {
    period: Period;
    periodStartDate: string | null;
    weekStartDate: string;
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    failureSets: number;
    firstWorkout: string | null;
    lastWorkout: string | null;
    currentStreakDays: number;
    topExercises: TopExercise[];
    topGroups: TopGroup[];
    favoriteExercise: FavoriteExercise | null;
    weeklyMuscleGroups: TopGroup[];
}
export declare function startOfWeekMondayKey(date?: Date): string;
export declare function startOfMonthKey(date?: Date): string;
export declare function getStats(userId: string, { period }?: {
    period?: string;
}): Promise<ProfileStats>;
interface ProfilePatch {
    name?: string;
    profilePhotoUrl?: string;
}
export declare function updateProfile(userId: string, patch?: ProfilePatch): Promise<PublicUser>;
export {};
//# sourceMappingURL=profileService.d.ts.map