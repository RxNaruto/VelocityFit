import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import { formatPretty, todayKey } from '../utils/dates';
import MuscleGroupPicker from '../component/MuscleGroupPicker';
import ExercisePicker from '../component/ExercisePicker';
import SetLogger from '../component/SetLogger';
import EntryList from '../component/EntryList';
import Spinner from '../component/Spinner';
import type {
    EntryDraft,
    Exercise,
    MuscleGroup,
    WorkoutEntry,
} from '../types';

const STEP = {
    OVERVIEW: 'overview',
    PICK_GROUP: 'pickGroup',
    PICK_EXERCISE: 'pickExercise',
    LOG_SETS: 'logSets',
} as const;

type Step = (typeof STEP)[keyof typeof STEP];
type DraftEntry = WorkoutEntry;

function rid(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function toDraftEntry(entry: EntryDraft): DraftEntry {
    return {
        id: rid('tmp'),
        exerciseId: entry.exerciseId,
        notes: entry.notes,
        sets: entry.sets.map((s) => ({
            id: rid('tmp_set'),
            reps: s.reps,
            weight: s.weight,
            isFailure: s.isFailure,
            drops: (s.drops || []).map((d) => ({
                id: rid('tmp_drop'),
                reps: d.reps,
                weight: d.weight,
            })),
        })),
    };
}

function toEntryDraft(entry: DraftEntry): EntryDraft {
    return {
        exerciseId: entry.exerciseId,
        notes: entry.notes,
        sets: entry.sets.map((s) => ({
            reps: Number(s.reps) || 0,
            weight:
                s.weight === null || (s.weight as unknown as string) === ''
                    ? null
                    : Number(s.weight),
            isFailure: Boolean(s.isFailure),
            drops: (s.drops || []).map((d) => ({
                reps: Number(d.reps) || 0,
                weight:
                    d.weight === null || (d.weight as unknown as string) === ''
                        ? null
                        : Number(d.weight),
            })),
        })),
    };
}

/**
 * Collapse duplicate-exerciseId entries into a single entry whose sets are
 * the concatenation of all duplicates' sets, in original order. Used on
 * initial load (in case the backend already has duplicates) and on every
 * add (so a re-pick of the same exercise extends the existing entry).
 */
function mergeDuplicateEntries(entries: DraftEntry[]): DraftEntry[] {
    const byExerciseId = new Map<string, DraftEntry>();
    for (const e of entries) {
        const existing = byExerciseId.get(e.exerciseId);
        if (!existing) {
            byExerciseId.set(e.exerciseId, { ...e, sets: [...e.sets] });
            continue;
        }
        existing.sets = [...existing.sets, ...e.sets];
        if (e.notes && e.notes !== existing.notes) {
            existing.notes = existing.notes
                ? `${existing.notes}\n${e.notes}`
                : e.notes;
        }
    }
    return Array.from(byExerciseId.values());
}

const VALID_STEPS = new Set<Step>(Object.values(STEP));

function readStepFromQuery(value: string | null): Step | null {
    if (!value) return null;
    return VALID_STEPS.has(value as Step) ? (value as Step) : null;
}

export default function AddWorkoutPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { workoutsByDate, saveToday, getExercises, exerciseLookup, muscleGroupLookup } =
        useWorkouts();
    const today = todayKey();
    const existing = workoutsByDate[today];

    // Honor `/add?step=pickGroup` so the header / homepage CTAs can drop
    // the user straight into the muscle-group picker without an extra tap.
    const initialStep = readStepFromQuery(searchParams.get('step')) || STEP.OVERVIEW;

    const [step, setStep] = useState<Step>(initialStep);
    const [entries, setEntries] = useState<DraftEntry[]>(() =>
        mergeDuplicateEntries(existing?.entries || [])
    );
    const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    // Tracks the auto-save state of the most recent entry mutation.
    const [persisting, setPersisting] = useState(false);
    // Used to serialize concurrent saves — last call wins, earlier ones
    // are ignored if a newer one is already in flight.
    const saveSeqRef = useRef(0);

    useEffect(() => {
        if (!existing) return;
        const groupIds = new Set<string>();
        existing.entries.forEach((e) => {
            const ex = exerciseLookup[e.exerciseId];
            if (ex) groupIds.add(ex.muscleGroupId);
        });
        groupIds.forEach((id) => getExercises(id));
    }, [existing, exerciseLookup, getExercises]);

    // Strip the `?step=` query param once we've consumed it so the URL
    // doesn't keep "remembering" it after the user navigates around.
    useEffect(() => {
        if (searchParams.get('step')) {
            const next = new URLSearchParams(searchParams);
            next.delete('step');
            setSearchParams(next, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalSets = useMemo(
        () => entries.reduce((sum, e) => sum + e.sets.length, 0),
        [entries]
    );

    function handlePickGroup(group: MuscleGroup) {
        setSelectedGroup(group);
        setStep(STEP.PICK_EXERCISE);
    }

    function handlePickExercise(exercise: Exercise) {
        setSelectedExercise(exercise);
        setStep(STEP.LOG_SETS);
    }

    /**
     * Persist `next` to the backend and reconcile local state with the
     * authoritative response (which carries real DB ids for new sets).
     * Rolls back to `previous` if the server rejects the change.
     */
    async function persistEntries(
        next: DraftEntry[],
        previous: DraftEntry[],
        successMessage: string
    ) {
        const seq = ++saveSeqRef.current;
        setPersisting(true);
        try {
            const saved = await saveToday(next.map(toEntryDraft));
            // Bail out if another save started after this one — its result
            // is what should win.
            if (seq !== saveSeqRef.current) return;
            // Replace local draft ids with the real persisted entries so the
            // UI shows server-side ids (and any normalization the backend did).
            setEntries(saved.entries);
            toast.success(successMessage);
        } catch (err) {
            if (seq !== saveSeqRef.current) return;
            setEntries(previous);
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            if (seq === saveSeqRef.current) setPersisting(false);
        }
    }

    function handleAddEntry(entry: EntryDraft) {
        const previous = entries;
        const existingIdx = previous.findIndex((e) => e.exerciseId === entry.exerciseId);
        let next: DraftEntry[];
        let merged = false;

        if (existingIdx === -1) {
            next = [...previous, toDraftEntry(entry)];
        } else {
            merged = true;
            next = [...previous];
            const existingEntry = next[existingIdx]!;
            const newSets = entry.sets.map((s) => ({
                id: rid('tmp_set'),
                reps: s.reps,
                weight: s.weight,
                isFailure: s.isFailure,
                drops: (s.drops || []).map((d) => ({
                    id: rid('tmp_drop'),
                    reps: d.reps,
                    weight: d.weight,
                })),
            }));
            next[existingIdx] = {
                ...existingEntry,
                sets: [...existingEntry.sets, ...newSets],
                notes: entry.notes
                    ? existingEntry.notes
                        ? `${existingEntry.notes}\n${entry.notes}`
                        : entry.notes
                    : existingEntry.notes,
            };
        }

        setEntries(next);

        const exerciseName = exerciseLookup[entry.exerciseId]?.name || 'exercise';
        const successMsg = merged
            ? `Added ${entry.sets.length} more set(s) to ${exerciseName} • saved`
            : `Added ${exerciseName} • saved`;
        // Fire-and-forget; persistEntries handles its own toasts/rollback.
        void persistEntries(next, previous, successMsg);

        // Stay on the same muscle group so the user can quickly add another.
        setSelectedExercise(null);
        setStep(STEP.PICK_EXERCISE);
    }

    function handleRemoveEntry(idx: number) {
        const previous = entries;
        const removed = previous[idx];
        if (!removed) return;
        const next = previous.filter((_, i) => i !== idx);
        setEntries(next);
        const name = exerciseLookup[removed.exerciseId]?.name || 'exercise';
        void persistEntries(next, previous, `Removed ${name} • saved`);
    }

    // Toolbar back. Walks the wizard back one step at a time, exactly mirroring
    // the forward path: OVERVIEW → PICK_GROUP → PICK_EXERCISE → LOG_SETS.
    function handleBack() {
        if (step === STEP.LOG_SETS) {
            setSelectedExercise(null);
            setStep(STEP.PICK_EXERCISE);
        } else if (step === STEP.PICK_EXERCISE) {
            setSelectedGroup(null);
            setStep(STEP.PICK_GROUP);
        } else if (step === STEP.PICK_GROUP) {
            setStep(STEP.OVERVIEW);
        } else {
            navigate(-1);
        }
    }

    function jumpTo(target: Step) {
        if (target === STEP.OVERVIEW) {
            setSelectedExercise(null);
            setSelectedGroup(null);
        } else if (target === STEP.PICK_GROUP) {
            setSelectedExercise(null);
            setSelectedGroup(null);
        } else if (target === STEP.PICK_EXERCISE) {
            setSelectedExercise(null);
        }
        setStep(target);
    }

    function handleDone() {
        navigate(`/day/${today}`);
    }

    // ── Render helpers ───────────────────────────────────────────────────
    const groupName =
        selectedGroup?.name ||
        (selectedExercise && muscleGroupLookup[
            exerciseLookup[selectedExercise.id]?.muscleGroupId || ''
        ]?.name) ||
        null;
    const exerciseName = selectedExercise?.name || null;

    return (
        <div className="page">
            <div className="page-toolbar">
                <button type="button" className="btn btn-ghost" onClick={handleBack}>
                    ← Back
                </button>
                <div className="muted small autosave-pill">
                    {persisting ? (
                        <>
                            <Spinner size={12} inline /> Saving…
                        </>
                    ) : (
                        <>{formatPretty(today)} • auto-saving</>
                    )}
                </div>
            </div>

            {step !== STEP.OVERVIEW && (
                <Breadcrumb
                    step={step}
                    groupName={groupName}
                    exerciseName={exerciseName}
                    onJump={jumpTo}
                />
            )}

            {step === STEP.OVERVIEW && (
                <>
                    <h1>{existing ? "Edit today's workout" : "Log today's workout"}</h1>
                    <p className="muted">
                        {entries.length === 0
                            ? 'No exercises added yet — each one you add is saved instantly.'
                            : `${entries.length} exercise${entries.length === 1 ? '' : 's'} • ${totalSets} sets total • saved automatically`}
                    </p>

                    <EntryList entries={entries} onRemove={handleRemoveEntry} />

                    <div className="actions-row">
                        <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={() => setStep(STEP.PICK_GROUP)}
                        >
                            + Add exercise
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-lg"
                            onClick={handleDone}
                            disabled={entries.length === 0}
                        >
                            Done
                        </button>
                    </div>
                </>
            )}

            {step === STEP.PICK_GROUP && (
                <>
                    <h1>Pick a muscle group</h1>
                    <MuscleGroupPicker onPick={handlePickGroup} />
                </>
            )}

            {step === STEP.PICK_EXERCISE && selectedGroup && (
                <>
                    <div className="step-header">
                        <h1>{selectedGroup.name} exercises</h1>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => jumpTo(STEP.OVERVIEW)}
                        >
                            Done
                        </button>
                    </div>
                    <ExercisePicker muscleGroupId={selectedGroup.id} onPick={handlePickExercise} />
                </>
            )}

            {step === STEP.LOG_SETS && selectedExercise && (
                <>
                    <h1>{selectedExercise.name}</h1>
                    <SetLogger exercise={selectedExercise} onAdd={handleAddEntry} onCancel={handleBack} />
                </>
            )}
        </div>
    );
}

interface BreadcrumbProps {
    step: Step;
    groupName: string | null;
    exerciseName: string | null;
    onJump: (target: Step) => void;
}

function Breadcrumb({ step, groupName, exerciseName, onJump }: BreadcrumbProps) {
    return (
        <nav className="breadcrumb" aria-label="Wizard steps">
            <button
                type="button"
                className="breadcrumb-item"
                onClick={() => onJump(STEP.OVERVIEW)}
            >
                Overview
            </button>
            <span className="breadcrumb-sep">›</span>
            <button
                type="button"
                className={`breadcrumb-item${step === STEP.PICK_GROUP ? ' is-current' : ''}`}
                onClick={() => onJump(STEP.PICK_GROUP)}
            >
                Muscle group
            </button>
            {(step === STEP.PICK_EXERCISE || step === STEP.LOG_SETS) && (
                <>
                    <span className="breadcrumb-sep">›</span>
                    <button
                        type="button"
                        className={`breadcrumb-item${step === STEP.PICK_EXERCISE ? ' is-current' : ''}`}
                        onClick={() => onJump(STEP.PICK_EXERCISE)}
                        disabled={!groupName}
                    >
                        {groupName || 'Exercise'}
                    </button>
                </>
            )}
            {step === STEP.LOG_SETS && (
                <>
                    <span className="breadcrumb-sep">›</span>
                    <span className="breadcrumb-item is-current" aria-current="step">
                        {exerciseName || 'Log sets'}
                    </span>
                </>
            )}
        </nav>
    );
}