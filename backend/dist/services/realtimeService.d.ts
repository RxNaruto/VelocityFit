export declare const EVENTS: Readonly<{
    LEADERBOARD_UPDATED: "leaderboard.updated";
    USER_UPDATED: "user.updated";
}>;
export type RealtimeEvent = (typeof EVENTS)[keyof typeof EVENTS];
export declare function publish(event: RealtimeEvent, payload: unknown): void;
export declare function subscribe(event: RealtimeEvent, handler: (payload: unknown) => void): () => void;
//# sourceMappingURL=realtimeService.d.ts.map