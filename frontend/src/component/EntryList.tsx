import { useWorkouts } from '../context/WorkoutContext';
import type { WorkoutEntry } from '../types';

interface EntryListProps {
    entries: WorkoutEntry[];
    onRemove?: (idx: number) => void;
}

export default function EntryList({ entries, onRemove }: EntryListProps) {
    const { exerciseLookup, muscleGroupLookup } = useWorkouts();

    if (!entries || entries.length === 0) {
        return (
            <div className="card empty-state">
                <p>Tap "Add exercise" to start logging.</p>
            </div>
        );
    }

    return (
        <ul className="entry-list">
            {entries.map((entry, idx) => {
                const exercise = exerciseLookup[entry.exerciseId];
                const group = exercise && muscleGroupLookup[exercise.muscleGroupId];
                return (
                    <li key={entry.id || idx} className="entry">
                        <div className="entry-head">
                            <h3>{exercise?.name || entry.exerciseId}</h3>
                            <div className="entry-actions">
                                {group && <span className="chip">{group.name}</span>}
                                {onRemove && (
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        aria-label="Remove exercise"
                                        onClick={() => onRemove(idx)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="set-pills">
                            {entry.sets.map((s, i) => (
                                <span
                                    className={`set-pill${s.isFailure ? ' is-failure' : ''}`}
                                    key={s.id || i}
                                    title={s.isFailure ? 'Set taken to failure' : undefined}
                                >
                                    {s.reps}
                                    {s.weight != null && (s.weight as unknown as string) !== ''
                                        ? ` × ${s.weight}`
                                        : ''}
                                    {s.isFailure && <span className="set-pill-badge">F</span>}
                                </span>
                            ))}
                        </div>
                        {entry.notes && <p className="entry-notes">{entry.notes}</p>}
                    </li>
                );
            })}
        </ul>
    );
}
