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

interface AppConfig {
    port: number;
    nodeEnv: string;
    db: {
        url: string;
    };
    cache: {
        driver: "memory" | "redis";
        url: string;
    };
    leaderboard: {
        snapshotSize: number;
    };
}

const config: AppConfig = {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",

    db: {
        url: process.env.DATABASE_URL || "",
    },

    cache: {
        driver:
            (process.env.CACHE_DRIVER as "memory" | "redis") ||
            "memory",
        url: process.env.REDIS_URL || "",
    },

    leaderboard: {
        snapshotSize: parseInt(
            process.env.LEADERBOARD_SNAPSHOT_SIZE || "50",
            10
        ),
    },
};

export default config;