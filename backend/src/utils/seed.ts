import prisma from '../data/prisma.js';
import { muscleGroups, exercises } from '../data/seedData.js';

interface SeedOptions {
    force?: boolean;
}

/**
 * Seeds the catalog (muscle groups + exercises) if they are missing.
 * Existing workout logs are preserved. Uses `upsert` so re-running is safe.
 */
export async function seedCatalog({ force = false }: SeedOptions = {}): Promise<void> {
    const existingGroups = await prisma.muscleGroup.count();
    const existingExercises = await prisma.exercise.count();

    if (force || existingGroups === 0) {
        for (const g of muscleGroups) {
            await prisma.muscleGroup.upsert({
                where: { id: g.id },
                update: { slug: g.slug, name: g.name },
                create: g,
            });
        }
        console.log(`[seed] muscleGroups: ${muscleGroups.length}`);
    }

    if (force || existingExercises === 0) {
        for (const e of exercises) {
            await prisma.exercise.upsert({
                where: { id: e.id },
                update: { name: e.name, muscleGroupId: e.muscleGroupId },
                create: e,
            });
        }
        console.log(`[seed] exercises: ${exercises.length}`);
    }
}

// Allow running this file directly with Node (ESM-safe replacement for require.main).
import { fileURLToPath } from 'node:url';
const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
    const force = process.argv.includes('--force');
    seedCatalog({ force })
        .then(async () => {
            console.log('[seed] done');
            await prisma.$disconnect();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error('[seed] failed:', err);
            await prisma.$disconnect();
            process.exit(1);
        });
}