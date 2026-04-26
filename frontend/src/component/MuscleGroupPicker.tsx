import { useWorkouts } from '../context/WorkoutContext';
import type { MuscleGroup } from '../types';

interface MuscleGroupPickerProps {
    onPick: (group: MuscleGroup) => void;
}

export default function MuscleGroupPicker({ onPick }: MuscleGroupPickerProps) {
    const { muscleGroups } = useWorkouts();
    return (
        <div className="grid-tiles">
            {muscleGroups.map((g) => (
                <button key={g.id} type="button" className="tile" onClick={() => onPick(g)}>
                    <span className="tile-title">{g.name}</span>
                </button>
            ))}
        </div>
    );
}