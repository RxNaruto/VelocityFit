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