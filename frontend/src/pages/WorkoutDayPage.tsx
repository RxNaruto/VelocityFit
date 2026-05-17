import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import Spinner from '../component/Spinner';
import { formatPretty, isToday } from '../utils/dates';

export default function WorkoutDayPage() {
    const { date = '' } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const { workoutsByDate, exerciseLookup, muscleGroupLookup, getExercises, muscleGroups } =
        useWorkouts();

    const workout = workoutsByDate[date] || null;
    const editable = isToday(date);
    const [exercisesReady, setExercisesReady] = useState(false);

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
                <Link to="/" className="btn btn-ghost">← Back</Link>
                {editable && (
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/add')}>
                        {workout ? "Edit today's workout" : "+ Add today's workout"}
                    </button>
                )}
            </div>

            <h1>{formatPretty(date)}</h1>
            {!editable && (
                <p className="muted">Past sessions are read-only. You can only edit today's workout.</p>
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
                                                    <th>Reps</th>
                                                    <th>Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entry.sets.map((s, i) => (
                                                    <tr key={s.id}>
                                                        <td>{i + 1}</td>
                                                        <td>{s.reps}</td>
                                                        <td>{s.weight ?? '—'}</td>
                                                    </tr>
                                                ))}
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