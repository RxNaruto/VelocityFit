/**
 * Application-level shapes returned to the API. We keep these separate
 * from raw Prisma model types so we can hide internal columns
 * (e.g. `passwordHash`) and reshape relations into a flat, JSON-friendly
 * structure for the frontend.
 */
export interface PublicUser {
    id: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    points: number;
    createdAt: string;
    updatedAt: string;
}
export interface SetDTO {
    id: string;
    reps: number;
    weight: number | null;
    isFailure: boolean;
}
export interface EntryDTO {
    id: string;
    exerciseId: string;
    notes: string;
    sets: SetDTO[];
}
export interface WorkoutDTO {
    id: string;
    userId: string;
    date: string;
    entries: EntryDTO[];
    createdAt: string;
    updatedAt: string;
}
export interface SetInput {
    id?: string;
    reps: number | string;
    weight?: number | string | null;
    isFailure?: boolean;
}
export interface EntryInput {
    id?: string;
    exerciseId: string;
    notes?: string;
    sets: SetInput[];
}
export interface MuscleGroupDTO {
    id: string;
    slug: string;
    name: string;
}
export interface ExerciseDTO {
    id: string;
    name: string;
    muscleGroupId: string;
}
export interface LeaderboardRow {
    rank: number;
    userId: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    points: number;
}
export interface RankInfo {
    rank: number | null;
    points: number;
    totalUsers: number;
}
//# sourceMappingURL=domain.d.ts.map