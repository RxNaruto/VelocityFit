import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../component/Avatar';
import { formatPretty } from '../utils/dates';
import type { PublicProfile } from '../types';

export default function UserProfilePage() {
    const { username = '' } = useParams<{ username: string }>();
    const { user: me } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setProfile(null);
        setLoading(true);
        api
            .getPublicUser(username)
            .then((p) => {
                if (cancelled) return;
                setProfile(p);
                setLoading(false);
            })
            .catch((err: Error) => {
                if (cancelled) return;
                toast.error(err.message || 'Failed to load profile');
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [username]);

    // Viewing your own /u/:username just shows the link to the private view.
    const isSelf = me && profile && me.id === profile.id;

    return (
        <div className="page">
            <div className="page-toolbar">
                <Link to="/leaderboard" className="btn btn-ghost">
                    ← Leaderboard
                </Link>
                {isSelf && (
                    <Link to="/profile" className="btn btn-primary">
                        Go to my profile
                    </Link>
                )}
            </div>

            {loading && !profile && <div className="loading">Loading…</div>}

            {profile && (
                <>
                    <section className="card profile-header">
                        <Avatar user={profile} size={88} />
                        <div className="profile-identity">
                            <h1>{profile.name}</h1>
                            <div className="muted">@{profile.username}</div>
                            <div className="muted small">
                                Joined {formatPretty(profile.createdAt?.slice(0, 10))}
                            </div>
                        </div>
                        <div className="profile-rank-pill">
                            <div className="profile-rank-label">Rank</div>
                            <div className="profile-rank-value">
                                #{profile.rank ?? '—'}
                                <span className="muted small"> / {profile.totalUsers}</span>
                            </div>
                            <div className="profile-points">{profile.points} pts</div>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Workout stats</h2>
                        <div className="stat-grid">
                            <Stat label="Total workouts" value={profile.stats.totalWorkouts} />
                            <Stat label="Total sets" value={profile.stats.totalSets} />
                            <Stat label="Total reps" value={profile.stats.totalReps} />
                            <Stat
                                label="Volume (reps × kg)"
                                value={Math.round(profile.stats.totalVolume).toLocaleString()}
                            />
                            <Stat
                                label="Current streak"
                                value={`${profile.stats.currentStreakDays} day${profile.stats.currentStreakDays === 1 ? '' : 's'}`}
                            />
                            <Stat
                                label="Last session"
                                value={
                                    profile.stats.lastWorkout ? formatPretty(profile.stats.lastWorkout) : '—'
                                }
                                small
                            />
                        </div>

                        {profile.stats.topExercises.length > 0 && (
                            <div className="profile-section">
                                <h3>Most-logged exercises</h3>
                                <ul className="ranked-list">
                                    {profile.stats.topExercises.map((e) => (
                                        <li key={e.exerciseId}>
                                            <span>{e.name}</span>
                                            <span className="muted">{e.count}×</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {profile.recentWorkouts.length > 0 && (
                        <section className="card">
                            <h2>Recent sessions</h2>
                            <ul className="recent-list">
                                {profile.recentWorkouts.map((w) => (
                                    <li key={w.id}>
                                        <div className="recent-item recent-item-readonly">
                                            <div>
                                                <div className="recent-date">{formatPretty(w.date)}</div>
                                                <div className="muted small">
                                                    {w.exerciseCount} exercise{w.exerciseCount === 1 ? '' : 's'} •{' '}
                                                    {w.setCount} sets
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}
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