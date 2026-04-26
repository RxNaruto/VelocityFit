import type { CSSProperties } from 'react';

interface AvatarUser {
    username?: string;
    name?: string;
    profilePhotoUrl?: string;
}

interface AvatarProps {
    user?: AvatarUser | null;
    size?: number;
    photoUrl?: string;
}

function initials(name = ''): string {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PALETTE: Array<[string, string]> = [
    ['#6366f1', '#22d3ee'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#06b6d4'],
    ['#ec4899', '#8b5cf6'],
    ['#22c55e', '#84cc16'],
    ['#3b82f6', '#a855f7'],
];

function pickGradient(seed = ''): [string, string] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % PALETTE.length;
    return PALETTE[idx];
}

export default function Avatar({ user, size = 40, photoUrl }: AvatarProps) {
    const url = photoUrl ?? user?.profilePhotoUrl ?? '';
    const seed = user?.username || user?.name || '';
    const [c1, c2] = pickGradient(seed);
    const style: CSSProperties = {
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.08)',
    };
    if (url) {
        return (
            <div className="avatar" style={style}>
                <img
                    src={url}
                    alt={user?.name || 'Avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                />
            </div>
        );
    }
    return (
        <div className="avatar" style={style} aria-label={user?.name || 'Avatar'}>
            {initials(user?.name || user?.username)}
        </div>
    );
}