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
]);

/**
 * Inline icon set for muscle groups. PNG silhouettes for the 6 main groups
 * (chest, back, legs, shoulders, biceps, core), inline SVG for everything
 * else (triceps, cardio, forearms, glutes, calves, full-body, …).
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
    case 'cardio':
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
          <path d="M3 12h3l1.5-2.5L10 14l1.5-3" />
        </svg>
      );
    case 'forearms':
      return (
        <svg {...common}>
          <path d="M6 4c1 4 2 7 4 9l-3 7h3l4-7c2-2 3-5 4-9" />
          <circle cx="11" cy="20" r="1.4" />
        </svg>
      );
    case 'glutes':
      return (
        <svg {...common}>
          <path d="M4 13c0-3 2-6 8-6s8 3 8 6c0 4-2 7-5 7-2 0-2-1-3-1s-1 1-3 1c-3 0-5-3-5-7z" />
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