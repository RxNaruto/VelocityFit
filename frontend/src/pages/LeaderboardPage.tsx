import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { openLeaderboardStream } from '../services/realtime';
import { useAuth } from '../context/AuthContext';
import Avatar from '../component/Avatar';
import type { LeaderboardRow } from '../types';

export default function LeaderboardPage() {
    const { user, token } = useAuth();
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [connected, setConnected] = useState(false);
    const [flashedIds, setFlashedIds] = useState<Set<string>>(new Set());
    const prevByUserId = useRef<Map<string, number>>(new Map());

    // Bootstrap: fetch initial leaderboard over REST, then subscribe to SSE.
    useEffect(() => {
        let cancelled = false;
        api
            .getLeaderboard(50)
            .then((res) => {
                if (cancelled) return;
                setRows(res.top);
                prevByUserId.current = new Map(res.top.map((r) => [r.userId, r.points]));
            })
            .catch((err: Error) => {
                if (!cancelled) toast.error(err.message || 'Failed to load leaderboard');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!token) return undefined;
        const stream = openLeaderboardStream({
            token,
            onError: () => setConnected(false),
        });

        const offLB = stream.on('leaderboard:updated', (top) => {
            setConnected(true);
            // Flash rows whose score changed vs the last snapshot.
            const flashed = new Set<string>();
            top.forEach((r) => {
                const prev = prevByUserId.current.get(r.userId);
                if (prev === undefined || prev !== r.points) flashed.add(r.userId);
            });
            prevByUserId.current = new Map(top.map((r) => [r.userId, r.points]));
            setRows(top);
            if (flashed.size) {
                setFlashedIds(flashed);
                setTimeout(() => setFlashedIds(new Set()), 1200);
            }
        });

        return () => {
            offLB();
            stream.close();
        };
    }, [token]);

    const myRow = rows.find((r) => r.userId === user?.id);

    return (
        <div className="page">
            <div className="leaderboard-header">
                <div>
                    <h1>Leaderboard</h1>
                    <p className="muted">
                        Earn points every time you log a workout. Rankings update in real-time.
                    </p>
                </div>
                <span className={`live-dot ${connected ? 'is-live' : ''}`}>
                    <span className="live-pulse" />
                    {connected ? 'Live' : 'Connecting…'}
                </span>
            </div>

            {myRow && (
                <div className="my-rank-card">
                    <span className="muted small">Your position</span>
                    <div className="my-rank-body">
                        <span className="rank-badge rank-mine">#{myRow.rank}</span>
                        <Avatar user={myRow} size={36} />
                        <div>
                            <div className="recent-date">{myRow.name}</div>
                            <div className="muted small">@{myRow.username}</div>
                        </div>
                        <span className="points-pill">{myRow.points} pts</span>
                    </div>
                </div>
            )}

            <section className="card">
                {rows.length === 0 ? (
                    <p className="muted">Loading…</p>
                ) : (
                    <ol className="leaderboard-list">
                        {rows.map((r) => (
                            <li
                                key={r.userId}
                                className={[
                                    'leaderboard-row',
                                    r.userId === user?.id ? 'is-me' : '',
                                    flashedIds.has(r.userId) ? 'is-flashing' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                <Link to={`/u/${r.username}`} className="leaderboard-link">
                                    <span className={`rank-badge rank-${Math.min(r.rank, 4)}`}>
                                        #{r.rank}
                                    </span>
                                    <Avatar user={r} size={36} />
                                    <div className="leaderboard-ident">
                                        <div className="recent-date">
                                            {r.name}
                                            {r.userId === user?.id && <span className="you-badge">you</span>}
                                        </div>
                                        <div className="muted small">@{r.username}</div>
                                    </div>
                                    <span className="points-pill">{r.points} pts</span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
