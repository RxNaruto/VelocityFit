interface BrandMarkProps {
    /** Visual size of the round logo plate in pixels. */
    size?: 'sm' | 'md' | 'lg';
    /** Extra class hooks to keep page-specific tweaks (auth screens, hero…). */
    className?: string;
}

/**
 * Brand mark for VELOCITY FIT. Renders the panther logo on a red plate.
 * Used in the header, auth pages, and the home hero — single source of truth
 * so the brand stays consistent everywhere.
 */
export default function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
    const sizeClass =
        size === 'lg' ? 'brand-mark-lg' : size === 'sm' ? 'brand-mark-sm' : '';
    return (
        <span className={`brand-mark ${sizeClass} ${className}`.trim()} aria-hidden="true">
            <img
                src="/icons/logo.png"
                alt=""
                aria-hidden="true"
                className="brand-mark-img"
                draggable={false}
            />
        </span>
    );
}