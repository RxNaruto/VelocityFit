import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { api, setAuthToken, setOnUnauthorized } from '../services/api';
import type { LoginPayload, RegisterPayload, User } from '../types';

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    bootstrapping: boolean;
    signIn: (payload: LoginPayload) => Promise<User>;
    signUp: (payload: RegisterPayload) => Promise<User>;
    signOut: (opts?: { silent?: boolean }) => Promise<void>;
    refreshUser: () => Promise<User>;
    updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'gt_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => {
        // Hydrate the API module BEFORE the first render so any child component
        // that fires a request in its mount effect already has the auth header.
        const stored = localStorage.getItem(TOKEN_KEY) || null;
        setAuthToken(stored);
        return stored;
    });
    const [user, setUser] = useState<User | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    const signOut = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!silent) {
            try {
                await api.logout();
            } catch {
                /* ignore — token may already be invalid */
            }
        }
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
    }, []);

    // Sync token <-> api client + storage
    useEffect(() => {
        setAuthToken(token);
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    }, [token]);

    // Auto sign-out on 401 from any API call
    useEffect(() => {
        setOnUnauthorized(() => {
            signOut({ silent: true });
        });
        return () => setOnUnauthorized(null);
    }, [signOut]);

    // On boot: if we have a token, fetch current user
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!token) {
                setBootstrapping(false);
                return;
            }
            try {
                const me = await api.me();
                if (!cancelled) setUser(me);
            } catch {
                if (!cancelled) {
                    localStorage.removeItem(TOKEN_KEY);
                    setAuthToken(null);
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) setBootstrapping(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // We only want this to run on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signIn = useCallback(async ({ username, password }: LoginPayload) => {
        const res = await api.login({ username, password });
        // CRITICAL: set the API token + storage SYNCHRONOUSLY before any state
        // update. Otherwise children that mount in the same render (e.g.
        // WorkoutProvider) fire their bootstrap requests before the [token]
        // effect runs and the requests go out without the auth header.
        setAuthToken(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const signUp = useCallback(async (payload: RegisterPayload) => {
        const res = await api.register(payload);
        setAuthToken(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
    }, []);

    const refreshUser = useCallback(async () => {
        const me = await api.me();
        setUser(me);
        return me;
    }, []);

    const updateUser = useCallback((patch: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    }, []);

    const value: AuthContextValue = {
        user,
        token,
        isAuthenticated: Boolean(user && token),
        bootstrapping,
        signIn,
        signUp,
        signOut,
        refreshUser,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}