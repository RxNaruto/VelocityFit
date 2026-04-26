import prisma from '../data/prisma.js';
import type { MuscleGroup } from '@prisma/client';

export function findAll(): Promise<MuscleGroup[]> {
    return prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } });
}

export function findById(id: string): Promise<MuscleGroup | null> {
    return prisma.muscleGroup.findUnique({ where: { id } });
}
