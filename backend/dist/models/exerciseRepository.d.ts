import type { Exercise } from '@prisma/client';
export declare function findAll(): Promise<Exercise[]>;
export declare function findByMuscleGroup(muscleGroupId: string): Promise<Exercise[]>;
export declare function findById(id: string): Promise<Exercise | null>;
//# sourceMappingURL=exerciseRepository.d.ts.map