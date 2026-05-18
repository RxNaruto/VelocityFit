import prisma from '../data/prisma.js';
import type { Exercise, Prisma } from '@prisma/client';

export function findAll(): Promise<Exercise[]> {
    return prisma.exercise.findMany({ orderBy: { name: 'asc' } });
}

export function findByMuscleGroup(muscleGroupId: string): Promise<Exercise[]> {
    return prisma.exercise.findMany({
        where: { muscleGroupId },
        orderBy: { name: 'asc' },
    });
}

export function findById(id: string): Promise<Exercise | null> {
    return prisma.exercise.findUnique({ where: { id } });
}

/** Case-insensitive lookup used to surface dup-name errors in the admin UI. */
export function findByNameWithinGroup(
    name: string,
    muscleGroupId: string
): Promise<Exercise | null> {
    return prisma.exercise.findFirst({
        where: {
            muscleGroupId,
            name: { equals: name, mode: 'insensitive' },
        },
    });
}

export interface CreateExerciseInput {
    id: string;
    name: string;
    muscleGroupId: string;
    tracksTime?: boolean;
}

export function create(data: CreateExerciseInput): Promise<Exercise> {
    return prisma.exercise.create({
        data: {
            id: data.id,
            name: data.name,
            muscleGroupId: data.muscleGroupId,
            tracksTime: Boolean(data.tracksTime),
        },
    });
}

export function update(
    id: string,
    patch: Prisma.ExerciseUpdateInput
): Promise<Exercise | null> {
    return prisma.exercise.update({ where: { id }, data: patch }).catch(() => null);
}

export async function remove(id: string): Promise<boolean> {
    try {
        await prisma.exercise.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

/** True when the exercise has been used in any workout entry. */
export async function isInUse(id: string): Promise<boolean> {
    const hit = await prisma.workoutEntry.findFirst({
        where: { exerciseId: id },
        select: { id: true },
    });
    return Boolean(hit);
}