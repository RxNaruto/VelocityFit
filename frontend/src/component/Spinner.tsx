interface SpinnerProps {
    size?: number;
    inline?: boolean;
    label?: string | null;
}

/**
 * Tiny CSS-only loading spinner. Use it inline inside buttons (set inline=true)
 * or as a centered overlay for page-level loads (default block layout).
 */
export default function Spinner({ size = 18, inline = false, label = null }: SpinnerProps) {
    const sizePx = `${size}px`;
    const ring = (
        <span
            className="spinner-ring"
            style={{
                width: sizePx,
                height: sizePx,
                borderWidth: Math.max(2, Math.round(size / 9)) + 'px',
            }}
            role="status"
            aria-label={label ?? 'Loading'}
        />
    );
    if (inline) return ring;
    return (
        <div className="spinner-block" role="status" aria-live="polite">
            {ring}
            {label && <span className="spinner-label">{label}</span>}
        </div>
    );
}