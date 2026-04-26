/**
 * Date helpers. We store workout dates as `YYYY-MM-DD` strings (local
 * calendar day) so that "today" comparisons stay timezone-stable for a
 * single user.
 */
export declare function toDateKey(date: Date | string | number): string | null;
export declare function todayKey(): string;
export declare function isValidDateKey(value: unknown): value is string;
export declare function isToday(dateKey: string): boolean;
//# sourceMappingURL=dates.d.ts.map