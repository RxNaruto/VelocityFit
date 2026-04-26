
import type { LeaderboardRow, UserUpdatedEvent } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export type LeaderboardEventName = 'leaderboard:updated' | 'user:updated';

export interface LeaderboardEventPayloads {
    'leaderboard:updated': LeaderboardRow[];
    'user:updated': UserUpdatedEvent;
}

export interface LeaderboardStream {
    on<E extends LeaderboardEventName>(
        event: E,
        fn: (data: LeaderboardEventPayloads[E]) => void
    ): () => void;
    close(): void;
}

interface OpenStreamOptions {
    token: string;
    onEvent?: (event: LeaderboardEventName, data: unknown) => void;
    onError?: (err: Event) => void;
}

/**
 * Tiny wrapper around EventSource that:
 *   - appends the auth token as a query param (EventSource can't set headers)
 *   - reconnects automatically if the connection drops
 *   - exposes a simple `on(event, handler)` surface
 */
export function openLeaderboardStream({
    token,
    onEvent,
    onError,
}: OpenStreamOptions): LeaderboardStream {
    if (!token) throw new Error('openLeaderboardStream: token is required');

    let es: EventSource | null = null;
    let closed = false;
    const handlers = new Map<LeaderboardEventName, Set<(data: unknown) => void>>();

    function attach(event: LeaderboardEventName): void {
        if (!es) return;
        es.addEventListener(event, (e: MessageEvent) => {
            try {
                const data = JSON.parse(e.data);
                const set = handlers.get(event);
                if (set) set.forEach((fn) => fn(data));
                if (onEvent) onEvent(event, data);
            } catch (err) {
                console.error('[realtime] bad payload for', event, err);
            }
        });
    }

    function connect(): void {
        const url = `${BASE_URL}/realtime/stream?token=${encodeURIComponent(token)}`;
        es = new EventSource(url);
        attach('leaderboard:updated');
        attach('user:updated');
        es.onerror = (err) => {
            if (onError) onError(err);
            if (closed && es) {
                es.close();
            }
        };
    }

    connect();

    return {
        on<E extends LeaderboardEventName>(
            event: E,
            fn: (data: LeaderboardEventPayloads[E]) => void
        ): () => void {
            let set = handlers.get(event);
            if (!set) {
                set = new Set();
                handlers.set(event, set);
            }
            const wrapped = fn as (data: unknown) => void;
            set.add(wrapped);
            return () => handlers.get(event)?.delete(wrapped);
        },
        close() {
            closed = true;
            if (es) es.close();
            handlers.clear();
        },
    };
}