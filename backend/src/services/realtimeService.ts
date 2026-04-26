import { EventEmitter } from "events";

/**
 * In-process pub/sub used by the SSE controller.
 * Can be replaced with Redis pub/sub later.
 */
const bus = new EventEmitter();
bus.setMaxListeners(0);

export const EVENTS = Object.freeze({
    LEADERBOARD_UPDATED: "leaderboard.updated",
    USER_UPDATED: "user.updated",
});

export type RealtimeEvent =
    (typeof EVENTS)[keyof typeof EVENTS];

export function publish(
    event: RealtimeEvent,
    payload: unknown
): void {
    bus.emit(event, payload);
}

export function subscribe(
    event: RealtimeEvent,
    handler: (payload: unknown) => void
): () => void {
    bus.on(event, handler);

    return () => {
        bus.off(event, handler);
    };
}