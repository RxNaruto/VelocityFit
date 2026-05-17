import { fileURLToPath } from 'url';
import prisma from '../data/prisma.js';
import { muscleGroups, exercises } from '../data/seedData.js';

interface SeedOptions {
    /** When true, force re-upsert every row even if there's no change. */
    force?: boolean;
}

export async function seedCatalog(_opts: SeedOptions = {}): Promise<void> {
    for (const g of muscleGroups) {
        await prisma.muscleGroup.upsert({
            where: { id: g.id },
            update: { slug: g.slug, name: g.name },
            create: g,
        });
    }

    for (const e of exercises) {
        await prisma.exercise.upsert({
            where: { id: e.id },
            update: {
                name: e.name,
                muscleGroupId: e.muscleGroupId,
                tracksTime: e.tracksTime,
            },
            create: e,
        });
    }

    console.log(
        `[seed] catalog ready: ${muscleGroups.length} muscle groups, ${exercises.length} exercises`
    );
}

// ✅ ESM-safe equivalent of `require.main === module`
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
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