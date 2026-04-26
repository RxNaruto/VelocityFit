import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
// Load env vars from the conventional backend/.env if present.
// Fallback to backend/src/.env (current repo layout) so existing setups keep working.
const cwd = process.cwd();
const candidatePaths = [
    path.join(cwd, ".env"),
    path.join(cwd, "src", ".env"),
];
for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        break;
    }
}
const config = {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    db: {
        url: process.env.DATABASE_URL || "",
    },
    cache: {
        driver: process.env.CACHE_DRIVER ||
            "memory",
        url: process.env.REDIS_URL || "",
    },
    leaderboard: {
        snapshotSize: parseInt(process.env.LEADERBOARD_SNAPSHOT_SIZE || "50", 10),
    },
};
export default config;
//# sourceMappingURL=index.js.map