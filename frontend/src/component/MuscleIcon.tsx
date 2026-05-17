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
    case 'triceps':
      return (
        <svg {...common}>
          <path d="M3 9c2-2 5-3 8-3 4 0 6 2 9 4v5c-2 2-5 3-9 3-3 0-6-1-8-3" />
          <path d="M9 12l3-3 3 3" />
        </svg>
      );
    case 'traps':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="2" />
          <path d="M4 14c2-4 5-6 8-6s6 2 8 6" />
          <path d="M4 14l3 5" />
          <path d="M20 14l-3 5" />
          <path d="M9 14l3 4 3-4" />
        </svg>
      );
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
    case 'full-body':
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="2.5" />
          <path d="M5 9h14" />
          <path d="M12 9v8" />
          <path d="M9 17l-2 5" />
          <path d="M15 17l2 5" />
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