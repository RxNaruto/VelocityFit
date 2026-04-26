import { createApp } from './app.js';
import config from './config/index.js';
import { seedCatalog } from './utils/seed.js';
import * as pointsService from './services/pointsService.js';
import prisma from './data/prisma.js';
async function bootstrap() {
    await prisma.$connect();
    await seedCatalog();
    await pointsService.recomputeAll();
    const app = createApp();
    app.listen(config.port, () => {
        console.log(`[server] Gym Tracker API listening on http://localhost:${config.port} ` +
            `(env: ${config.nodeEnv}, db: prisma/postgres, cache: ${config.cache.driver})`);
    });
}
bootstrap().catch(async (err) => {
    console.error('[server] failed to start:', err);
    await prisma.$disconnect().catch(() => { });
    process.exit(1);
});
async function shutdown() {
    console.log('\n[server] shutting down…');
    await prisma.$disconnect().catch(() => { });
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
//# sourceMappingURL=server.js.map