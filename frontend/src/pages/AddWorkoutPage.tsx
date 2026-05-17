import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AddWorkoutPage() {
    const navigate = useNavigate();
    const { workoutsByDate, saveToday, getExercises, exerciseLookup, muscleGroupLookup } =
        useWorkouts();
    const today = todayKey();
    const existing = workoutsByDate[today];

    const [step, setStep] = useState<Step>(STEP.OVERVIEW);
    const [entries, setEntries] = useState<DraftEntry[]>(() =>
        mergeDuplicateEntries(existing?.entries || [])
    );
    const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!existing) return;
        const groupIds = new Set<string>();
        existing.entries.forEach((e) => {
            const ex = exerciseLookup[e.exerciseId];
            if (ex) groupIds.add(ex.muscleGroupId);
        });
        groupIds.forEach((id) => getExercises(id));
    }, [existing, exerciseLookup, getExercises]);

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

    function handleAddEntry(entry: EntryDraft) {
        let merged = false;
        setEntries((prev) => {
            const existingIdx = prev.findIndex((e) => e.exerciseId === entry.exerciseId);
            if (existingIdx === -1) return [...prev, toDraftEntry(entry)];
            merged = true;
            const next = [...prev];
            const existingEntry = next[existingIdx];
            const newSets = entry.sets.map((s) => ({
                id: rid('tmp_set'),
                reps: s.reps,
                weight: s.weight,
                isFailure: s.isFailure,
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
            return next;
        });

        const exerciseName = exerciseLookup[entry.exerciseId]?.name || 'exercise';
        if (merged) {
            toast.success(`Added ${entry.sets.length} more set(s) to ${exerciseName}`);
        } else {
            toast.success(`Added ${exerciseName} to workout`);
        }

        // After adding, step back through the wizard: stay on the same muscle
        // group's exercise list so you can quickly add another. Use the toolbar
        // back button (or the "Done" button) to return to the overview.
        setSelectedExercise(null);
        setStep(STEP.PICK_EXERCISE);
    }

    function handleRemoveEntry(idx: number) {
        setEntries((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSave() {
        setSaving(true);
        try {
            await saveToday(entries.map(toEntryDraft));
            toast.success('Workout saved');
            navigate(`/day/${today}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save workout';
            toast.error(message);
        } finally {
            setSaving(false);
        }
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
                <div className="muted small">{formatPretty(today)}</div>
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
                            ? 'No exercises added yet.'
                            : `${entries.length} exercise${entries.length === 1 ? '' : 's'} • ${totalSets} sets total`}
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
                            className="btn btn-success btn-lg"
                            disabled={entries.length === 0 || saving}
                            onClick={handleSave}
                        >
                            {saving ? (
                                <>
                                    <Spinner size={16} inline /> Saving…
                                </>
                            ) : (
                                'Save workout'
                            )}
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