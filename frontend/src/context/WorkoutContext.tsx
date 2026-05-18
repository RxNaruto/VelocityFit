import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { api } from '../services/api';
import type {
    EntryDraft,
    Exercise,
    MuscleGroup,
    NewExercisePayload,
    NewMuscleGroupPayload,
    UpdateExercisePayload,
    Workout,
} from '../types';

interface WorkoutContextValue {
    muscleGroups: MuscleGroup[];
    muscleGroupLookup: Record<string, MuscleGroup>;
    exercisesByGroup: Record<string, Exercise[]>;
    exerciseLookup: Record<string, Exercise>;
    workoutsByDate: Record<string, Workout>;
    loading: boolean;
    error: string | null;
    getExercises: (muscleGroupId: string) => Promise<Exercise[]>;
    saveToday: (entries: EntryDraft[]) => Promise<Workout>;
    refreshDate: (dateKey: string) => Promise<Workout | null>;
    // Catalog mutations used by the "Manage exercises" portal.
    createMuscleGroup: (payload: NewMuscleGroupPayload) => Promise<MuscleGroup>;
    createExercise: (payload: NewExercisePayload) => Promise<Exercise>;
    updateExercise: (id: string, patch: UpdateExercisePayload) => Promise<Exercise>;
    deleteExercise: (id: string) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
    const [exercisesByGroup, setExercisesByGroup] = useState<Record<string, Exercise[]>>({});
    const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, Workout>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCatalog = useCallback(async () => {
        const groups = await api.getMuscleGroups();
        setMuscleGroups(groups);
    }, []);

    const loadAllWorkouts = useCallback(async () => {
        const list = await api.listWorkouts();
        const map: Record<string, Workout> = {};
        list.forEach((w) => {
            map[w.date] = w;
        });
        setWorkoutsByDate(map);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                await Promise.all([loadCatalog(), loadAllWorkouts()]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load workouts');
            } finally {
                setLoading(false);
            }
        })();
    }, [loadCatalog, loadAllWorkouts]);

    const getExercises = useCallback(
        async (muscleGroupId: string): Promise<Exercise[]> => {
            if (exercisesByGroup[muscleGroupId]) return exercisesByGroup[muscleGroupId];
            const list = await api.getExercises(muscleGroupId);
            setExercisesByGroup((prev) => ({ ...prev, [muscleGroupId]: list }));
            return list;
        },
        [exercisesByGroup]
    );

    const exerciseLookup = useMemo(() => {
        const lookup: Record<string, Exercise> = {};
        Object.values(exercisesByGroup).forEach((list) =>
            list.forEach((ex) => {
                lookup[ex.id] = ex;
            })
        );
        return lookup;
    }, [exercisesByGroup]);

    const muscleGroupLookup = useMemo(() => {
        const lookup: Record<string, MuscleGroup> = {};
        muscleGroups.forEach((g) => {
            lookup[g.id] = g;
        });
        return lookup;
    }, [muscleGroups]);

    const saveToday = useCallback(async (entries: EntryDraft[]): Promise<Workout> => {
        const saved = await api.saveTodayWorkout(entries);
        setWorkoutsByDate((prev) => ({ ...prev, [saved.date]: saved }));
        return saved;
    }, []);

    const refreshDate = useCallback(async (dateKey: string): Promise<Workout | null> => {
        const w = await api.getWorkoutByDate(dateKey);
        setWorkoutsByDate((prev) => {
            const next = { ...prev };
            if (w) next[dateKey] = w;
            else delete next[dateKey];
            return next;
        });
        return w;
    }, []);

    const createMuscleGroup = useCallback(
        async (payload: NewMuscleGroupPayload): Promise<MuscleGroup> => {
            const created = await api.createMuscleGroup(payload);
            setMuscleGroups((prev) =>
                [...prev.filter((g) => g.id !== created.id), created].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            );
            // Pre-warm an empty bucket so the picker shows the new group.
            setExercisesByGroup((prev) => ({ ...prev, [created.id]: prev[created.id] || [] }));
            return created;
        },
        []
    );

    const createExercise = useCallback(
        async (payload: NewExercisePayload): Promise<Exercise> => {
            const created = await api.createExercise(payload);
            setExercisesByGroup((prev) => {
                const list = prev[created.muscleGroupId] || [];
                const next = [...list.filter((e) => e.id !== created.id), created].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                return { ...prev, [created.muscleGroupId]: next };
            });
            return created;
        },
        []
    );

    const updateExercise = useCallback(
        async (id: string, patch: UpdateExercisePayload): Promise<Exercise> => {
            const updated = await api.updateExercise(id, patch);
            setExercisesByGroup((prev) => {
                // Drop the old row from every bucket — its group may have changed —
                // then insert it into the (possibly new) target group's bucket.
                const next: Record<string, Exercise[]> = {};
                for (const [groupId, list] of Object.entries(prev)) {
                    next[groupId] = list.filter((e) => e.id !== id);
                }
                const target = updated.muscleGroupId;
                const targetList = next[target] || [];
                next[target] = [...targetList, updated].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                return next;
            });
            return updated;
        },
        []
    );

    const deleteExercise = useCallback(async (id: string): Promise<void> => {
        await api.deleteExercise(id);
        setExercisesByGroup((prev) => {
            const next: Record<string, Exercise[]> = {};
            for (const [groupId, list] of Object.entries(prev)) {
                next[groupId] = list.filter((e) => e.id !== id);
            }
            return next;
        });
    }, []);

    const value: WorkoutContextValue = {
        muscleGroups,
        muscleGroupLookup,
        exercisesByGroup,
        exerciseLookup,
        workoutsByDate,
        loading,
        error,
        getExercises,
        saveToday,
        refreshDate,
        createMuscleGroup,
        createExercise,
        updateExercise,
        deleteExercise,
    };

    return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkouts(): WorkoutContextValue {
    const ctx = useContext(WorkoutContext);
    if (!ctx) throw new Error('useWorkouts must be used inside <WorkoutProvider>');
    return ctx;
}