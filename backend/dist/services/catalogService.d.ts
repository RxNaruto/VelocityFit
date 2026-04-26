import type { Exercise, MuscleGroup } from "@prisma/client";
export declare function listMuscleGroups(): Promise<MuscleGroup[]>;
export declare function listExercises({ muscleGroupId, }?: {
    muscleGroupId?: string;
}): Promise<Exercise[]>;
//# sourceMappingURL=catalogService.d.ts.map