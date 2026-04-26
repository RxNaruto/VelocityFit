import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import type { EntryDraft, Exercise, SetDraft } from '../types';

interface SetLoggerProps {
    exercise: Exercise;
    onAdd: (entry: EntryDraft) => void;
    onCancel: () => void;
}

function makeSet(reps: number | string = '', weight: number | string = '', isFailure = false): SetDraft {
    return {
        id: `tmp_${Math.random().toString(36).slice(2, 8)}`,
        reps,
        weight,
        isFailure,
    };
}

export default function SetLogger({ exercise, onAdd, onCancel }: SetLoggerProps) {
    const [sets, setSets] = useState<SetDraft[]>([makeSet()]);
    const [notes, setNotes] = useState('');

    function updateSet<K extends keyof SetDraft>(idx: number, field: K, value: SetDraft[K]) {
        setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    }

    function addSet() {
        setSets((prev) => {
            const last = prev[prev.length - 1];
            return [...prev, makeSet(last?.reps || '', last?.weight || '', false)];
        });
    }

    function toggleFailure(idx: number) {
        setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, isFailure: !s.isFailure } : s)));
    }

    function removeSet(idx: number) {
        setSets((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const cleaned = sets
            .map((s) => ({
                reps: Number(s.reps),
                weight: s.weight === '' ? null : Number(s.weight),
                isFailure: Boolean(s.isFailure),
            }))
            .filter((s) => Number.isFinite(s.reps) && s.reps > 0);

        if (cleaned.length === 0) {
            toast.warn('Add at least one set with reps > 0.');
            return;
        }
        onAdd({
            exerciseId: exercise.id,
            sets: cleaned,
            notes: notes.trim(),
        });
    }

    return (
        <form className="card" onSubmit={handleSubmit}>
            <p className="muted small">Log your sets for this exercise.</p>

            <div className="sets-editor">
                <div className="sets-editor-row sets-editor-head">
                    <span>#</span>
                    <span>Reps</span>
                    <span>Weight</span>
                    <span title="Mark as a set taken to failure">F</span>
                    <span></span>
                </div>
                {sets.map((s, i) => (
                    <div className="sets-editor-row" key={s.id}>
                        <span className="set-num">{i + 1}</span>
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={s.reps}
                            onChange={(e) => updateSet(i, 'reps', e.target.value)}
                            placeholder="0"
                            required
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            inputMode="decimal"
                            value={s.weight}
                            onChange={(e) => updateSet(i, 'weight', e.target.value)}
                            placeholder="bodyweight"
                        />
                        <button
                            type="button"
                            className={`failure-toggle${s.isFailure ? ' is-on' : ''}`}
                            aria-label={s.isFailure ? 'Unmark failure set' : 'Mark as failure set'}
                            aria-pressed={s.isFailure}
                            title="Set taken to failure"
                            onClick={() => toggleFailure(i)}
                        >
                            F
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            aria-label="Remove set"
                            disabled={sets.length === 1}
                            onClick={() => removeSet(i)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="actions-row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={addSet}>
                    + Add set
                </button>
                <span className="muted small">
                    Tap <strong>F</strong> on any set to mark it as taken to failure.
                </span>
            </div>

            <label className="field">
                <span>Notes (optional)</span>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Form cues, RPE, etc."
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