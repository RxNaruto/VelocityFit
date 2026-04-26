import * as workoutRepo from '../models/workoutRepository.js';
import * as exerciseRepo from '../models/exerciseRepository.js';
import * as pointsService from './pointsService.js';
import HttpError from '../utils/HttpError.js';
import { isValidDateKey, isToday, todayKey } from '../utils/dates.js';
async function validateEntries(entries) {
    if (!Array.isArray(entries)) {
        throw new HttpError(400, '`entries` must be an array');
    }
    // Pre-check exercise existence in a single query rather than N+1.
    const ids = Array.from(new Set(entries.map((e) => e?.exerciseId).filter(Boolean)));
    const found = await Promise.all(ids.map((id) => exerciseRepo.findById(id)));
    const foundSet = new Set(found.filter(Boolean).map((e) => e.id));
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
        });
    });
}
export async function listWorkouts(userId, { from, to } = {}) {
    if (from && to) {
        if (!isValidDateKey(from) || !isValidDateKey(to)) {
            throw new HttpError(400, 'from/to must be YYYY-MM-DD');
        }
        return workoutRepo.findInRangeForUser(userId, from, to);
    }
    return workoutRepo.findAllForUser(userId);
}
export async function getWorkoutByDate(userId, dateKey) {
    if (!isValidDateKey(dateKey)) {
        throw new HttpError(400, 'date must be YYYY-MM-DD');
    }
    return workoutRepo.findByDateForUser(userId, dateKey);
}
export async function saveTodayWorkout(userId, { entries }) {
    await validateEntries(entries);
    const date = todayKey();
    const existing = await workoutRepo.findByDateForUser(userId, date);
    const saved = existing
        ? await workoutRepo.update(existing.id, { entries: entries })
        : await workoutRepo.create({ userId, date, entries: entries });
    await pointsService.onWorkoutChanged(userId);
    return saved;
}
export async function updateWorkout(userId, id, { entries }) {
    const existing = await workoutRepo.findByIdForUser(userId, id);
    if (!existing) {
        throw new HttpError(404, `Workout ${id} not found`);
    }
    if (!isToday(existing.date)) {
        throw new HttpError(403, "You can only edit today's workout. Past workouts are read-only.");
    }
    await validateEntries(entries);
    const updated = await workoutRepo.update(id, { entries: entries });
    await pointsService.onWorkoutChanged(userId);
    return updated;
}
export async function deleteWorkout(userId, id) {
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
//# sourceMappingURL=workoutService.js.map