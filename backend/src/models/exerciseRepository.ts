import prisma from '../data/prisma.js';
import type { Exercise } from '@prisma/client';

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