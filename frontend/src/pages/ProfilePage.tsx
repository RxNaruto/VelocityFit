
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Avatar from '../component/Avatar';
import { formatPretty } from '../utils/dates';
import type { ProfileStats, RankInfo } from '../types';

const PERIODS = [
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'all', label: 'All time' },
] as const;

type Period = (typeof PERIODS)[number]['id'];

interface ProfileForm {
    name: string;
    profilePhotoUrl: string;
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [period, setPeriod] = useState<Period>('week');
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [rank, setRank] = useState<RankInfo | null>(null);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProfileForm>({
        name: user?.name || '',
        profilePhotoUrl: user?.profilePhotoUrl || '',
    });
    const [saving, setSaving] = useState(false);

    // Rank/points are independent of the selected period, so fetch once.
    useEffect(() => {
        let cancelled = false;
        api
            .getMyRank()
            .then((r) => !cancelled && setRank(r))
            .catch(() => {
                /* silent — handled elsewhere */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Re-fetch stats whenever the period changes.
    useEffect(() => {
        let cancelled = false;
        setStatsLoading(true);
        api
            .getStats(period)
            .then((s) => {
                if (cancelled) return;
                setStats(s);
                setStatsLoading(false);
            })
            .catch((e: Error) => {
                if (cancelled) return;
                toast.error(e.message || 'Failed to load stats');
                setStatsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [period]);

    function startEdit() {
        setForm({
            name: user?.name || '',
            profilePhotoUrl: user?.profilePhotoUrl || '',
        });
        setEditing(true);
    }

    async function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await api.updateProfile({
                name: form.name,
                profilePhotoUrl: form.profilePhotoUrl,
            });
            updateUser(updated);
            toast.success('Profile updated');
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    }

    if (!user) return null;

    const periodLabel = PERIODS.find((p) => p.id === period)?.label || 'All time';

    return (
        <div className="page">
            <div className="page-toolbar">
                <Link to="/" className="btn btn-ghost">
                    ← Back
                </Link>
                {!editing && (
                    <button type="button" className="btn btn-primary" onClick={startEdit}>
                        Edit profile
                    </button>
                )}
            </div>

            <section className="card profile-header">
                <Avatar user={user} size={88} />
                <div className="profile-identity">
                    <h1>{user.name}</h1>
                    <div className="muted">@{user.username}</div>
                    <div className="muted small">
                        Joined {formatPretty(user.createdAt?.slice(0, 10))}
                    </div>
                </div>
                {rank && (
                    <div className="profile-rank-pill">
                        <div className="profile-rank-label">Rank</div>
                        <div className="profile-rank-value">
                            #{rank.rank ?? '—'}
                            <span className="muted small"> / {rank.totalUsers}</span>
                        </div>
                        <div className="profile-points">{rank.points} pts</div>
                        <Link to="/leaderboard" className="btn btn-ghost btn-sm">
                            View leaderboard →
                        </Link>
                    </div>
                )}
            </section>

            {editing && (
                <section className="card">
                    <h2>Edit profile</h2>
                    <form className="auth-form" onSubmit={handleSave}>
                        <label className="field">
                            <span>Display name</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                required
                                maxLength={60}
                            />
                        </label>
                        <label className="field">
                            <span>
                                Profile photo URL <em className="muted small">(optional)</em>
                            </span>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={form.profilePhotoUrl}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, profilePhotoUrl: e.target.value }))
                                }
                            />
                            <small className="muted">
                                Tip: leave empty to use the auto-generated initials avatar.
                            </small>
                        </label>
                        {form.profilePhotoUrl && (
                            <div className="profile-preview">
                                <Avatar
                                    user={{ ...user, name: form.name }}
                                    photoUrl={form.profilePhotoUrl}
                                    size={56}
                                />
                                <span className="muted small">Preview</span>
                            </div>
                        )}
                        <div className="actions-row">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {stats?.favoriteExercise && (
                <section className="card favorite-card">
                    <div className="favorite-header">
                        <div>
                            <div className="muted small">Favorite exercise</div>
                            <h2 className="favorite-name">{stats.favoriteExercise.name}</h2>
                            {stats.favoriteExercise.muscleGroupName && (
                                <span className="chip">{stats.favoriteExercise.muscleGroupName}</span>
                            )}
                        </div>
                        <div className="favorite-stats">
                            <div className="favorite-stat">
                                <div className="favorite-stat-value">
                                    {stats.favoriteExercise.totalSets}
                                </div>
                                <div className="favorite-stat-label">sets</div>
                            </div>
                            <div className="favorite-stat">
                                <div className="favorite-stat-value">
                                    {stats.favoriteExercise.totalReps}
                                </div>
                                <div className="favorite-stat-label">reps</div>
                            </div>
                            <div className="favorite-stat">
                                <div className="favorite-stat-value">
                                    {stats.favoriteExercise.sessions}
                                </div>
                                <div className="favorite-stat-label">sessions</div>
                            </div>
                        </div>
                    </div>
                    <p className="muted small">
                        The exercise you've logged the most sets &amp; reps for, all time.
                    </p>
                </section>
            )}

            <section className="card">
                <div className="stats-toolbar">
                    <h2>Workout stats</h2>
                    <div className="period-tabs" role="tablist" aria-label="Stats period">
                        {PERIODS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                role="tab"
                                aria-selected={period === p.id}
                                className={`period-tab${period === p.id ? ' is-active' : ''}`}
                                onClick={() => setPeriod(p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {statsLoading && <p className="muted">Loading {periodLabel.toLowerCase()}…</p>}

                {stats && !statsLoading && (
                    <>
                        <div className="stat-grid">
                            <Stat label={`Workouts (${periodLabel})`} value={stats.totalWorkouts} />
                            <Stat label="Total sets" value={stats.totalSets} />
                            <Stat label="Total reps" value={stats.totalReps} />
                            <Stat
                                label="Volume (reps × kg)"
                                value={Math.round(stats.totalVolume).toLocaleString()}
                            />
                            <Stat label="Failure sets" value={stats.failureSets || 0} />
                            <Stat
                                label="Current streak"
                                value={`${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? '' : 's'}`}
                            />
                            <Stat
                                label="Last session"
                                value={stats.lastWorkout ? formatPretty(stats.lastWorkout) : '—'}
                                small
                            />
                        </div>

                        {period === 'week' && (
                            <div className="profile-section">
                                <h3>Muscles hit this week</h3>
                                <p className="muted small">
                                    Week starting{' '}
                                    {stats.weekStartDate ? formatPretty(stats.weekStartDate) : '—'}.
                                </p>
                                {stats.weeklyMuscleGroups.length === 0 ? (
                                    <p className="muted">
                                        No muscle groups trained yet this week — go log a session!
                                    </p>
                                ) : (
                                    <div className="muscle-chip-row">
                                        {stats.weeklyMuscleGroups.map((g) => (
                                            <span key={g.muscleGroupId} className="muscle-chip">
                                                <span className="muscle-chip-name">{g.name}</span>
                                                <span className="muscle-chip-count">{g.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {stats.topExercises.length > 0 && (
                            <div className="profile-section">
                                <h3>Most-logged exercises ({periodLabel})</h3>
                                <ul className="ranked-list">
                                    {stats.topExercises.map((e) => (
                                        <li key={e.exerciseId}>
                                            <span>{e.name}</span>
                                            <span className="muted">{e.count}×</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {stats.topGroups.length > 0 && (
                            <div className="profile-section">
                                <h3>Muscle group focus ({periodLabel})</h3>
                                <ul className="ranked-list">
                                    {stats.topGroups.map((g) => (
                                        <li key={g.muscleGroupId}>
                                            <span>{g.name}</span>
                                            <span className="muted">{g.count} entries</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {stats.totalWorkouts === 0 && (
                            <p className="muted">
                                {period === 'all'
                                    ? 'No workouts yet — head back to the calendar and log your first session!'
                                    : `No workouts in the selected ${period}. Switch to "All time" to see your history.`}
                            </p>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

interface StatProps {
    label: string;
    value: number | string;
    small?: boolean;
}

function Stat({ label, value, small }: StatProps) {
    return (
        <div className="stat">
            <div className={`stat-value${small ? ' stat-value-small' : ''}`}>{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
