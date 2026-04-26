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
declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map