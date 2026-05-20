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
    // Replace-all is O(N) in entries+sets+drops. With ~10 exercises the
    // delete-then-recreate round trip can exceed Prisma's 5s default
    // interactive-transaction timeout on hosted Postgres. Bump it to 20s
    // so an occasional full replace still completes; the AddWorkout flow
    // now prefers the incremental `appendEntry`/`removeEntry` helpers
    // below so this slow path is rarely hit.
    return prisma.$transaction(
        async (tx) => {
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
        },
        { timeout: 20000, maxWait: 5000 }
    );
}

export async function remove(id: string): Promise<boolean> {
    try {
        await prisma.workout.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────
// Incremental writes used by the AddWorkout per-entry auto-save flow.
//
// Why these exist: the original `update()` above is replace-all
// (delete every entry/set/drop, recreate from scratch). That was fine
// when the UI only saved once at the end of the wizard, but the
// per-entry auto-save calls it on every click, so each save scales
// linearly with the size of the workout. With ~10 exercises × a few
// sets each the work blows past Postgres' interactive transaction
// budget and we get
//   "Transaction already closed: ... query cannot be executed on an
//    expired transaction."
// These helpers do exactly one INSERT or one DELETE per call, so each
// click is O(1) work on the DB no matter how big the workout is.
// ─────────────────────────────────────────────────────────────────────

/**
 * Append one entry's worth of work to an existing workout.
 *
 * Behavior:
 *   - If a WorkoutEntry for the same exerciseId already exists on this
 *     workout, the new sets are appended to it (positions continue from
 *     the last existing set). The entry's notes are concatenated.
 *   - Otherwise a brand-new WorkoutEntry is created at the next position.
 *
 * This 1-entry-per-exercise invariant keeps the UI simple: a single
 * "remove" click deletes everything the user added for that exercise,
 * with no surprise leftovers.
 *
 * Returns the full refreshed workout DTO.
 */
export async function appendEntry(
    workoutId: string,
    entry: EntryInput
): Promise<WorkoutDTO | null> {
    const existingEntry = await prisma.workoutEntry.findFirst({
        where: { workoutId, exerciseId: entry.exerciseId },
        include: { sets: { orderBy: { position: 'asc' as const } } },
    });

    if (existingEntry) {
        const lastSetPos =
            existingEntry.sets.length > 0
                ? Math.max(...existingEntry.sets.map((s) => s.position))
                : -1;
        // Re-base the incoming sets' positions so they slot in after the
        // existing ones. normalizeSets numbers them 0..N-1, so we add
        // (lastSetPos + 1) to each.
        const newSets = normalizeSets(entry.sets).map((s, i) => ({
            ...s,
            position: lastSetPos + 1 + i,
        }));

        await prisma.workoutEntry.update({
            where: { id: existingEntry.id },
            data: {
                ...(entry.notes
                    ? {
                        notes: existingEntry.notes
                            ? `${existingEntry.notes}\n${entry.notes}`
                            : entry.notes,
                    }
                    : {}),
                sets: { create: newSets },
            },
        });
    } else {
        const lastPosition = await prisma.workoutEntry.aggregate({
            where: { workoutId },
            _max: { position: true },
        });
        const nextPos = (lastPosition._max.position ?? -1) + 1;

        await prisma.workoutEntry.create({
            data: {
                workout: { connect: { id: workoutId } },
                exercise: { connect: { id: entry.exerciseId } },
                notes: entry.notes || '',
                position: nextPos,
                sets: { create: normalizeSets(entry.sets) },
            },
        });
    }

    const refreshed = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: workoutInclude,
    });
    return refreshed ? toDTO(refreshed) : null;
}

/**
 * Remove a single WorkoutEntry by id (cascades to its sets + drops via
 * the schema relation). Returns the refreshed workout DTO. The workout
 * row itself is preserved even if all entries are deleted — the UI
 * decides whether to also delete the empty workout.
 */
export async function removeEntry(
    workoutId: string,
    entryId: string
): Promise<WorkoutDTO | null> {
    await prisma.workoutEntry
        .deleteMany({ where: { id: entryId, workoutId } });
    const refreshed = await prisma.workout.findUnique({
        where: { id: workoutId },
        include: workoutInclude,
    });
    return refreshed ? toDTO(refreshed) : null;
}

/**
 * Convenience: ensure a workout row exists for `(userId, dateKey)` and
 * return its id. Used by the append-entry flow so the first exercise of
 * the day can be added without an explicit "create workout" step.
 */
export async function ensureWorkout(
    userId: string,
    dateKey: string
): Promise<{ id: string; created: boolean }> {
    const existing = await prisma.workout.findUnique({
        where: { userId_date: { userId, date: dateKey } },
        select: { id: true },
    });
    if (existing) return { id: existing.id, created: false };
    const fresh = await prisma.workout.create({
        data: { userId, date: dateKey },
        select: { id: true },
    });
    return { id: fresh.id, created: true };
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

/**
 * Lightweight per-workout summary used by the points calculator.
 *
 * `findAllForUser` builds the full nested DTO (every entry, every set,
 * every drop, with relations) which is *expensive* — and we call the
 * points calculator on every workout mutation, so the AddWorkout
 * per-entry auto-save was paying that cost on every click.
 *
 * This query asks Postgres to do the aggregation for us in one shot,
 * returning just the five numbers the formula needs (date, # entries,
 * # sets, # failure sets, # drop segments). One round trip, one
 * GROUP BY, no nested object construction in Node.
 */
export interface WorkoutPointsSummary {
    date: string;
    exerciseCount: number;
    setCount: number;
    failureSetCount: number;
    dropSegmentCount: number;
}

export async function summariesForPointsForUser(
    userId: string
): Promise<WorkoutPointsSummary[]> {
    if (!userId) return [];

    // The raw row type comes back with `bigint`s for COUNT/SUM on Postgres,
    // so we coerce to plain numbers right after the query.
    interface Row {
        date: string;
        exerciseCount: bigint | number;
        setCount: bigint | number;
        failureSetCount: bigint | number;
        dropSegmentCount: bigint | number;
    }

    const rows = await prisma.$queryRaw<Row[]>`
        SELECT
            w."date"                                                            AS "date",
            COUNT(DISTINCT e."id")                                              AS "exerciseCount",
            COUNT(s."id")                                                       AS "setCount",
            COALESCE(SUM(CASE WHEN s."isFailure" THEN 1 ELSE 0 END), 0)::bigint AS "failureSetCount",
            COUNT(d."id")                                                       AS "dropSegmentCount"
        FROM "Workout"      w
        LEFT JOIN "WorkoutEntry" e ON e."workoutId" = w."id"
        LEFT JOIN "WorkoutSet"   s ON s."entryId"   = e."id"
        LEFT JOIN "SetDrop"      d ON d."setId"     = s."id"
        WHERE w."userId" = ${userId}
        GROUP BY w."id", w."date"
        ORDER BY w."date" ASC
    `;

    return rows.map((r) => ({
        date: r.date,
        exerciseCount: Number(r.exerciseCount),
        setCount: Number(r.setCount),
        failureSetCount: Number(r.failureSetCount),
        dropSegmentCount: Number(r.dropSegmentCount),
    }));
}