import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useWorkouts } from '../context/WorkoutContext';
import Spinner from './Spinner';
import type { Exercise } from '../types';

interface ExercisePickerProps {
    muscleGroupId: string;
    onPick: (exercise: Exercise) => void;
}

export default function ExercisePicker({ muscleGroupId, onPick }: ExercisePickerProps) {
    const { getExercises } = useWorkouts();
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

    if (!exercises) return <Spinner size={28} label="Loading exercises…" />;
    if (exercises.length === 0) {
        return <p className="muted">No exercises in this group yet.</p>;
    }

    return (
        <>
            <div className="search-bar">
                <input
                    type="search"
                    className="search-input"
                    placeholder={`Search ${exercises.length} exercise${exercises.length === 1 ? '' : 's'}…`}
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
                        ×
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <p className="muted">No exercises match &quot;{query}&quot;.</p>
            ) : (
                <ul className="exercise-list">
                    {filtered.map((ex) => (
                        <li key={ex.id}>
                            <button type="button" className="exercise-row" onClick={() => onPick(ex)}>
                                <span>{ex.name}</span>
                                <span className="chev">›</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}