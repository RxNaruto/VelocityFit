import type { Exercise, MuscleGroup, Workout, WorkoutEntry, WorkoutSet } from '../types';

/** Slug of the Cardio muscle group. Kept only for purely cosmetic decisions
 *  (e.g. the blue cardio set-pill tint). Logic that decides whether an
 *  exercise is time-based must use `isTimeBased*` instead. */
export const CARDIO_SLUG = 'cardio';

/**
 * Source of truth: per-exercise. When `tracksTime` is true we render the
 * Min / Sec inputs and persist `reps = totalSeconds`, `weight = null`.
 * This covers all cardio plus isometrics like Plank, Dead Hang,
 * Farmer's Walk/Carry, Wall Sit, etc.
 *
 * Fallback: when the API/cache returns an older Exercise without the flag
 * (e.g. a cached response from before the schema migration), we still
 * recognise the canonical cardio muscle group as time-based so the UI
 * stays consistent.
 */
export function isTimeBasedExercise(
    exercise: Exercise | undefined | null,
    muscleGroupLookup: Record<string, MuscleGroup>
): boolean {
    if (!exercise) return false;
    if (exercise.tracksTime === true) return true;
    const g = muscleGroupLookup[exercise.muscleGroupId];
    return !!g && g.slug === CARDIO_SLUG;
}

/** True when the (already-resolved) entry has a time-based exercise. */
export function isTimeBasedEntry(
    exerciseId: string,
    exerciseLookup: Record<string, Exercise>,
    muscleGroupLookup: Record<string, MuscleGroup>
): boolean {
    return isTimeBasedExercise(exerciseLookup[exerciseId], muscleGroupLookup);
}

/** Cosmetic-only check (the cardio blue tint). Don't use for behaviour. */
export function isCardioGroup(group: { slug?: string } | null | undefined): boolean {
    return !!group && group.slug === CARDIO_SLUG;
}

/** Convert minutes + seconds (string or number) into a seconds total. */
export function toSeconds(minutes: number | string, seconds: number | string): number {
    const m = Number(minutes) || 0;
    const s = Number(seconds) || 0;
    return Math.max(0, Math.floor(m * 60 + s));
}

/** Split a seconds total back into { minutes, seconds }. */
export function fromSeconds(total: number): { minutes: number; seconds: number } {
    const safe = Math.max(0, Math.floor(Number(total) || 0));
    return { minutes: Math.floor(safe / 60), seconds: safe % 60 };
}

/** Pretty `mm:ss` (or `h:mm:ss` if hour+) for read-only displays. */
export function formatDuration(total: number): string {
    const safe = Math.max(0, Math.floor(Number(total) || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Render a set as text -- time-based: `mm:ss`, otherwise `reps x weight`. */
export function describeSet(set: WorkoutSet, timeBased: boolean): string {
    if (timeBased) return formatDuration(set.reps);
    const weight = set.weight;
    const hasWeight =
        weight !== null && weight !== undefined && (weight as unknown as string) !== '';
    return hasWeight ? `${set.reps} x ${weight}` : String(set.reps);
}

/**
 * Look up the most recent past workout (strictly before `todayKey`) that
 * contained a non-empty entry for `exerciseId`, so we can pre-fill the
 * set logger and show a "Last session" reference.
 *
 * The scan is a tiny linear walk of the in-memory `workoutsByDate` map --
 * cheap even for years of history.
 */
export function findLastSessionFor(
    workoutsByDate: Record<string, Workout>,
    exerciseId: string,
    todayKey: string
): { date: string; entry: WorkoutEntry } | null {
    if (!exerciseId) return null;
    const dates = Object.keys(workoutsByDate)
        .filter((d) => d < todayKey)
        .sort()
        .reverse();
    for (const d of dates) {
        const w = workoutsByDate[d];
        if (!w || !Array.isArray(w.entries)) continue;
        const entry = w.entries.find(
            (e) => e.exerciseId === exerciseId && Array.isArray(e.sets) && e.sets.length > 0
        );
        if (entry) return { date: d, entry };
    }
    return null;
}

/**
 * Personal record for a single exercise, scanned across the user's whole
 * workout history (today included, so the panel updates the moment a new
 * PR is logged).
 *
 * Strength PR  -> the single set with the highest `weight`. We also surface
 *                the reps performed at that weight so the lifter sees the
 *                full record (e.g. "100 kg x 5 reps" beats "100 kg x 1").
 *                Drop-set segments don't count -- drops happen *after*
 *                failure on a lighter weight, so they're never the PR.
 *
 * Time PR     -> the longest single set duration (in seconds).
 *
 * Returns `null` when no qualifying set exists, e.g. brand-new exercise
 * or only bodyweight (`weight === null`) sets logged so far.
 */
export interface PRRecord {
    /** Workout date (yyyy-mm-dd) where the PR set was logged. */
    date: string;
    /** Reps at the PR weight (strength) or the duration in seconds (time). */
    reps: number;
    /** Heaviest weight (strength). Null for time-based exercises. */
    weight: number | null;
    /** True for cardio + isometric exercises (PR = longest duration). */
    timeBased: boolean;
}

export function findAllTimePRFor(
    workoutsByDate: Record<string, Workout>,
    exerciseId: string,
    timeBased: boolean
): PRRecord | null {
    if (!exerciseId) return null;
    let best: PRRecord | null = null;
    for (const d of Object.keys(workoutsByDate)) {
        const w = workoutsByDate[d];
        if (!w || !Array.isArray(w.entries)) continue;
        for (const entry of w.entries) {
            if (entry.exerciseId !== exerciseId) continue;
            for (const s of entry.sets || []) {
                if (timeBased) {
                    const seconds = Number(s.reps) || 0;
                    if (seconds <= 0) continue;
                    if (!best || seconds > best.reps) {
                        best = { date: d, reps: seconds, weight: null, timeBased: true };
                    }
                    continue;
                }
                const weight =
                    s.weight === null || s.weight === undefined ? null : Number(s.weight);
                if (weight === null || !Number.isFinite(weight) || weight <= 0) continue;
                const reps = Number(s.reps) || 0;
                // Strength PR: heaviest weight wins outright. Tie-break by
                // higher reps at the same weight (more impressive lift).
                if (
                    !best ||
                    (best.weight ?? 0) < weight ||
                    ((best.weight ?? 0) === weight && reps > best.reps)
                ) {
                    best = { date: d, reps, weight, timeBased: false };
                }
            }
        }
    }
    return best;
}