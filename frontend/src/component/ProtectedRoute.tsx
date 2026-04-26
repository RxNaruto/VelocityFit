import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, bootstrapping } = useAuth();
    const location = useLocation();

    if (bootstrapping) {
        return <div className="loading">Loading…</div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <>{children}</>;
}
