import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../component/Calendar';
import { useWorkouts } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { formatPretty, todayKey } from '../utils/dates';

export default function HomePage() {
    const { workoutsByDate } = useWorkouts();
    const { user } = useAuth();
    const navigate = useNavigate();
    const today = todayKey();
    const todayWorkout = workoutsByDate[today];
    const joinedDateKey = user?.createdAt?.slice(0, 10) || null;

    const recent = Object.values(workoutsByDate)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5);

    return (
        <div className="page page-home">
            <section className="hero">
                <div>
                    <h1>Welcome back</h1>
                    <p className="muted">
                        {todayWorkout
                            ? `You've logged ${todayWorkout.entries.length} exercise(s) today. Keep going!`
                            : "You haven't logged today's workout yet."}
                    </p>
                </div>
                <Link to="/add" className="btn btn-primary btn-lg">
                    + Add today's workout
                </Link>
            </section>

            <section className="card">
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

            <section className="card">
                <h2>Recent sessions</h2>
                {recent.length === 0 ? (
                    <p className="muted">No sessions yet. Start by logging today's workout.</p>
                ) : (
                    <ul className="recent-list">
                        {recent.map((w) => (
                            <li key={w.id}>
                                <Link to={`/day/${w.date}`} className="recent-item">
                                    <div>
                                        <div className="recent-date">{formatPretty(w.date)}</div>
                                        <div className="muted small">
                                            {w.entries.length} exercise{w.entries.length === 1 ? '' : 's'} •{' '}
                                            {w.entries.reduce((s, e) => s + e.sets.length, 0)} sets total
                                        </div>
                                    </div>
                                    <span className="chev">›</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}