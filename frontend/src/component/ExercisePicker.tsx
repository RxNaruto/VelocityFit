import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import Spinner from './Spinner';
import type { Exercise } from '../types';

interface ExercisePickerProps {
    muscleGroupId: string;
    onPick: (exercise: Exercise) => void;
}

export default function ExercisePicker({ muscleGroupId, onPick }: ExercisePickerProps) {
    const { getExercises, muscleGroupLookup } = useWorkouts();
    const [exercises, setExercises] = useState<Exercise[] | null>(null);
    // Free-text filter, case-insensitive substring match against the name.
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        setExercises(null);
        // Reset the search when switching muscle groups so the previous
        // group's query doesn't accidentally hide every option here.
        setQuery('');
        getExercises(muscleGroupId)
            .then((list) => {
                if (!cancelled) setExercises(list);
            })
            .catch((err: Error) => {
                if (!cancelled) toast.error(err.message || 'Failed to load exercises');
            });
        return () => {
            cancelled = true;
        };
    }, [muscleGroupId, getExercises]);

    const filtered = useMemo(() => {
        if (!exercises) return [];
        const q = query.trim().toLowerCase();
        if (!q) return exercises;
        return exercises.filter((ex) => ex.name.toLowerCase().includes(q));
    }, [exercises, query]);

    const trimmedQuery = query.trim();

    if (!exercises) return <Spinner size={28} label="Loading exercises..." />;

    const groupName = muscleGroupLookup[muscleGroupId]?.name || 'this group';

    // Empty group: nudge the user to the catalog manager. Creating new
    // exercises is intentionally consolidated there -- there is exactly
    // one entry point in the app for adding to the catalog.
    if (exercises.length === 0) {
        return (
            <div className="empty-picker">
                <p className="muted">No exercises in {groupName} yet.</p>
                <ManageCatalogHint />
            </div>
        );
    }

    return (
        <>
            <div className="search-bar">
                <input
                    type="search"
                    className="search-input"
                    placeholder={`Search ${exercises.length} exercise${exercises.length === 1 ? '' : 's'}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search exercises"
                    autoFocus
                />
                {query && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        title="Clear search"
                    >
                        x
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-picker">
                    <p className="muted">No exercises match &quot;{trimmedQuery}&quot;.</p>
                    <ManageCatalogHint />
                </div>
            ) : (
                <ul className="exercise-list">
                    {filtered.map((ex) => (
                        <li key={ex.id}>
                            <button type="button" className="exercise-row" onClick={() => onPick(ex)}>
                                <span>{ex.name}</span>
                                <span className="chev">&gt;</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

/**
 * Friendly pointer to the catalog manager. Used everywhere the picker
 * would otherwise be empty, so the user always has a single, obvious
 * path to add a missing exercise.
 */
function ManageCatalogHint() {
    return (
        <div className="picker-catalog-hint">
            <p className="muted small">
                Can&apos;t find an exercise? Add new ones from the home page.
            </p>
            <Link to="/admin/exercises" className="btn btn-ghost btn-sm">
                Manage exercises
            </Link>
        </div>
    );
}