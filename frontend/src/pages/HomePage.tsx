import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../component/Calendar';
import Avatar from '../component/Avatar';
import Spinner from '../component/Spinner';
import BrandMark from '../component/BrandMark';
import { useWorkouts } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { todayKey } from '../utils/dates';
import type { LeaderboardRow, RankInfo } from '../types';

export default function HomePage() {
  const { workoutsByDate } = useWorkouts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = todayKey();
  const todayWorkout = workoutsByDate[today];
  const joinedDateKey = user?.createdAt?.slice(0, 10) || null;

  const [rank, setRank] = useState<RankInfo | null>(null);
  const [topRows, setTopRows] = useState<LeaderboardRow[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getMyRank(), api.getLeaderboard(5)])
      .then(([r, lb]) => {
        if (cancelled) return;
        setRank(r);
        setTopRows(lb.top);
      })
      .catch(() => {
        /* surfaced elsewhere via toasts */
      })
      .finally(() => {
        if (!cancelled) setBoardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page page-home">
      <div className="dashboard-grid">
        {/* ── Row 1 ── */}
        <section className="card brand-card">
          <div className="brand-card-head">
            <BrandMark size="lg" />
            <div>
              <h1 className="brand-card-title">VELOCITY FIT</h1>
              <p className="brand-card-tagline">TRAIN HARD. STAY CONSISTENT.</p>
            </div>
          </div>
          <p className="muted brand-card-status">
            {todayWorkout
              ? `You've logged ${todayWorkout.entries.length} exercise${todayWorkout.entries.length === 1 ? '' : 's'
              } today. Keep going!`
              : "You haven't logged today's workout yet."}
          </p>
          <Link to="/add" className="btn btn-primary btn-lg brand-card-cta">
            + {todayWorkout ? "Edit today's workout" : "Log today's workout"}
          </Link>
        </section>

        <section className="card profile-card">
          {user && (
            <>
              <div className="profile-card-head">
                <Avatar user={user} size={64} />
                <div>
                  <h2 className="profile-card-name">{user.name}</h2>
                  <div className="muted small">@{user.username}</div>
                </div>
              </div>
              <div className="profile-card-stats">
                <div className="profile-card-stat">
                  <div className="profile-card-stat-value">
                    #{rank?.rank ?? '—'}
                  </div>
                  <div className="profile-card-stat-label">
                    Rank{rank?.totalUsers ? ` / ${rank.totalUsers}` : ''}
                  </div>
                </div>
                <div className="profile-card-stat">
                  <div className="profile-card-stat-value">{rank?.points ?? user.points}</div>
                  <div className="profile-card-stat-label">Points</div>
                </div>
              </div>
              <Link to="/profile" className="btn btn-ghost btn-sm profile-card-link">
                View full profile →
              </Link>
            </>
          )}
        </section>

        {/* ── Row 2 ── */}
        <section className="card calendar-card">
          <Calendar
            workoutsByDate={workoutsByDate}
            onSelectDate={(key) => navigate(`/day/${key}`)}
            joinedDateKey={joinedDateKey}
          />
          <div className="legend">
            <span>
              <i className="legend-dot" /> Logged
            </span>
            <span>
              <i className="legend-dot legend-dot-missed" /> Missed
            </span>
            <span>
              <i className="legend-today" /> Today
            </span>
          </div>
        </section>

        <section className="card leaderboard-card">
          <div className="leaderboard-card-head">
            <h2>Leaderboard</h2>
            <Link to="/leaderboard" className="btn btn-ghost btn-sm">
              View all →
            </Link>
          </div>
          {boardLoading ? (
            <Spinner size={24} label="Loading…" />
          ) : topRows.length === 0 ? (
            <p className="muted">No rankings yet — log a workout to get on the board!</p>
          ) : (
            <ol className="leaderboard-list compact">
              {topRows.map((r) => (
                <li
                  key={r.userId}
                  className={[
                    'leaderboard-row',
                    r.userId === user?.id ? 'is-me' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Link to={`/u/${r.username}`} className="leaderboard-link compact">
                    <span className={`rank-badge rank-${Math.min(r.rank, 4)}`}>
                      #{r.rank}
                    </span>
                    <Avatar user={r} size={28} />
                    <div className="leaderboard-ident">
                      <div className="recent-date">
                        {r.name}
                        {r.userId === user?.id && (
                          <span className="you-badge">you</span>
                        )}
                      </div>
                    </div>
                    <span className="points-pill">{r.points} pts</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}