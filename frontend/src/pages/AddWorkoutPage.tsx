import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import { formatPretty, todayKey } from '../utils/dates';
import MuscleGroupPicker from '../component/MuscleGroupPicker';
import ExercisePicker from '../component/ExercisePicker';
import SetLogger from '../component/SetLogger';
import EntryList from '../component/EntryList';
import type { EntryDraft, Exercise, MuscleGroup, WorkoutEntry } from '../types';

const STEP = {
    OVERVIEW: 'overview',
    PICK_GROUP: 'pickGroup',
    PICK_EXERCISE: 'pickExercise',
    LOG_SETS: 'logSets',
} as const;

type Step = (typeof STEP)[keyof typeof STEP];

// Local working copy of an entry — sets carry the not-yet-saved shape from
// the SetLogger draft (numbers + null weight) plus a synthetic id so the
// rendered list can be keyed safely.
type DraftEntry = WorkoutEntry;

function toDraftEntry(entry: EntryDraft): DraftEntry {
    return {
        id: `tmp_${Math.random().toString(36).slice(2, 8)}`,
        exerciseId: entry.exerciseId,
        notes: entry.notes,
        sets: entry.sets.map((s, i) => ({
            id: `tmp_set_${i}_${Math.random().toString(36).slice(2, 6)}`,
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
            weight: s.weight === null || (s.weight as unknown as string) === '' ? null : Number(s.weight),
            isFailure: Boolean(s.isFailure),
        })),
    };
}

export default function AddWorkoutPage() {
    const navigate = useNavigate();
    const { workoutsByDate, saveToday, getExercises, exerciseLookup } = useWorkouts();
    const today = todayKey();
    const existing = workoutsByDate[today];

    const [step, setStep] = useState<Step>(STEP.OVERVIEW);
    const [entries, setEntries] = useState<DraftEntry[]>(() => existing?.entries || []);
    const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [saving, setSaving] = useState(false);

    // Preload exercise names referenced by existing entries (so labels render).
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
        setEntries((prev) => [...prev, toDraftEntry(entry)]);
        setSelectedExercise(null);
        setSelectedGroup(null);
        setStep(STEP.OVERVIEW);
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

    function handleCancel() {
        if (step === STEP.LOG_SETS) {
            setStep(STEP.PICK_EXERCISE);
            setSelectedExercise(null);
        } else if (step === STEP.PICK_EXERCISE) {
            setStep(STEP.PICK_GROUP);
            setSelectedGroup(null);
        } else if (step === STEP.PICK_GROUP) {
            setStep(STEP.OVERVIEW);
        } else {
            navigate(-1);
        }
    }

    return (
        <div className="page">
            <div className="page-toolbar">
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                    ← Back
                </button>
                <div className="muted small">{formatPretty(today)}</div>
            </div>

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
                            {saving ? 'Saving…' : 'Save workout'}
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
                    <h1>{selectedGroup.name} exercises</h1>
                    <ExercisePicker muscleGroupId={selectedGroup.id} onPick={handlePickExercise} />
                </>
            )}

            {step === STEP.LOG_SETS && selectedExercise && (
                <>
                    <h1>{selectedExercise.name}</h1>
                    <SetLogger exercise={selectedExercise} onAdd={handleAddEntry} onCancel={handleCancel} />
                </>
            )}
        </div>
    );
}