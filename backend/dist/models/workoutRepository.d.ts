import type { EntryInput, WorkoutDTO } from '../types/domain.js';
export declare function findAllForUser(userId: string): Promise<WorkoutDTO[]>;
export declare function findByDateForUser(userId: string, dateKey: string): Promise<WorkoutDTO | null>;
export declare function findByIdForUser(userId: string, id: string): Promise<WorkoutDTO | null>;
export declare function findInRangeForUser(userId: string, startKey: string, endKey: string): Promise<WorkoutDTO[]>;
export declare function countForUser(userId: string): Promise<number>;
export interface CreateWorkoutInput {
    userId: string;
    date: string;
    entries: EntryInput[];
}
export declare function create({ userId, date, entries, }: CreateWorkoutInput): Promise<WorkoutDTO>;
export interface UpdateWorkoutPatch {
    entries?: EntryInput[];
}
export declare function update(id: string, patch: UpdateWorkoutPatch): Promise<WorkoutDTO | null>;
export declare function remove(id: string): Promise<boolean>;
/**
 * Returns lightweight stats used by the public profile page.
 * (Detailed stats live in profileService.)--
 */
export declare function statsForUser(userId: string): Promise<{
    totalWorkouts: number;
    totalSets: number;
}>;
//# sourceMappingURL=workoutRepository.d.ts.map