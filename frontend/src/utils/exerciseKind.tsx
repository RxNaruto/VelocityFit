import type { Exercise, MuscleGroup, WorkoutSet } from '../types';

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

/** Render a set as text — time-based: `mm:ss`, otherwise `reps × weight`. */
export function describeSet(set: WorkoutSet, timeBased: boolean): string {
    if (timeBased) return formatDuration(set.reps);
    const weight = set.weight;
    const hasWeight =
        weight !== null && weight !== undefined && (weight as unknown as string) !== '';
    return hasWeight ? `${set.reps} × ${weight}` : String(set.reps);
}