import { useWorkouts } from '../context/WorkoutContext';
import MuscleIcon from './MuscleIcon';
import type { MuscleGroup } from '../types';

interface MuscleGroupPickerProps {
  onPick: (group: MuscleGroup) => void;
}

export default function MuscleGroupPicker({ onPick }: MuscleGroupPickerProps) {
  const { muscleGroups } = useWorkouts();
  return (
    <ul className="muscle-list">
      {muscleGroups.map((g) => (
        <li key={g.id}>
          <button
            type="button"
            className="muscle-row"
            onClick={() => onPick(g)}
            aria-label={`Pick ${g.name}`}
          >
            <span className="muscle-row-icon" aria-hidden="true">
              <MuscleIcon slug={g.slug} />
            </span>
            <span className="muscle-row-name">{g.name}</span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}