import { useEffect, useRef } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomePage from './pages/HomePage';
import WorkoutDayPage from './pages/WorkoutDayPage';
import AddWorkoutPage from './pages/AddWorkoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import UserProfilePage from './pages/UserProfilePage';
import ProtectedRoute from './component/ProtectedRoute';
import UserMenu from './component/UserMenu';
import Spinner from './component/Spinner';
import { useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkouts } from './context/WorkoutContext';

export default function App() {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();
  const onAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-shell">
      {!onAuthPage && (
        <header className="app-header">
          <Link to={isAuthenticated ? '/' : '/login'} className="brand">
            <span className="brand-mark">V</span>
            <span className="brand-name">VELOCITY FIT</span>
          </Link>
          {isAuthenticated && (
            <nav className="app-nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Home
              </NavLink>
              <NavLink
                to="/leaderboard"
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                Leaderboard
              </NavLink>
            </nav>
          )}
          {isAuthenticated && <UserMenu />}
        </header>
      )}

      <main className={onAuthPage ? 'app-main app-main-auth' : 'app-main'}>
        {bootstrapping ? (
          <div className="loading">
            <Spinner size={32} label="Loading…" />
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <WorkoutProvider>
                    <ProtectedShell />
                  </WorkoutProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </main>

      {!onAuthPage && (
        <footer className="app-footer">
          <small>VELOCITY FIT • Rithk Chaudhary.</small>
        </footer>
      )}
    </div>
  );
}

function ProtectedShell() {
  const { loading, error } = useWorkouts();
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && lastErrorRef.current !== error) {
      toast.error(error);
      lastErrorRef.current = error;
    }
  }, [error]);

  if (loading)
    return (
      <div className="loading">
        <Spinner size={32} label="Loading your workouts…" />
      </div>
    );
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/day/:date" element={<WorkoutDayPage />} />
      <Route path="/add" element={<AddWorkoutPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/u/:username" element={<UserProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}