import * as muscleGroupRepo from '../models/muscleGroupRepository.js';
import * as exerciseRepo from '../models/exerciseRepository.js';
import HttpError from '../utils/HttpError.js';
import type { Exercise, MuscleGroup } from '@prisma/client';
import type {
    ExerciseInput,
    ExerciseUpdateInput,
    MuscleGroupInput,
} from '../types/domain.js';

const NAME_MAX = 80;
const SLUG_MAX = 40;

export function listMuscleGroups(): Promise<MuscleGroup[]> {
    return muscleGroupRepo.findAll();
}

export async function listExercises({
    muscleGroupId,
}: { muscleGroupId?: string } = {}): Promise<Exercise[]> {
    if (muscleGroupId) {
        const group = await muscleGroupRepo.findById(muscleGroupId);
        if (!group) {
            throw new HttpError(404, `Muscle group ${muscleGroupId} not found`);
        }
        return exerciseRepo.findByMuscleGroup(muscleGroupId);
    }
    return exerciseRepo.findAll();
}

// ─────────────────────────────────────────────────────────────────────
// Admin-style write ops used by the "Manage exercises" portal.
// Kept gated by `requireAuth` at the router level — same as the rest of
// the catalog. They are deliberately small & forgiving so the UI can
// post {name, muscleGroupId, tracksTime} without worrying about ids.
// ─────────────────────────────────────────────────────────────────────

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SLUG_MAX);
}

function makeExerciseId(name: string): string {
    const base = slugify(name).replace(/-/g, '_');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `ex_${base || 'exercise'}_${suffix}`;
}

function makeMuscleGroupId(slug: string): string {
    return `mg_${slug.replace(/-/g, '_')}`;
}

export async function createMuscleGroup(
    input: MuscleGroupInput
): Promise<MuscleGroup> {
    const name = String(input.name || '').trim();
    if (!name) throw new HttpError(400, 'name is required');
    if (name.length > NAME_MAX) {
        throw new HttpError(400, `name must be at most ${NAME_MAX} chars`);
    }

    const slug = slugify(input.slug || name);
    if (!slug) throw new HttpError(400, 'slug is required');

    const dup = await muscleGroupRepo.findBySlug(slug);
    if (dup) throw new HttpError(409, `Muscle group "${slug}" already exists`);

    return muscleGroupRepo.create({
        id: input.id || makeMuscleGroupId(slug),
        slug,
        name,
    });
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
    const name = String(input.name || '').trim();
    if (!name) throw new HttpError(400, 'name is required');
    if (name.length > NAME_MAX) {
        throw new HttpError(400, `name must be at most ${NAME_MAX} chars`);
    }

    const muscleGroupId = String(input.muscleGroupId || '').trim();
    if (!muscleGroupId) throw new HttpError(400, 'muscleGroupId is required');
    const group = await muscleGroupRepo.findById(muscleGroupId);
    if (!group) {
        throw new HttpError(404, `Muscle group ${muscleGroupId} not found`);
    }

    const dup = await exerciseRepo.findByNameWithinGroup(name, muscleGroupId);
    if (dup) {
        throw new HttpError(
            409,
            `An exercise named "${name}" already exists in ${group.name}`
        );
    }

    return exerciseRepo.create({
        id: input.id || makeExerciseId(name),
        name,
        muscleGroupId,
        tracksTime: Boolean(input.tracksTime),
    });
}

export async function updateExercise(
    id: string,
    patch: ExerciseUpdateInput
): Promise<Exercise> {
    const existing = await exerciseRepo.findById(id);
    if (!existing) throw new HttpError(404, `Exercise ${id} not found`);

    const data: ExerciseUpdateInput = {};

    if (patch.name !== undefined) {
        const name = String(patch.name).trim();
        if (!name) throw new HttpError(400, 'name cannot be empty');
        if (name.length > NAME_MAX) {
            throw new HttpError(400, `name must be at most ${NAME_MAX} chars`);
        }
        data.name = name;
    }

    if (patch.muscleGroupId !== undefined) {
        const group = await muscleGroupRepo.findById(patch.muscleGroupId);
        if (!group) {
            throw new HttpError(404, `Muscle group ${patch.muscleGroupId} not found`);
        }
        data.muscleGroupId = patch.muscleGroupId;
    }

    if (patch.tracksTime !== undefined) {
        data.tracksTime = Boolean(patch.tracksTime);
    }

    const updated = await exerciseRepo.update(id, data);
    if (!updated) throw new HttpError(500, 'Failed to update exercise');
    return updated;
}

export async function deleteExercise(id: string): Promise<void> {
    const existing = await exerciseRepo.findById(id);
    if (!existing) throw new HttpError(404, `Exercise ${id} not found`);
    if (await exerciseRepo.isInUse(id)) {
        throw new HttpError(
            409,
            'Exercise is referenced by one or more workouts and cannot be deleted'
        );
    }
    const ok = await exerciseRepo.remove(id);
    if (!ok) throw new HttpError(500, 'Failed to delete exercise');
}