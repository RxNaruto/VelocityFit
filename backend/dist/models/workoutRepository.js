import prisma from '../data/prisma.js';
const workoutInclude = {
    entries: {
        orderBy: { position: 'asc' },
        include: {
            sets: { orderBy: { position: 'asc' } },
        },
    },
};
function toDTO(w) {
    return {
        id: w.id,
        userId: w.userId,
        date: w.date,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        entries: w.entries.map((e) => ({
            id: e.id,
            exerciseId: e.exerciseId,
            notes: e.notes,
            sets: e.sets.map((s) => ({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                isFailure: s.isFailure,
            })),
        })),
    };
}
function normalizeSets(sets) {
    return (sets || []).map((s, i) => {
        const reps = Number(s.reps) || 0;
        const weight = s.weight === null || s.weight === undefined || s.weight === ''
            ? null
            : Number(s.weight);
        return {
            reps,
            weight,
            isFailure: Boolean(s.isFailure),
            position: i,
        };
    });
}
function normalizeEntries(entries) {
    return entries.map((entry, i) => ({
        exerciseId: entry.exerciseId,
        notes: entry.notes || '',
        position: i,
        sets: { create: normalizeSets(entry.sets) },
    }));
}
export async function findAllForUser(userId) {
    if (!userId)
        return [];
    const rows = await prisma.workout.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        include: workoutInclude,
    });
    return rows.map(toDTO);
}
export async function findByDateForUser(userId, dateKey) {
    if (!userId)
        return null;
    const row = await prisma.workout.findUnique({
        where: { userId_date: { userId, date: dateKey } },
        include: workoutInclude,
    });
    return row ? toDTO(row) : null;
}
export async function findByIdForUser(userId, id) {
    if (!userId)
        return null;
    const row = await prisma.workout.findFirst({
        where: { id, userId },
        include: workoutInclude,
    });
    return row ? toDTO(row) : null;
}
export async function findInRangeForUser(userId, startKey, endKey) {
    if (!userId)
        return [];
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
export async function countForUser(userId) {
    if (!userId)
        return 0;
    return prisma.workout.count({ where: { userId } });
}
export async function create({ userId, date, entries = [], }) {
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
export async function update(id, patch) {
    // Replace-all semantics for entries (mirrors the original file-DB behavior).
    // Deleting entries cascades to their sets via the schema relation.
    return prisma.$transaction(async (tx) => {
        const existing = await tx.workout.findUnique({ where: { id } });
        if (!existing)
            return null;
        if (patch.entries) {
            await tx.workoutEntry.deleteMany({ where: { WorkoutId: id } });
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
export async function remove(id) {
    try {
        await prisma.workout.delete({ where: { id } });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Returns lightweight stats used by the public profile page.
 * (Detailed stats live in profileService.)--
 */
export async function statsForUser(userId) {
    const totalWorkouts = await countForUser(userId);
    const totalSets = await prisma.workoutSet.count({
        where: { entry: { workout: { userId } } },
    });
    return { totalWorkouts, totalSets };
}
//# sourceMappingURL=workoutRepository.js.map