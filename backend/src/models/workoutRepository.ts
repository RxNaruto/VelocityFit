import prisma from '../data/prisma.js';
import type { Prisma } from '@prisma/client';
import type {
    EntryDTO,
    EntryInput,
    SetDropInput,
    SetInput,
    WorkoutDTO,
} from '../types/domain.js';

const workoutInclude = {
    entries: {
        orderBy: { position: 'asc' as const },
        include: {
            sets: {
                orderBy: { position: 'asc' as const },
                include: { drops: { orderBy: { position: 'asc' as const } } },
            },
        },
    },
} satisfies Prisma.WorkoutInclude;

type WorkoutWithRelations = Prisma.WorkoutGetPayload<{ include: typeof workoutInclude }>;

function toDTO(w: WorkoutWithRelations): WorkoutDTO {
    return {
        id: w.id,
        userId: w.userId,
        date: w.date,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        entries: w.entries.map<EntryDTO>((e) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            notes: e.notes,
            sets: e.sets.map((s) => ({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                isFailure: s.isFailure,
                drops: s.drops.map((d) => ({
                    id: d.id,
                    reps: d.reps,
                    weight: d.weight,
                })),
            })),
        })),
    };
}

function normalizeDrops(
    drops: SetDropInput[] | undefined
): Prisma.SetDropCreateWithoutSetInput[] {
    return (drops || [])
        .map((d, i) => {
            const reps = Number(d.reps) || 0;
            const weight =
                d.weight === null || d.weight === undefined || d.weight === ''
                    ? null
                    : Number(d.weight);
            return { reps, weight, position: i };
        })
        .filter((d) => Number.isFinite(d.reps) && d.reps > 0);
}

function normalizeSets(
    sets: SetInput[] | undefined
): Prisma.WorkoutSetCreateWithoutEntryInput[] {
    return (sets || []).map((s, i) => {
        const reps = Number(s.reps) || 0;
        const weight =
            s.weight === null || s.weight === undefined || s.weight === ''
                ? null
                : Number(s.weight);
        const drops = normalizeDrops(s.drops);
        return {
            reps,
            weight,
            isFailure: Boolean(s.isFailure),
            position: i,
            ...(drops.length > 0 ? { drops: { create: drops } } : {}),
        };
    });
}

function normalizeEntries(
    entries: EntryInput[]
): Prisma.WorkoutEntryCreateWithoutWorkoutInput[] {
    return entries.map((entry, i) => ({
        // Fix 4: Prisma requires the relation form { connect } rather than
        // the bare scalar `exerciseId` when exactOptionalPropertyTypes /
        // strict Prisma types flag the scalar as insufficient.
        exercise: { connect: { id: entry.exerciseId } },
        notes: entry.notes || '',
        position: i,
        sets: { create: normalizeSets(entry.sets) },
    }));
}

export async function findAllForUser(userId: string): Promise<WorkoutDTO[]> {
    if (!userId) return [];
    const rows = await prisma.workout.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        include: workoutInclude,
    });
    return rows.map(toDTO);
}

export async function findByDateForUser(
    userId: string,
    dateKey: string
): Promise<WorkoutDTO | null> {
    if (!userId) return null;
    const row = await prisma.workout.findUnique({
        where: { userId_date: { userId, date: dateKey } },
        include: workoutInclude,
    });
    return row ? toDTO(row) : null;
}

export async function findByIdForUser(
    userId: string,
    id: string
): Promise<WorkoutDTO | null> {
    if (!userId) return null;
    const row = await prisma.workout.findFirst({
        where: { id, userId },
        include: workoutInclude,
    });
    return row ? toDTO(row) : null;
}

export async function findInRangeForUser(
    userId: string,
    startKey: string,
    endKey: string
): Promise<WorkoutDTO[]> {
    if (!userId) return [];
    const rows = await prisma.workout.findMany({
        where: {
            userId,
            date: { gte: startKey, lte: endKey },
        },
        orderBy: { date: 'desc' },
        include: workoutInclude,
    });
    return rows.map(toDTO);
}

export async function countForUser(userId: string): Promise<number> {
    if (!userId) return 0;
    return prisma.workout.count({ where: { userId } });
}

export interface CreateWorkoutInput {
    userId: string;
    date: string;
    entries: EntryInput[];
}

export async function create({
    userId,
    date,
    entries = [],
}: CreateWorkoutInput): Promise<WorkoutDTO> {
    const row = await prisma.workout.create({
        data: {
            userId,
            date,
            entries: { create: normalizeEntries(entries) },
        },
        include: workoutInclude,
    });
    return toDTO(row);
}

export interface UpdateWorkoutPatch {
    entries?: EntryInput[];
}

export async function update(
    id: string,
    patch: UpdateWorkoutPatch
): Promise<WorkoutDTO | null> {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.workout.findUnique({ where: { id } });
        if (!existing) return null;

        if (patch.entries) {
            await tx.workoutEntry.deleteMany({ where: { workoutId: id } });
        }
        const updated = await tx.workout.update({
            where: { id },
            data: {
                ...(patch.entries
                    ? { entries: { create: normalizeEntries(patch.entries) } }
                    : {}),
            },
            include: workoutInclude,
        });
        return toDTO(updated);
    });
}

export async function remove(id: string): Promise<boolean> {
    try {
        await prisma.workout.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

export async function statsForUser(userId: string): Promise<{
    totalWorkouts: number;
    totalSets: number;
}> {
    const totalWorkouts = await countForUser(userId);
    const totalSets = await prisma.workoutSet.count({
        where: { entry: { workout: { userId } } },
    });
    return { totalWorkouts, totalSets };
}