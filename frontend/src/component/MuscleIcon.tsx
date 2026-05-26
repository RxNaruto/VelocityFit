interface MuscleIconProps {
  slug: string;
  size?: number;
}

// Slugs that ship as PNG silhouettes in `public/icons/`. The CSS rule
// `.muscle-row-icon img` recolors them to fit the red/black theme.
const PNG_SLUGS = new Set([
  'chest',
  'back',
  'legs',
  'shoulders',
  'biceps',
  'core',
  'cardio',
  'glutes',
  'triceps',
  'traps',
  'full-body',
  'forearms'
]);

/**
 * Inline icon set for muscle groups. PNG silhouettes for the 8 main groups
 * (chest, back, legs, shoulders, biceps, core, cardio, glutes), inline SVG
 * for everything else (triceps, forearms, calves, full-body, traps, …).
 */
export default function MuscleIcon({ slug, size = 28 }: MuscleIconProps) {
  if (PNG_SLUGS.has(slug)) {
    return (
      <img
        src={`/icons/${slug}.png`}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="muscle-icon-img"
      />
    );
  }

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (slug) {
    case 'forearms':
      return (
        <svg {...common}>
          <path d="M6 4c1 4 2 7 4 9l-3 7h3l4-7c2-2 3-5 4-9" />
          <circle cx="11" cy="20" r="1.4" />
        </svg>
      );
    case 'calves':
      return (
        <svg {...common}>
          <path d="M11 3v4c0 3 3 4 3 8s-3 5-3 7v1" />
          <path d="M11 7c-3 1-4 4-3 8 1 3 1 5 1 6" />
        </svg>
      );
    
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}