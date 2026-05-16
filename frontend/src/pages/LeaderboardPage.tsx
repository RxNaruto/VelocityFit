import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../component/Avatar';
import type { LeaderboardRow } from '../types';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.getLeaderboard(50);
      setRows(res.top);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const myRow = rows.find((r) => r.userId === user?.id);

  return (
    <div className="page">
      <div className="leaderboard-header">
        <div>
          <h1>Leaderboard</h1>
          <p className="muted">
            Earn points every time you log a workout. Tap refresh to pull the latest standings.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => load(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
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
        {loading ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted">No rankings yet — log a workout to get on the board!</p>
        ) : (
          <ol className="leaderboard-list">
            {rows.map((r) => (
              <li
                key={r.userId}
                className={[
                  'leaderboard-row',
                  r.userId === user?.id ? 'is-me' : '',
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