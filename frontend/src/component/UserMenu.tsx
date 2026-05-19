import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function UserMenu() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    if (!user) return null;

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Avatar user={user} size={32} />
                <span className="user-menu-name">{user.name}</span>
                <span className="chev-down" aria-hidden="true">
                    ▾
                </span>
            </button>
            {open && (
                <div className="user-menu-dropdown" role="menu">
                    <div className="user-menu-header">
                        <Avatar user={user} size={44} />
                        <div>
                            <div className="user-menu-fullname">{user.name}</div>
                            <div className="muted small">@{user.username}</div>
                        </div>
                    </div>
                    <Link
                        to="/profile"
                        className="user-menu-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                    >
                        Profile
                    </Link>
                    <Link
                        to="/"
                        className="user-menu-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                    >
                        Calendar
                    </Link>
                    <Link
                        to="/add?step=pickGroup"
                        className="user-menu-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                    >
                        + Add exercise
                    </Link>
                    <Link
                        to="/admin/exercises"
                        className="user-menu-item"
                        onClick={() => setOpen(false)}
                        role="menuitem"
                    >
                        Manage exercises
                    </Link>
                    <button
                        type="button"
                        className="user-menu-item user-menu-item-danger"
                        onClick={async () => {
                            setOpen(false);
                            await signOut();
                            toast.info('Signed out');
                            navigate('/login', { replace: true });
                        }}
                        role="menuitem"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}