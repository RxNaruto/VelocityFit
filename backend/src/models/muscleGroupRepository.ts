import prisma from '../data/prisma.js';
import type { MuscleGroup } from '@prisma/client';

export function findAll(): Promise<MuscleGroup[]> {
    return prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } });
}

export function findById(id: string): Promise<MuscleGroup | null> {
    return prisma.muscleGroup.findUnique({ where: { id } });
}

export function findBySlug(slug: string): Promise<MuscleGroup | null> {
    return prisma.muscleGroup.findUnique({ where: { slug } });
}

export interface CreateMuscleGroupInput {
    id: string;
    slug: string;
    name: string;
}

export function create(data: CreateMuscleGroupInput): Promise<MuscleGroup> {
    return prisma.muscleGroup.create({ data });
}