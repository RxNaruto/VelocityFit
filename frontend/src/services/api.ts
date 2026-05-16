import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
  } from 'axios';
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
  
  export function getAuthToken(): string | null {
    return authToken;
  }
  
  const http: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Inject the bearer token on every request from the in-memory holder.
  http.interceptors.request.use((config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    } else if (config.headers && 'Authorization' in config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  });
  
  // Map axios errors -> ApiError so the rest of the app keeps a single error type.
  http.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: { message?: string; details?: unknown } }>) => {
      const status = error.response?.status;
      if (status === 401 && onUnauthorized) onUnauthorized();
      const data = error.response?.data;
      const message =
        data?.error?.message || error.message || `Request failed: ${status ?? 'network'}`;
      return Promise.reject(new ApiError(message, status, data?.error?.details));
    }
  );
  
  interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    query?: Record<string, string | number | undefined | null>;
  }
  
  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = opts;
    const params: Record<string, string | number> = {};
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params[k] = v as string | number;
      });
    }
    const config: AxiosRequestConfig = {
      url: path,
      method,
      params,
      data: body,
    };
    const res = await http.request<T>(config);
    if (res.status === 204) return null as T;
    return res.data;
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
  
    // leaderboard & public profiles (plain CRUD now — no SSE)
    getLeaderboard: (limit = 50) =>
      request<LeaderboardResponse>('/leaderboard', { query: { limit } }),
    getMyRank: () => request<RankInfo>('/leaderboard/me'),
    getPublicUser: (username: string) =>
      request<PublicProfile>(`/users/${encodeURIComponent(username)}`),
  };