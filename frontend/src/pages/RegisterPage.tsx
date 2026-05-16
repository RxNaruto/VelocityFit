import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface RegisterForm {
  username: string;
  name: string;
  password: string;
  profilePhotoUrl: string;
}

export default function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    username: '',
    name: '',
    password: '',
    profilePhotoUrl: '',
  });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  function set<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signUp({
        username: form.username.trim(),
        name: form.name.trim(),
        password: form.password,
        profilePhotoUrl: form.profilePhotoUrl.trim(),
      });
      toast.success(`Welcome, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">V</span>
          <h1>Join VELOCITY FIT</h1>
          <p className="muted">Start tracking your workouts in seconds.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.\-]{3,30}"
              title="3-30 chars: letters, numbers, _ . -"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              maxLength={60}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label className="field">
            <span>
              Profile photo URL <em className="muted small">(optional)</em>
            </span>
            <input
              type="url"
              placeholder="https://..."
              value={form.profilePhotoUrl}
              onChange={(e) => set('profilePhotoUrl', e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}