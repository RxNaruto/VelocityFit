import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import Spinner from '../component/Spinner';
import { formatPretty, isToday } from '../utils/dates';
import { isTimeBasedExercise, formatDuration } from '../utils/exerciseKind';

export default function WorkoutDayPage() {
    const { date = '' } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const { workoutsByDate, exerciseLookup, muscleGroupLookup, getExercises, muscleGroups } =
        useWorkouts();

    const workout = workoutsByDate[date] || null;
    const editable = isToday(date);
    const [exercisesReady, setExercisesReady] = useState(false);

    // Make sure we have exercise names cached so we can render the workout
    // even if the user lands directly on this page.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            await Promise.all(muscleGroups.map((g) => getExercises(g.id)));
            if (!cancelled) setExercisesReady(true);
        })();
        return () => {
            cancelled = true;
        };
    }, [muscleGroups, getExercises]);

    return (
        <div className="page">
            <div className="page-toolbar">
                <Link to="/" className="btn btn-ghost">
                    ← Back
                </Link>
                {editable && (
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate('/add')}
                    >
                        {workout ? "Edit today's workout" : "+ Add today's workout"}
                    </button>
                )}
            </div>

            <h1>{formatPretty(date)}</h1>
            {!editable && (
                <p className="muted">
                    Past sessions are read-only. You can only edit today's workout.
                </p>
            )}

            {!workout ? (
                <div className="card empty-state">
                    <p>No workout logged for this day.</p>
                </div>
            ) : (
                <div className="card">
                    {!exercisesReady ? (
                        <Spinner size={24} label="Loading…" />
                    ) : (
                        <ol className="entry-list">
                            {workout.entries.map((entry) => {
                                const exercise = exerciseLookup[entry.exerciseId];
                                const group = exercise && muscleGroupLookup[exercise.muscleGroupId];
                                const timeBased = isTimeBasedExercise(exercise, muscleGroupLookup);
                                return (
                                    <li key={entry.id} className="entry">
                                        <div className="entry-head">
                                            <h3>{exercise?.name || entry.exerciseId}</h3>
                                            {group && <span className="chip">{group.name}</span>}
                                        </div>
                                        <table className="sets-table">
                                            <thead>
                                                <tr>
                                                    <th>Set</th>
                                                    {timeBased ? (
                                                        <th colSpan={2}>Duration</th>
                                                    ) : (
                                                        <>
                                                            <th>Reps</th>
                                                            <th>Weight</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entry.sets.map((s, i) => {
                                                    const drops = Array.isArray(s.drops) ? s.drops : [];
                                                    const hasDrops = !timeBased && drops.length > 0;
                                                    const totalReps =
                                                        (Number(s.reps) || 0) +
                                                        drops.reduce((sum, d) => sum + (Number(d.reps) || 0), 0);
                                                    return (
                                                        <Fragment key={s.id}>
                                                            <tr className={hasDrops ? 'is-drop-parent' : undefined}>
                                                                <td>
                                                                    {i + 1}
                                                                    {s.isFailure && (
                                                                        <span className="set-row-badge" title="Set to failure">
                                                                            F
                                                                        </span>
                                                                    )}
                                                                    {hasDrops && (
                                                                        <span
                                                                            className="set-row-badge set-row-badge-drop"
                                                                            title={`Drop set — ${totalReps} total reps`}
                                                                        >
                                                                            D{drops.length}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                {timeBased ? (
                                                                    <td colSpan={2}>{formatDuration(s.reps)} min</td>
                                                                ) : (
                                                                    <>
                                                                        <td>{s.reps}</td>
                                                                        <td>{s.weight ?? '—'}</td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                            {hasDrops &&
                                                                drops.map((d, j) => (
                                                                    <tr key={d.id} className="drop-tr">
                                                                        <td className="drop-tr-num">
                                                                            <span aria-hidden="true">↳</span> drop {j + 1}
                                                                        </td>
                                                                        <td>{d.reps}</td>
                                                                        <td>{d.weight ?? '—'}</td>
                                                                    </tr>
                                                                ))}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {entry.notes && <p className="entry-notes">{entry.notes}</p>}
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            )}
        </div>
    );
}