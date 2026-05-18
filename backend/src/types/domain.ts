export interface PublicUser {
    id: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    points: number;
    createdAt: string;
    updatedAt: string;
}

export interface SetDropDTO {
    id: string;
    reps: number;
    weight: number | null;
}

export interface SetDTO {
    id: string;
    reps: number;
    weight: number | null;
    isFailure: boolean;
    /** Optional drop-set segments, in chronological order. */
    drops: SetDropDTO[];
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

export interface SetDropInput {
    id?: string;
    reps: number | string;
    weight?: number | string | null;
}

export interface SetInput {
    id?: string;
    reps: number | string;
    weight?: number | string | null;
    isFailure?: boolean;
    /** Optional drop-set segments (no rest after the parent set's failure). */
    drops?: SetDropInput[];
}

export interface EntryInput {
    id?: string;
    exerciseId: string;
    notes?: string;
    sets: SetInput[];
}

/** Payload accepted by the catalog-admin endpoints. */
export interface MuscleGroupInput {
    id?: string;
    slug: string;
    name: string;
}

export interface ExerciseInput {
    id?: string;
    name: string;
    muscleGroupId: string;
    tracksTime?: boolean;
}

export interface ExerciseUpdateInput {
    name?: string;
    muscleGroupId?: string;
    tracksTime?: boolean;
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
    /** Time-per-set instead of reps × weight (cardio + isometrics). */
    tracksTime: boolean;
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