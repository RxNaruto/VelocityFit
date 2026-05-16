interface MuscleIconProps {
    slug: string;
    size?: number;
}


/**
 * Lightweight inline SVG icon set for the 8 seeded muscle groups.
 * Slugs come straight from the backend `seedData.ts`: chest, back, legs,
 * shoulders, biceps, triceps, core, cardio.
 */
export default function MuscleIcon({ slug, size = 26 }: MuscleIconProps) {
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
      case 'chest':
        return (
          <svg {...common}>
            <path d="M3 9c0-1 .8-2 2-2h4l2 2h2l2-2h4c1.2 0 2 1 2 2v3c0 3-2.5 5-5.5 5h-1c-1 0-1.5-.6-1.5-1.5v-1c0-.5-.5-1-1-1s-1 .5-1 1v1c0 .9-.5 1.5-1.5 1.5h-1C5.5 17 3 15 3 12V9z" />
          </svg>
        );
      case 'back':
        return (
          <svg {...common}>
            <path d="M12 3v18" />
            <path d="M5 7l7-3 7 3" />
            <path d="M5 13l7-3 7 3" />
            <path d="M5 19l7-3 7 3" />
          </svg>
        );
      case 'legs':
        return (
          <svg {...common}>
            <path d="M9 3h6v5l-2 6 1 7h-3l-1-7-2-6V3z" />
            <path d="M9 3h6" />
            <path d="M11 22h-3" />
          </svg>
        );
      case 'shoulders':
        return (
          <svg {...common}>
            <circle cx="12" cy="6" r="3" />
            <path d="M3 14c2.5-3 5.5-4 9-4s6.5 1 9 4" />
            <path d="M5 20l7-2 7 2" />
          </svg>
        );
      case 'biceps':
        return (
          <svg {...common}>
            <path d="M4 13c1-3 4-5 8-5 3 0 5 1 7 3l-2 3c-1-1-3-2-5-2-3 0-5 2-5 5H4z" />
            <path d="M9 14c1-1 2-1 3-1" />
          </svg>
        );
      case 'triceps':
        return (
          <svg {...common}>
            <path d="M3 9c2-2 5-3 8-3 4 0 6 2 9 4v5c-2 2-5 3-9 3-3 0-6-1-8-3" />
            <path d="M9 12l3-3 3 3" />
          </svg>
        );
      case 'core':
        return (
          <svg {...common}>
            <rect x="6" y="3" width="12" height="18" rx="3" />
            <path d="M6 9h12" />
            <path d="M6 15h12" />
            <path d="M12 3v18" />
          </svg>
        );
      case 'cardio':
        return (
          <svg {...common}>
            <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
            <path d="M3 12h3l1.5-2.5L10 14l1.5-3" />
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