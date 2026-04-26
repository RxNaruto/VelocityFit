
import {
    ApiError,
    type AuthResult,
    type EntryDraft,
    type Exercise,
    type LeaderboardResponse,
    type LoginPayload,
    type MuscleGroup,
    type ProfilePatch,
    type ProfileStats,
    type PublicProfile,
    type RankInfo,
    type RegisterPayload,
    type User,
    type Workout,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
    authToken = token || null;
}

export function setOnUnauthorized(handler: (() => void) | null): void {
    onUnauthorized = typeof handler === 'function' ? handler : null;
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | undefined | null>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = opts;
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, String(v));
            }
        });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(url.toString().replace(window.location.origin, ''), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
    }

    if (res.status === 204) return null as T;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const message = data?.error?.message || `Request failed: ${res.status}`;
        throw new ApiError(message, res.status, data?.error?.details);
    }
    return data as T;
}

export const api = {
    // auth
    register: (payload: RegisterPayload) =>
        request<AuthResult>('/auth/register', { method: 'POST', body: payload }),
    login: (payload: LoginPayload) =>
        request<AuthResult>('/auth/login', { method: 'POST', body: payload }),
    logout: () => request<null>('/auth/logout', { method: 'POST' }),
    me: () => request<User>('/auth/me'),

    // profile
    getProfile: () => request<User>('/profile/me'),
    updateProfile: (patch: ProfilePatch) =>
        request<User>('/profile/me', { method: 'PUT', body: patch }),
    getStats: (period: 'all' | 'week' | 'month' = 'all') =>
        request<ProfileStats>('/profile/me/stats', { query: { period } }),

    // catalog
    getMuscleGroups: () => request<MuscleGroup[]>('/catalog/muscle-groups'),
    getExercises: (muscleGroupId?: string) =>
        request<Exercise[]>('/catalog/exercises', { query: { muscleGroupId } }),

    // workouts
    listWorkouts: (params?: { from?: string; to?: string }) =>
        request<Workout[]>('/workouts', { query: params }),
    getWorkoutByDate: (dateKey: string) =>
        request<Workout | null>(`/workouts/by-date/${dateKey}`),
    saveTodayWorkout: (entries: EntryDraft[]) =>
        request<Workout>('/workouts/today', { method: 'POST', body: { entries } }),
    updateWorkout: (id: string, entries: EntryDraft[]) =>
        request<Workout>(`/workouts/${id}`, { method: 'PUT', body: { entries } }),
    deleteWorkout: (id: string) => request<null>(`/workouts/${id}`, { method: 'DELETE' }),

    // leaderboard & public profiles
    getLeaderboard: (limit = 50) =>
        request<LeaderboardResponse>('/leaderboard', { query: { limit } }),
    getMyRank: () => request<RankInfo>('/leaderboard/me'),
    getPublicUser: (username: string) =>
        request<PublicProfile>(`/users/${encodeURIComponent(username)}`),
};

export function getAuthToken(): string | null {
    return authToken;
}
