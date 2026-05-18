import { useWorkouts } from '../context/WorkoutContext';
import {
    formatDuration,
    isCardioGroup,
    isTimeBasedExercise,
} from '../utils/exerciseKind';
import type { WorkoutEntry, WorkoutSet } from '../types';

interface EntryListProps {
    entries: WorkoutEntry[];
    onRemove?: (idx: number) => void;
}

/** Total reps for a set = main reps + sum of drop reps (drops never apply to
 *  time-based exercises, but the math still holds because their drops array
 *  is empty by construction). */
function totalReps(set: WorkoutSet): number {
    const main = Number(set.reps) || 0;
    const drops = Array.isArray(set.drops)
        ? set.drops.reduce((sum, d) => sum + (Number(d.reps) || 0), 0)
        : 0;
    return main + drops;
}

/** Render a strength set as `10×50 → 6×40` (or just `10×50` with no drops). */
function describeStrengthSet(set: WorkoutSet): string {
    const segs = [formatSegment(set.reps, set.weight)];
    (set.drops || []).forEach((d) => segs.push(formatSegment(d.reps, d.weight)));
    return segs.join(' → ');
}

function formatSegment(reps: number, weight: number | null): string {
    const r = Number(reps) || 0;
    if (weight === null || weight === undefined || (weight as unknown as string) === '') {
        return String(r);
    }
    return `${r}×${weight}`;
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
                const timeBased = isTimeBasedExercise(exercise, muscleGroupLookup);
                // Cardio gets a stronger blue tint; non-cardio time-based (Plank,
                // Dead Hang, Wall Sit, …) gets a muted neutral tint so it's still
                // visually distinct from reps-based sets but doesn't look like cardio.
                const pillClass = timeBased
                    ? isCardioGroup(group)
                        ? ' is-cardio'
                        : ' is-time'
                    : '';
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
                            {entry.sets.map((s, i) => {
                                const hasDrops = !timeBased && Array.isArray(s.drops) && s.drops.length > 0;
                                return (
                                    <span
                                        className={`set-pill${pillClass}${s.isFailure ? ' is-failure' : ''}${hasDrops ? ' has-drops' : ''
                                            }`}
                                        key={s.id || i}
                                        title={
                                            hasDrops
                                                ? `Drop set — total ${totalReps(s)} reps across ${s.drops.length + 1} segments`
                                                : s.isFailure
                                                    ? 'Set taken to failure'
                                                    : undefined
                                        }
                                    >
                                        {timeBased ? (
                                            <>
                                                {formatDuration(s.reps)}
                                                <span className="set-pill-unit">min</span>
                                            </>
                                        ) : (
                                            <>{describeStrengthSet(s)}</>
                                        )}
                                        {s.isFailure && <span className="set-pill-badge">F</span>}
                                        {hasDrops && (
                                            <span className="set-pill-badge set-pill-badge-drop">
                                                D{s.drops.length}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                        {entry.notes && <p className="entry-notes">{entry.notes}</p>}
                    </li>
                );
            })}
        </ul>
    );
}