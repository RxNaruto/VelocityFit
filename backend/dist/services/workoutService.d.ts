import type { EntryInput, WorkoutDTO } from '../types/domain.js';
interface ListParams {
    from?: string;
    to?: string;
}
interface SavePayload {
    entries?: EntryInput[];
}
export declare function listWorkouts(userId: string, { from, to }?: ListParams): Promise<WorkoutDTO[]>;
export declare function getWorkoutByDate(userId: string, dateKey: string): Promise<WorkoutDTO | null>;
export declare function saveTodayWorkout(userId: string, { entries }: SavePayload): Promise<WorkoutDTO>;
export declare function updateWorkout(userId: string, id: string, { entries }: SavePayload): Promise<WorkoutDTO>;
export declare function deleteWorkout(userId: string, id: string): Promise<boolean>;
export {};
//# sourceMappingURL=workoutService.d.ts.map