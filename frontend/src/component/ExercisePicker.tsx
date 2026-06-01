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
    const { getExercises, createExercise, muscleGroupLookup } = useWorkouts();
    const [exercises, setExercises] = useState<Exercise[] | null>(null);
    // Free-text filter, case-insensitive substring match against the name.
    const [query, setQuery] = useState('');
    // True while a "+ Add as new exercise" call is in flight, so we can
    // disable the button and avoid double-submits.
    const [creating, setCreating] = useState(false);
    // Time-based vs strength toggle for the inline create flow. Defaults
    // to false (strength) which is the overwhelmingly common case.
    const [createTracksTime, setCreateTracksTime] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setExercises(null);
        // Reset the search when switching muscle groups so the previous
        // group's query doesn't accidentally hide every option here.
        setQuery('');
        setCreateTracksTime(false);
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
    // Detect a perfect (case-insensitive) match in the *full* list -- not
    // just the filtered slice -- so we never offer to create something the
    // user already has, even if it would also match a substring of others.
    const exactMatch = useMemo(() => {
        if (!trimmedQuery || !exercises) return null;
        const lower = trimmedQuery.toLowerCase();
        return exercises.find((ex) => ex.name.toLowerCase() === lower) || null;
    }, [exercises, trimmedQuery]);

    async function handleCreateInline() {
        const name = trimmedQuery;
        if (!name) return;
        if (creating) return;
        setCreating(true);
        try {
            const created = await createExercise({
                name,
                muscleGroupId,
                tracksTime: createTracksTime,
            });
            // Refresh local copy from context -- the context already merged
            // it into the right bucket, so re-fetching the cached list is
            // free.
            const refreshed = await getExercises(muscleGroupId);
            setExercises(refreshed);
            toast.success(`Added "${created.name}"`);
            // Jump straight into logging it -- that's almost always what the
            // user wanted when they typed a missing name.
            onPick(created);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add exercise');
        } finally {
            setCreating(false);
        }
    }

    if (!exercises) return <Spinner size={28} label="Loading exercises..." />;

    const groupName = muscleGroupLookup[muscleGroupId]?.name || 'this group';

    // Empty group + no search yet: offer the "first exercise" fast path.
    if (exercises.length === 0 && !trimmedQuery) {
        return (
            <div className="empty-picker">
                <p className="muted">No exercises in {groupName} yet.</p>
                <CreateExerciseInline
                    placeholder={`e.g. Add a ${groupName.toLowerCase()} exercise`}
                    query={query}
                    onQueryChange={setQuery}
                    tracksTime={createTracksTime}
                    onTracksTimeChange={setCreateTracksTime}
                    creating={creating}
                    canCreate={Boolean(trimmedQuery)}
                    onCreate={handleCreateInline}
                />
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
                    <CreateExerciseInline
                        placeholder={`Add "${trimmedQuery}" to ${groupName}`}
                        query={query}
                        onQueryChange={setQuery}
                        tracksTime={createTracksTime}
                        onTracksTimeChange={setCreateTracksTime}
                        creating={creating}
                        canCreate={!!trimmedQuery && !exactMatch}
                        onCreate={handleCreateInline}
                    />
                </div>
            ) : (
                <>
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
                    {/* Even when there are matches, surface the "create" affordance
                        when the user typed something that no existing exercise
                        matches *exactly* -- handles the case where they're scrolling
                        through near-matches but actually want a new one. */}
                    {trimmedQuery && !exactMatch && (
                        <CreateExerciseInline
                            placeholder={`Don't see it? Add "${trimmedQuery}"`}
                            query={query}
                            onQueryChange={setQuery}
                            tracksTime={createTracksTime}
                            onTracksTimeChange={setCreateTracksTime}
                            creating={creating}
                            canCreate
                            onCreate={handleCreateInline}
                            compact
                        />
                    )}
                </>
            )}
        </>
    );
}

interface CreateExerciseInlineProps {
    placeholder: string;
    query: string;
    onQueryChange: (next: string) => void;
    tracksTime: boolean;
    onTracksTimeChange: (next: boolean) => void;
    creating: boolean;
    canCreate: boolean;
    onCreate: () => void;
    /** Compact variant: rendered below the matched list, no separate name field
     *  (the search input is the source of truth). */
    compact?: boolean;
}

/**
 * Inline "+ Add new exercise" affordance shown when the user's search
 * doesn't match any existing exercise. In compact mode it's a single
 * button bar (since the search input is already on screen); in the
 * standalone mode it includes its own name input for the empty-group
 * "first exercise" fast path.
 */
function CreateExerciseInline({
    placeholder,
    query,
    onQueryChange,
    tracksTime,
    onTracksTimeChange,
    creating,
    canCreate,
    onCreate,
    compact = false,
}: CreateExerciseInlineProps) {
    return (
        <div className={`create-exercise-inline${compact ? ' is-compact' : ''}`}>
            {!compact && (
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    aria-label="New exercise name"
                    maxLength={80}
                />
            )}
            <label className="create-exercise-time">
                <input
                    type="checkbox"
                    checked={tracksTime}
                    onChange={(e) => onTracksTimeChange(e.target.checked)}
                />
                <span>
                    Time-based <span className="muted small">(cardio, plank, etc.)</span>
                </span>
            </label>
            <button
                type="button"
                className="btn btn-primary"
                disabled={!canCreate || creating}
                onClick={onCreate}
                title={canCreate ? placeholder : 'Type a name first'}
            >
                {creating ? 'Adding...' : compact ? `+ Add "${query.trim()}"` : '+ Add exercise'}
            </button>
        </div>
    );
}