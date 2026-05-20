import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import Spinner from '../component/Spinner';
import type { Exercise, MuscleGroup } from '../types';

/**
 * Exercise admin portal — lives at /admin/exercises.
 *
 * Lets any signed-in user add new exercises (or a brand-new muscle group)
 * straight into the database, list them grouped by muscle, and delete
 * unused ones. No code change or seed-script edit required.
 *
 * Time-based vs strength is chosen at create-time and stored on
 * `Exercise.tracksTime` — the workout flow reads that flag to switch
 * between Reps×Weight and Min/Sec inputs.
 */
export default function ManageExercisesPage() {
    const {
        muscleGroups,
        exercisesByGroup,
        getExercises,
        createExercise,
        createMuscleGroup,
        deleteExercise,
    } = useWorkouts();

    const [loading, setLoading] = useState(true);

    // ── Add-exercise form state ────────────────────────────────────────
    const [name, setName] = useState('');
    const [muscleGroupId, setMuscleGroupId] = useState<string>('');
    const [tracksTime, setTracksTime] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Add-muscle-group inline state ──────────────────────────────────
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupSubmitting, setNewGroupSubmitting] = useState(false);

    // ── Global search across all groups' exercises ─────────────────────
    const [query, setQuery] = useState('');

    // Pre-load every group's exercises so the list view is populated.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await Promise.all(muscleGroups.map((g) => getExercises(g.id)));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [muscleGroups, getExercises]);

    // Default the muscle-group select to the first one once the catalog loads.
    useEffect(() => {
        if (!muscleGroupId && muscleGroups[0]) setMuscleGroupId(muscleGroups[0].id);
    }, [muscleGroups, muscleGroupId]);

    const totalExercises = useMemo(
        () => Object.values(exercisesByGroup).reduce((sum, list) => sum + list.length, 0),
        [exercisesByGroup]
    );

    // Build a filtered, per-group view of the catalog whenever the
    // search query changes. Groups whose entire list is filtered out
    // are hidden, so big catalogs collapse down to just the matches.
    const filteredGroupsView = useMemo(() => {
        const q = query.trim().toLowerCase();
        return muscleGroups
            .map((group) => {
                const all = exercisesByGroup[group.id] || [];
                const list = q
                    ? all.filter((ex) => ex.name.toLowerCase().includes(q))
                    : all;
                return { group, list, hiddenByFilter: q !== '' && list.length === 0 };
            })
            .filter((row) => (q ? !row.hiddenByFilter : true));
    }, [muscleGroups, exercisesByGroup, query]);

    const matchCount = useMemo(
        () => filteredGroupsView.reduce((sum, r) => sum + r.list.length, 0),
        [filteredGroupsView]
    );

    async function handleCreate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.warn('Give the exercise a name.');
            return;
        }
        if (!muscleGroupId) {
            toast.warn('Pick a muscle group.');
            return;
        }
        setSubmitting(true);
        try {
            const created = await createExercise({
                name: trimmed,
                muscleGroupId,
                tracksTime,
            });
            toast.success(`Added "${created.name}"`);
            setName('');
            setTracksTime(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add exercise');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCreateGroup(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmed = newGroupName.trim();
        if (!trimmed) {
            toast.warn('Give the muscle group a name.');
            return;
        }
        setNewGroupSubmitting(true);
        try {
            const created = await createMuscleGroup({ name: trimmed });
            toast.success(`Added muscle group "${created.name}"`);
            setNewGroupName('');
            setShowNewGroup(false);
            setMuscleGroupId(created.id);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add muscle group');
        } finally {
            setNewGroupSubmitting(false);
        }
    }

    async function handleDelete(exercise: Exercise) {
        if (
            !window.confirm(
                `Delete "${exercise.name}"? This only works if it hasn't been used in any workout.`
            )
        ) {
            return;
        }
        try {
            await deleteExercise(exercise.id);
            toast.success(`Deleted "${exercise.name}"`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete exercise');
        }
    }

    return (
        <div className="page">
            <div className="page-toolbar">
                <Link to="/" className="btn btn-ghost">
                    ← Back
                </Link>
                <div className="muted small">
                    {muscleGroups.length} muscle group{muscleGroups.length === 1 ? '' : 's'} •{' '}
                    {totalExercises} exercise{totalExercises === 1 ? '' : 's'}
                </div>
            </div>

            <h1>Manage exercises</h1>
            <p className="muted">
                Add any exercise that's missing from the catalog. New entries become
                available immediately in the "Add workout" flow for every user.
            </p>

            {/* ── Add exercise form ───────────────────────────────────────── */}
            <form className="card admin-form" onSubmit={handleCreate}>
                <h2>Add a new exercise</h2>

                <label className="field">
                    <span>Exercise name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Cable Crossover (Low to High)"
                        maxLength={80}
                        required
                    />
                </label>

                <div className="admin-form-row">
                    <label className="field" style={{ flex: 1 }}>
                        <span>Muscle group</span>
                        <select
                            className="admin-select"
                            value={muscleGroupId}
                            onChange={(e) => setMuscleGroupId(e.target.value)}
                            required
                        >
                            {muscleGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowNewGroup((s) => !s)}
                    >
                        {showNewGroup ? 'Cancel' : '+ New group'}
                    </button>
                </div>

                {showNewGroup && (
                    <div className="admin-subform" role="group" aria-label="New muscle group">
                        <form className="admin-form-row" onSubmit={handleCreateGroup}>
                            <label className="field" style={{ flex: 1 }}>
                                <span>New muscle group name</span>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g. Lower Back"
                                    maxLength={80}
                                />
                            </label>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={newGroupSubmitting}
                            >
                                {newGroupSubmitting ? 'Saving…' : 'Add group'}
                            </button>
                        </form>
                    </div>
                )}

                <label className="checkbox-field">
                    <input
                        type="checkbox"
                        checked={tracksTime}
                        onChange={(e) => setTracksTime(e.target.checked)}
                    />
                    <span>
                        <strong>Time-based</strong> — logged with minutes &amp; seconds instead
                        of reps × weight (use for cardio, planks, dead hangs, farmer's carries,
                        etc.)
                    </span>
                </label>

                <div className="actions-row">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                        {submitting ? 'Adding…' : '+ Add exercise'}
                    </button>
                </div>
            </form>

            {/* ── Existing exercises, grouped by muscle ─────────────────── */}
            <div className="admin-list">
                <h2>Existing exercises</h2>

                {!loading && muscleGroups.length > 0 && (
                    <div className="search-bar">
                        <input
                            type="search"
                            className="search-input"
                            placeholder={`Search ${totalExercises} exercise${totalExercises === 1 ? '' : 's'} across all groups…`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search exercises"
                        />
                        {query && (
                            <button
                                type="button"
                                className="search-clear"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                title="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                {query && !loading && (
                    <p className="muted small">
                        {matchCount === 0
                            ? `No exercises match "${query}".`
                            : `${matchCount} match${matchCount === 1 ? '' : 'es'} across ${filteredGroupsView.length} group${filteredGroupsView.length === 1 ? '' : 's'}.`}
                    </p>
                )}

                {loading ? (
                    <Spinner size={28} label="Loading exercises…" />
                ) : muscleGroups.length === 0 ? (
                    <p className="muted">No muscle groups yet — add one above.</p>
                ) : (
                    filteredGroupsView.map(({ group, list }) => (
                        <AdminGroupBlock
                            key={group.id}
                            group={group}
                            exercises={list}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface AdminGroupBlockProps {
    group: MuscleGroup;
    exercises: Exercise[];
    onDelete: (ex: Exercise) => void;
}

function AdminGroupBlock({ group, exercises, onDelete }: AdminGroupBlockProps) {
    return (
        <section className="card admin-group">
            <header className="admin-group-head">
                <h3>{group.name}</h3>
                <span className="muted small">
                    {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
                </span>
            </header>
            {exercises.length === 0 ? (
                <p className="muted small">No exercises yet for this group.</p>
            ) : (
                <ul className="admin-exercise-list">
                    {exercises.map((ex) => (
                        <li key={ex.id} className="admin-exercise-row">
                            <div className="admin-exercise-name">
                                {ex.name}
                                {ex.tracksTime && (
                                    <span className="chip chip-time" title="Logged in minutes:seconds">
                                        Time
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onDelete(ex)}
                                title="Delete this exercise (only if unused)"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}