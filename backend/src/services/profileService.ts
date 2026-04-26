import * as userRepo from '../models/userRepository.js';
import * as workoutRepo from '../models/workoutRepository.js';
import * as exerciseRepo from '../models/exerciseRepository.js';
import * as muscleGroupRepo from '../models/muscleGroupRepository.js';
import HttpError from '../utils/HttpError.js';
import { todayKey, toDateKey } from '../utils/dates.js';
import type { PublicUser, WorkoutDTO } from '../types/domain.js';
import type { Exercise, MuscleGroup } from '@prisma/client';

type Period = 'all' | 'week' | 'month';
const PERIODS = new Set<Period>(['all', 'week', 'month']);

interface ExerciseStat {
    exerciseId: string;
    name: string;
    muscleGroupId: string | null;
    muscleGroupName: string | null;
    entries: number;
    sets: number;
    reps: number;
}

interface AggregatedStats {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    failureSets: number;
    exerciseStats: Record<string, ExerciseStat>;
    groupCount: Record<string, number>;
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
    period: Period;
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

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function startOfWeekMondayKey(date: Date = new Date()): string {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return toDateKey(d) as string;
}

export function startOfMonthKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

function periodStartKey(period: Period): string | null {
    if (period === 'week') return startOfWeekMondayKey();
    if (period === 'month') return startOfMonthKey();
    return null;
}

function aggregate(
    list: WorkoutDTO[],
    exerciseLookup: Map<string, Exercise>,
    groupLookup: Map<string, MuscleGroup>
): AggregatedStats {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let failureSets = 0;
    const exerciseStats: Record<string, ExerciseStat> = {};
    const groupCount: Record<string, number> = {};

    list.forEach((w) => {
        w.entries.forEach((entry) => {
            const ex = exerciseLookup.get(entry.exerciseId);
            const groupId = ex ? ex.muscleGroupId : null;
            if (groupId) {
                groupCount[groupId] = (groupCount[groupId] || 0) + 1;
            }
            if (!exerciseStats[entry.exerciseId]) {
                exerciseStats[entry.exerciseId] = {
                    exerciseId: entry.exerciseId,
                    name: ex?.name || entry.exerciseId,
                    muscleGroupId: groupId,
                    muscleGroupName: groupId ? groupLookup.get(groupId)?.name || null : null,
                    entries: 0,
                    sets: 0,
                    reps: 0,
                };
            }
            const s = exerciseStats[entry.exerciseId]!;
            s.entries += 1;
            entry.sets.forEach((set) => {
                totalSets += 1;
                s.sets += 1;
                const reps = Number(set.reps) || 0;
                totalReps += reps;
                s.reps += reps;
                if (set.isFailure) failureSets += 1;
                if (set.weight != null) {
                    totalVolume += reps * (Number(set.weight) || 0);
                }
            });
        });
    });

    return { totalSets, totalReps, totalVolume, failureSets, exerciseStats, groupCount };
}

function topExercises(stats: Record<string, ExerciseStat>, limit = 5): TopExercise[] {
    return Object.values(stats)
        .sort((a, b) => b.entries - a.entries || b.sets - a.sets)
        .slice(0, limit)
        .map((e) => ({ exerciseId: e.exerciseId, name: e.name, count: e.entries }));
}

function topGroups(
    groupCount: Record<string, number>,
    groupLookup: Map<string, MuscleGroup>
): TopGroup[] {
    return Object.entries(groupCount)
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({
            muscleGroupId: id,
            name: groupLookup.get(id)?.name || id,
            count,
        }));
}

function favoriteExercise(stats: Record<string, ExerciseStat>): FavoriteExercise | null {
    const all = Object.values(stats);
    if (all.length === 0) return null;
    all.sort((a, b) => b.sets - a.sets || b.reps - a.reps);
    const top = all[0];
    if (!top) return null;
    if (top.sets === 0) return null;
    return {
        exerciseId: top.exerciseId,
        name: top.name,
        muscleGroupId: top.muscleGroupId,
        muscleGroupName: top.muscleGroupName,
        totalSets: top.sets,
        totalReps: top.reps,
        sessions: top.entries,
    };
}

function currentStreak(allWorkouts: WorkoutDTO[]): number {
    const dateSet = new Set(allWorkouts.map((w) => w.date));
    let streak = 0;
    const cursor = new Date();
    if (!dateSet.has(todayKey())) {
        cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
        const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(
            cursor.getDate()
        )}`;
        if (!dateSet.has(key)) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export async function getStats(
    userId: string,
    { period = 'all' }: { period?: string } = {}
): Promise<ProfileStats> {
    const safePeriod: Period = PERIODS.has(period as Period) ? (period as Period) : 'all';
    const all = await workoutRepo.findAllForUser(userId);

    const startKey = periodStartKey(safePeriod);
    const inPeriod = startKey ? all.filter((w) => w.date >= startKey) : all;

    // Build lookup maps once for both aggregations.
    const [exercisesList, groupsList] = await Promise.all([
        exerciseRepo.findAll(),
        muscleGroupRepo.findAll(),
    ]);
    const exerciseLookup = new Map(exercisesList.map((e) => [e.id, e]));
    const groupLookup = new Map(groupsList.map((g) => [g.id, g]));

    const periodAgg = aggregate(inPeriod, exerciseLookup, groupLookup);
    const allAgg = aggregate(all, exerciseLookup, groupLookup);

    const sortedDates = all.map((w) => w.date).sort();
    const firstWorkout = sortedDates[0] || null;
    const lastWorkout = sortedDates[sortedDates.length - 1] || null;

    // Weekly-only widget: muscles hit since this week's Monday — distinct
    // *days* per group, not entries.
    const weekStart = startOfWeekMondayKey();
    const weekWorkouts = all.filter((w) => w.date >= weekStart);
    const groupDays: Record<string, number> = {};
    weekWorkouts.forEach((w) => {
        const seenInDay = new Set<string>();
        w.entries.forEach((entry) => {
            const ex = exerciseLookup.get(entry.exerciseId);
            const groupId = ex?.muscleGroupId;
            if (!groupId || seenInDay.has(groupId)) return;
            seenInDay.add(groupId);
            groupDays[groupId] = (groupDays[groupId] || 0) + 1;
        });
    });
    const weeklyMuscleGroups = topGroups(groupDays, groupLookup);

    return {
        period: safePeriod,
        periodStartDate: startKey,
        weekStartDate: weekStart,

        totalWorkouts: inPeriod.length,
        totalSets: periodAgg.totalSets,
        totalReps: periodAgg.totalReps,
        totalVolume: periodAgg.totalVolume,
        failureSets: periodAgg.failureSets,

        firstWorkout,
        lastWorkout,
        currentStreakDays: currentStreak(all),

        topExercises: topExercises(periodAgg.exerciseStats),
        topGroups: topGroups(periodAgg.groupCount, groupLookup),

        favoriteExercise: favoriteExercise(allAgg.exerciseStats),
        weeklyMuscleGroups,
    };
}

const NAME_MAX = 60;
const PHOTO_MAX = 2048;

interface ProfilePatch {
    name?: string;
    profilePhotoUrl?: string;
}

export async function updateProfile(
    userId: string,
    patch: ProfilePatch = {}
): Promise<PublicUser> {
    const allowed: ProfilePatch = {};
    if (patch.name !== undefined) {
        const name = String(patch.name).trim();
        if (!name) throw new HttpError(400, 'name cannot be empty');
        if (name.length > NAME_MAX) {
            throw new HttpError(400, `name must be at most ${NAME_MAX} chars`);
        }
        allowed.name = name;
    }
    if (patch.profilePhotoUrl !== undefined) {
        const url = String(patch.profilePhotoUrl || '').trim();
        if (url.length > PHOTO_MAX) {
            throw new HttpError(400, 'profilePhotoUrl is too long');
        }
        if (url && !/^(https?:|data:image\/)/i.test(url)) {
            throw new HttpError(
                400,
                'profilePhotoUrl must be an http(s) URL or a data:image URL'
            );
        }
        allowed.profilePhotoUrl = url;
    }
    const updated = await userRepo.update(userId, allowed);
    if (!updated) throw new HttpError(404, 'User not found');
    return userRepo.publicView(updated) as PublicUser;
}