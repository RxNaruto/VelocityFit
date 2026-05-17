import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import { isTimeBasedExercise, toSeconds } from '../utils/exerciseKind';
import type { EntryDraft, Exercise } from '../types';

interface SetLoggerProps {
    exercise: Exercise;
    onAdd: (entry: EntryDraft) => void;
    onCancel: () => void;
}

/**
 * Internal row shape. For strength training: `a = reps`, `b = weight`.
 * For time-based exercises (cardio + isometrics): `a = minutes`, `b = seconds`.
 * The submit handler converts these to the persistence shape
 * (`reps` + `weight | null`) using `toSeconds` for time-based.
 */
interface Row {
    id: string;
    a: number | string;
    b: number | string;
    isFailure: boolean;
}

function makeRow(a: number | string = '', b: number | string = '', isFailure = false): Row {
    return { id: `tmp_${Math.random().toString(36).slice(2, 8)}`, a, b, isFailure };
}

export default function SetLogger({ exercise, onAdd, onCancel }: SetLoggerProps) {
    const { muscleGroupLookup } = useWorkouts();
    const timeBased = useMemo(
        () => isTimeBasedExercise(exercise, muscleGroupLookup),
        [exercise, muscleGroupLookup]
    );

    const [rows, setRows] = useState<Row[]>([makeRow()]);
    const [notes, setNotes] = useState('');

    function updateRow<K extends keyof Row>(idx: number, field: K, value: Row[K]) {
        setRows((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    }

    function addRow() {
        setRows((prev) => {
            const last = prev[prev.length - 1];
            return [...prev, makeRow(last?.a || '', last?.b || '', false)];
        });
    }

    function toggleFailure(idx: number) {
        setRows((prev) => prev.map((s, i) => (i === idx ? { ...s, isFailure: !s.isFailure } : s)));
    }

    function removeRow(idx: number) {
        setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const cleaned = rows
            .map((r) => {
                if (timeBased) {
                    const totalSeconds = toSeconds(r.a, r.b);
                    return {
                        reps: totalSeconds,
                        weight: null as number | null,
                        isFailure: Boolean(r.isFailure),
                    };
                }
                return {
                    reps: Number(r.a) || 0,
                    weight: r.b === '' ? null : Number(r.b),
                    isFailure: Boolean(r.isFailure),
                };
            })
            .filter((s) => Number.isFinite(s.reps) && s.reps > 0);

        if (cleaned.length === 0) {
            toast.warn(
                timeBased
                    ? 'Add at least one set with a duration > 0.'
                    : 'Add at least one set with reps > 0.'
            );
            return;
        }
        onAdd({
            exerciseId: exercise.id,
            sets: cleaned,
            notes: notes.trim(),
        });
    }

    // ── Labels & headings differ between strength and time-based ───────────
    const aLabel = timeBased ? 'Min' : 'Reps';
    const bLabel = timeBased ? 'Sec' : 'Weight';
    const aPlaceholder = timeBased ? '0' : '0';
    const bPlaceholder = timeBased ? '0' : 'bodyweight';

    return (
        <form className="card" onSubmit={handleSubmit}>
            <p className="muted small">
                {timeBased
                    ? 'Log your sets — duration is split into minutes + seconds.'
                    : 'Log your sets for this exercise.'}
            </p>

            <div className="sets-editor">
                <div className="sets-editor-row sets-editor-head">
                    <span>#</span>
                    <span>{aLabel}</span>
                    <span>{bLabel}</span>
                    <span title="Mark as a set taken to failure">F</span>
                    <span></span>
                </div>
                {rows.map((r, i) => (
                    <div className="sets-editor-row" key={r.id}>
                        <span className="set-num">{i + 1}</span>
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={r.a}
                            onChange={(e) => updateRow(i, 'a', e.target.value)}
                            placeholder={aPlaceholder}
                            required={!timeBased}
                        />
                        <input
                            type="number"
                            min="0"
                            max={timeBased ? 59 : undefined}
                            step={timeBased ? 1 : 0.5}
                            inputMode={timeBased ? 'numeric' : 'decimal'}
                            value={r.b}
                            onChange={(e) => updateRow(i, 'b', e.target.value)}
                            placeholder={bPlaceholder}
                        />
                        <button
                            type="button"
                            className={`failure-toggle${r.isFailure ? ' is-on' : ''}`}
                            aria-label={r.isFailure ? 'Unmark failure set' : 'Mark as failure set'}
                            aria-pressed={r.isFailure}
                            title="Set taken to failure"
                            onClick={() => toggleFailure(i)}
                        >
                            F
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            aria-label="Remove set"
                            disabled={rows.length === 1}
                            onClick={() => removeRow(i)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="actions-row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={addRow}>
                    + Add set
                </button>
                <span className="muted small">
                    {timeBased ? (
                        <>
                            Each set = one interval (e.g. <strong>20 min</strong> run, or a{' '}
                            <strong>60 sec</strong> plank).
                        </>
                    ) : (
                        <>
                            Tap <strong>F</strong> on any set to mark it as taken to failure.
                        </>
                    )}
                </span>
            </div>

            <label className="field">
                <span>Notes (optional)</span>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={timeBased ? 'Pace, HR zone, hold quality…' : 'Form cues, RPE, etc.'}
                />
            </label>

            <div className="actions-row">
                <button type="button" className="btn btn-ghost" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                    Add to workout
                </button>
            </div>
        </form>
    );
}