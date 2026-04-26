/**
 * Shared API/domain types used across the frontend. Mirror the backend
 * DTOs so requests/responses are typed end-to-end.
 */

export interface User {
    id: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    points: number;
    createdAt: string;
    updatedAt: string;
}

export interface MuscleGroup {
    id: string;
    slug: string;
    name: string;
}

export interface Exercise {
    id: string;
    name: string;
    muscleGroupId: string;
}

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number | null;
    isFailure: boolean;
}

export interface SetDraft {
    id: string;
    reps: number | string;
    weight: number | string;
    isFailure: boolean;
}

export interface WorkoutEntry {
    id: string;
    exerciseId: string;
    notes: string;
    sets: WorkoutSet[];
}

export interface EntryDraft {
    exerciseId: string;
    notes: string;
    sets: Array<{
        reps: number;
        weight: number | null;
        isFailure: boolean;
    }>;
}

export interface Workout {
    id: string;
    userId: string;
    date: string;
    entries: WorkoutEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthResult {
    user: User;
    token: string;
}

export interface RegisterPayload {
    username: string;
    name: string;
    password: string;
    profilePhotoUrl?: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface ProfilePatch {
    name?: string;
    profilePhotoUrl?: string;
}

export interface LeaderboardRow {
    rank: number;
    userId: string;
    username: string;
    name: string;
    profilePhotoUrl: string;
    points: number;
}

export interface LeaderboardResponse {
    generatedAt: string;
    top: LeaderboardRow[];
}

export interface RankInfo {
    rank: number | null;
    points: number;
    totalUsers: number;
}

export interface UserUpdatedEvent {
    userId: string;
    points: number;
    rank: number | null;
}

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
    period: 'all' | 'week' | 'month';
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

export interface RecentPublicWorkout {
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
    stats: ProfileStats;
    recentWorkouts: RecentPublicWorkout[];
}

export class ApiError extends Error {
    status?: number;
    details?: unknown;
    constructor(message: string, status?: number, details?: unknown) {
        super(message);
        this.status = status;
        this.details = details;
    }
}