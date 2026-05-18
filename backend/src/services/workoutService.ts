import * as workoutRepo from '../models/workoutRepository.js';
import * as exerciseRepo from '../models/exerciseRepository.js';
import * as pointsService from './pointsService.js';
import HttpError from '../utils/HttpError.js';
import { isValidDateKey, isToday, todayKey } from '../utils/dates.js';
import type { EntryInput, WorkoutDTO } from '../types/domain.js';

interface ListParams {
    from?: string;
    to?: string;
}

interface SavePayload {
    entries?: EntryInput[];
}

async function validateEntries(entries: EntryInput[] | undefined): Promise<void> {
    if (!Array.isArray(entries)) {
        throw new HttpError(400, '`entries` must be an array');
    }
    // Pre-check exercise existence in a single query rather than N+1.
    const ids = Array.from(new Set(entries.map((e) => e?.exerciseId).filter(Boolean)));
    const found = await Promise.all(ids.map((id) => exerciseRepo.findById(id)));
    const foundSet = new Set(found.filter(Boolean).map((e) => e!.id));

    entries.forEach((entry, i) => {
        if (!entry || typeof entry !== 'object') {
            throw new HttpError(400, `entries[${i}] must be an object`);
        }
        if (!entry.exerciseId || !foundSet.has(entry.exerciseId)) {
            throw new HttpError(400, `entries[${i}].exerciseId is invalid`);
        }
        if (!Array.isArray(entry.sets) || entry.sets.length === 0) {
            throw new HttpError(400, `entries[${i}].sets must be a non-empty array`);
        }
        entry.sets.forEach((s, j) => {
            if (s == null || typeof s !== 'object') {
                throw new HttpError(400, `entries[${i}].sets[${j}] must be an object`);
            }
            const reps = Number(s.reps);
            if (!Number.isFinite(reps) || reps < 0) {
                throw new HttpError(400, `entries[${i}].sets[${j}].reps must be >= 0`);
            }
            if (s.weight !== null && s.weight !== undefined && s.weight !== '') {
                const w = Number(s.weight);
                if (!Number.isFinite(w) || w < 0) {
                    throw new HttpError(400, `entries[${i}].sets[${j}].weight must be >= 0`);
                }
            }
            // Optional drop-set segments. Each one is validated like a mini-set
            // (reps & optional weight). Empty rows get filtered downstream — we
            // only fail on actively-invalid numbers.
            if (s.drops !== undefined && s.drops !== null) {
                if (!Array.isArray(s.drops)) {
                    throw new HttpError(400, `entries[${i}].sets[${j}].drops must be an array`);
                }
                s.drops.forEach((d, k) => {
                    if (d == null || typeof d !== 'object') {
                        throw new HttpError(
                            400,
                            `entries[${i}].sets[${j}].drops[${k}] must be an object`
                        );
                    }
                    const dReps = Number(d.reps);
                    if (!Number.isFinite(dReps) || dReps < 0) {
                        throw new HttpError(
                            400,
                            `entries[${i}].sets[${j}].drops[${k}].reps must be >= 0`
                        );
                    }
                    if (d.weight !== null && d.weight !== undefined && d.weight !== '') {
                        const dw = Number(d.weight);
                        if (!Number.isFinite(dw) || dw < 0) {
                            throw new HttpError(
                                400,
                                `entries[${i}].sets[${j}].drops[${k}].weight must be >= 0`
                            );
                        }
                    }
                });
            }
        });
    });
}

export async function listWorkouts(
    userId: string,
    { from, to }: ListParams = {}
): Promise<WorkoutDTO[]> {
    if (from && to) {
        if (!isValidDateKey(from) || !isValidDateKey(to)) {
            throw new HttpError(400, 'from/to must be YYYY-MM-DD');
        }
        return workoutRepo.findInRangeForUser(userId, from, to);
    }
    return workoutRepo.findAllForUser(userId);
}

export async function getWorkoutByDate(
    userId: string,
    dateKey: string
): Promise<WorkoutDTO | null> {
    if (!isValidDateKey(dateKey)) {
        throw new HttpError(400, 'date must be YYYY-MM-DD');
    }
    return workoutRepo.findByDateForUser(userId, dateKey);
}

export async function saveTodayWorkout(
    userId: string,
    { entries }: SavePayload
): Promise<WorkoutDTO> {
    await validateEntries(entries);
    const date = todayKey();
    const existing = await workoutRepo.findByDateForUser(userId, date);
    const saved = existing
        ? await workoutRepo.update(existing.id, { entries: entries as EntryInput[] })
        : await workoutRepo.create({ userId, date, entries: entries as EntryInput[] });
    await pointsService.onWorkoutChanged(userId);
    return saved as WorkoutDTO;
}

export async function updateWorkout(
    userId: string,
    id: string,
    { entries }: SavePayload
): Promise<WorkoutDTO> {
    const existing = await workoutRepo.findByIdForUser(userId, id);
    if (!existing) {
        throw new HttpError(404, `Workout ${id} not found`);
    }
    if (!isToday(existing.date)) {
        throw new HttpError(403, "You can only edit today's workout. Past workouts are read-only.");
    }
    await validateEntries(entries);
    const updated = await workoutRepo.update(id, { entries: entries as EntryInput[] });
    await pointsService.onWorkoutChanged(userId);
    return updated as WorkoutDTO;
}

export async function deleteWorkout(userId: string, id: string): Promise<boolean> {
    const existing = await workoutRepo.findByIdForUser(userId, id);
    if (!existing) {
        throw new HttpError(404, `Workout ${id} not found`);
    }
    if (!isToday(existing.date)) {
        throw new HttpError(403, "Only today's workout can be deleted");
    }
    const ok = await workoutRepo.remove(id);
    await pointsService.onWorkoutChanged(userId);
    return ok;
}