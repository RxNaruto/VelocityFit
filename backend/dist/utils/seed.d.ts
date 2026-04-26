interface SeedOptions {
    force?: boolean;
}
/**
 * Seeds the catalog (muscle groups + exercises) if they are missing.
 * Existing workout logs are preserved. Uses `upsert` so re-running is safe.
 */
export declare function seedCatalog({ force }?: SeedOptions): Promise<void>;
export {};
//# sourceMappingURL=seed.d.ts.map