import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import {
    findLastSessionFor,
    formatDuration,
    fromSeconds,
    isTimeBasedExercise,
    toSeconds,
} from '../utils/exerciseKind';
import { formatPretty, todayKey } from '../utils/dates';
import type { EntryDraft, Exercise, WorkoutEntry, WorkoutSet } from '../types';

interface SetLoggerProps {
    exercise: Exercise;
    onAdd: (entry: EntryDraft) => void;
    onCancel: () => void;
}

/**
 * Internal row shape. For strength training: `a = reps`, `b = weight`.
 * For time-based exercises (cardio + isometrics): `a = minutes`, `b = seconds`.
 *
 * For strength training, each row can also carry zero or more *drop* segments.
 * A drop is the same physical set continued at a lower weight with no rest
 * — e.g. 10 × 50 (failure) → 6 × 40. Drops are intentionally disabled for
 * time-based exercises (no concept of "drop the weight" on cardio/isometrics).
 */
interface DropRow {
    id: string;
    reps: number | string;
    weight: number | string;
}

interface Row {
    id: string;
    a: number | string;
    b: number | string;
    isFailure: boolean;
    drops: DropRow[];
}

function rid(prefix = 'tmp'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeRow(a: number | string = '', b: number | string = '', isFailure = false): Row {
    return { id: rid(), a, b, isFailure, drops: [] };
}

function makeDrop(reps: number | string = '', weight: number | string = ''): DropRow {
    return { id: rid('drop'), reps, weight };
}

/** Convert a persisted WorkoutSet back into the editor's Row shape, picking
 *  the right input split (Reps/Weight vs Min/Sec) for the exercise kind. */
function setToRow(set: WorkoutSet, timeBased: boolean): Row {
    if (timeBased) {
        const { minutes, seconds } = fromSeconds(set.reps);
        return {
            id: rid(),
            a: minutes || '',
            b: seconds || '',
            isFailure: Boolean(set.isFailure),
            drops: [],
        };
    }
    return {
        id: rid(),
        a: set.reps,
        b: set.weight ?? '',
        isFailure: Boolean(set.isFailure),
        drops: (set.drops || []).map((d) => makeDrop(d.reps, d.weight ?? '')),
    };
}

function entryToRows(entry: WorkoutEntry, timeBased: boolean): Row[] {
    if (!entry.sets || entry.sets.length === 0) return [makeRow()];
    return entry.sets.map((s) => setToRow(s, timeBased));
}

export default function SetLogger({ exercise, onAdd, onCancel }: SetLoggerProps) {
    const { muscleGroupLookup, workoutsByDate } = useWorkouts();
    const timeBased = useMemo(
        () => isTimeBasedExercise(exercise, muscleGroupLookup),
        [exercise, muscleGroupLookup]
    );

    // Look up the previous time the user did this exercise (excluding today)
    // and pre-fill the form with those sets so they can just tweak today's
    // numbers and submit. If they want a clean slate, the "Start fresh"
    // button below restores a single empty row.
    const lastSession = useMemo(
        () => findLastSessionFor(workoutsByDate, exercise.id, todayKey()),
        [workoutsByDate, exercise.id]
    );

    const [rows, setRows] = useState<Row[]>(() =>
        lastSession ? entryToRows(lastSession.entry, timeBased) : [makeRow()]
    );
    const [notes, setNotes] = useState('');
    // Whether the form is still showing untouched pre-fill from the last
    // session. Used only to label the "Start fresh" button slightly differently
    // — once the user starts editing, we no longer call the data "pre-filled".
    const [prefilled, setPrefilled] = useState<boolean>(Boolean(lastSession));

    function markDirty() {
        if (prefilled) setPrefilled(false);
    }

    function updateRow<K extends keyof Row>(idx: number, field: K, value: Row[K]) {
        markDirty();
        setRows((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    }

    function addRow() {
        markDirty();
        setRows((prev) => {
            const last = prev[prev.length - 1];
            // Only carry over the parent set's reps/weight — drops should start fresh.
            return [...prev, makeRow(last?.a || '', last?.b || '', false)];
        });
    }

    function toggleFailure(idx: number) {
        markDirty();
        setRows((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, isFailure: !s.isFailure } : s))
        );
    }

    function removeRow(idx: number) {
        markDirty();
        setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
    }

    // Restore the form to a single empty row. Useful when last session's
    // numbers aren't representative of today's plan.
    function resetRows() {
        setRows([makeRow()]);
        setPrefilled(false);
    }

    // Re-apply the last session's data after the user has edited.
    function reapplyLastSession() {
        if (!lastSession) return;
        setRows(entryToRows(lastSession.entry, timeBased));
        setPrefilled(true);
    }

    // ─── Drop-set helpers ───────────────────────────────────────────────
    // Adding a drop implies the parent set went to failure. We auto-flip
    // the failure flag the first time a drop appears so the UI matches
    // the lifter's intent (a drop *only* makes sense after failure).
    function addDrop(rowIdx: number) {
        markDirty();
        setRows((prev) =>
            prev.map((r, i) => {
                if (i !== rowIdx) return r;
                const last = r.drops[r.drops.length - 1];
                const seedReps = last?.reps || '';
                const seedWeight =
                    r.drops.length === 0
                        ? // First drop seeds from the parent set's weight, slightly
                        // lower (rounded to .5) so the field already shows a plausible
                        // value the user can tweak.
                        suggestDropWeight(r.b)
                        : last?.weight || '';
                return {
                    ...r,
                    isFailure: true,
                    drops: [...r.drops, makeDrop(seedReps, seedWeight)],
                };
            })
        );
    }

    function updateDrop(rowIdx: number, dropIdx: number, field: 'reps' | 'weight', value: string) {
        markDirty();
        setRows((prev) =>
            prev.map((r, i) => {
                if (i !== rowIdx) return r;
                return {
                    ...r,
                    drops: r.drops.map((d, j) => (j === dropIdx ? { ...d, [field]: value } : d)),
                };
            })
        );
    }

    function removeDrop(rowIdx: number, dropIdx: number) {
        markDirty();
        setRows((prev) =>
            prev.map((r, i) =>
                i === rowIdx ? { ...r, drops: r.drops.filter((_, j) => j !== dropIdx) } : r
            )
        );
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
                const drops = r.drops
                    .map((d) => ({
                        reps: Number(d.reps) || 0,
                        weight: d.weight === '' ? null : Number(d.weight),
                    }))
                    .filter((d) => Number.isFinite(d.reps) && d.reps > 0);
                return {
                    reps: Number(r.a) || 0,
                    weight: r.b === '' ? null : Number(r.b),
                    isFailure: Boolean(r.isFailure),
                    drops,
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
            {/* "Last session" reference panel + pre-fill controls. */}
            {lastSession && (
                <LastSessionPanel
                    date={lastSession.date}
                    entry={lastSession.entry}
                    timeBased={timeBased}
                    prefilled={prefilled}
                    onReset={resetRows}
                    onReapply={reapplyLastSession}
                />
            )}

            <p className="muted small">
                {timeBased
                    ? 'Log your sets — duration is split into minutes + seconds.'
                    : 'Log your sets. Tap “+ Drop” on a set to log a no-rest drop after failure.'}
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
                    <div className="set-row-group" key={r.id}>
                        <div className="sets-editor-row">
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

                        {/* Drop-set sub-rows. Hidden entirely for time-based exercises. */}
                        {!timeBased && r.drops.length > 0 && (
                            <div className="drop-rows">
                                {r.drops.map((d, j) => (
                                    <div className="drop-row" key={d.id}>
                                        <span className="drop-row-arrow" aria-hidden="true">
                                            ↳
                                        </span>
                                        <span className="drop-row-label">drop {j + 1}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={d.reps}
                                            placeholder="reps"
                                            onChange={(e) => updateDrop(i, j, 'reps', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step={0.5}
                                            inputMode="decimal"
                                            value={d.weight}
                                            placeholder="weight"
                                            onChange={(e) => updateDrop(i, j, 'weight', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            aria-label="Remove drop"
                                            onClick={() => removeDrop(i, j)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!timeBased && (
                            <div className="drop-add">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => addDrop(i)}
                                    title="Add a no-rest drop after failure"
                                >
                                    + Drop
                                </button>
                                {r.drops.length > 0 && (
                                    <span className="muted small">
                                        Total reps in this set:{' '}
                                        <strong>{totalSetReps(r)}</strong>
                                        {r.b !== '' && r.drops.every((d) => d.weight !== '') && (
                                            <> ({formatSegments(r)})</>
                                        )}
                                    </span>
                                )}
                            </div>
                        )}
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

interface LastSessionPanelProps {
    date: string;
    entry: WorkoutEntry;
    timeBased: boolean;
    prefilled: boolean;
    onReset: () => void;
    onReapply: () => void;
}

/**
 * Read-only summary of the user's previous session for this exercise.
 *
 * Doubles as a control panel:
 * - "Start fresh" → wipes the pre-filled rows back to one empty input
 * - "Use last session" (shown only after the user has edited) → restores
 *   the pre-fill so they don't lose the reference numbers
 */
function LastSessionPanel({
    date,
    entry,
    timeBased,
    prefilled,
    onReset,
    onReapply,
}: LastSessionPanelProps) {
    const totalSets = entry.sets.length;
    return (
        <div className="last-session" role="note" aria-label="Last session for this exercise">
            <div className="last-session-head">
                <div>
                    <div className="last-session-title">
                        Last time · {formatPretty(date)}
                    </div>
                    <div className="muted small">
                        {totalSets} set{totalSets === 1 ? '' : 's'}
                        {prefilled
                            ? ' — pre-filled below, tweak what changed for today.'
                            : ' — for reference.'}
                    </div>
                </div>
                <div className="last-session-actions">
                    {!prefilled && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onReapply}
                            title="Restore the pre-filled values from your last session"
                        >
                            Use last session
                        </button>
                    )}
                    {prefilled && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onReset}
                            title="Clear the pre-fill and start from scratch"
                        >
                            Start fresh
                        </button>
                    )}
                </div>
            </div>
            <div className="set-pills">
                {entry.sets.map((s, i) => {
                    const hasDrops = !timeBased && Array.isArray(s.drops) && s.drops.length > 0;
                    return (
                        <span
                            className={`set-pill${s.isFailure ? ' is-failure' : ''}${hasDrops ? ' has-drops' : ''
                                }`}
                            key={s.id || i}
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
        </div>
    );
}

// Suggest a drop weight ≈ 80% of the parent (rounded to nearest 0.5kg).
// Returns '' if the parent has no numeric weight so the field stays blank.
function suggestDropWeight(parentWeight: number | string): number | string {
    const w = Number(parentWeight);
    if (!Number.isFinite(w) || w <= 0) return '';
    const proposed = Math.round(w * 0.8 * 2) / 2;
    return proposed > 0 ? proposed : '';
}

function totalSetReps(r: Row): number {
    const main = Number(r.a) || 0;
    const drops = r.drops.reduce((sum, d) => sum + (Number(d.reps) || 0), 0);
    return main + drops;
}

function formatSegments(r: Row): string {
    const segs = [
        `${Number(r.a) || 0}×${r.b}`,
        ...r.drops.map((d) => `${Number(d.reps) || 0}×${d.weight}`),
    ];
    return segs.join(' → ');
}

/** Identical formatting to `EntryList`'s set-pill text, kept local so the
 *  SetLogger doesn't import a component just to render text. */
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