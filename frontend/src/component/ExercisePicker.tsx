import { useEffect, useState } from 'react';
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

    useEffect(() => {
        let cancelled = false;
        setExercises(null);
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

    if (!exercises) return <Spinner size={28} label="Loading exercises…" />;
    if (exercises.length === 0) {
        return <p className="muted">No exercises in this group yet.</p>;
    }

    return (
        <ul className="exercise-list">
            {exercises.map((ex) => (
                <li key={ex.id}>
                    <button type="button" className="exercise-row" onClick={() => onPick(ex)}>
                        <span>{ex.name}</span>
                        <span className="chev">›</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}