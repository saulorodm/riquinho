import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { bootstrapAuth, fetchAuthMe, fetchAuthStatus, loginAuth } from "../services/queries";
import type { AuthUser } from "../types/api";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "../utils/auth-storage";

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  authenticating: boolean;
  needsBootstrap: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  bootstrap: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      setInitializing(true);

      try {
        const status = await fetchAuthStatus();
        setNeedsBootstrap(status.needsBootstrap);

        const token = getStoredAuthToken();

        if (!token) {
          setUser(null);
          return;
        }

        try {
          const authUser = await fetchAuthMe();
          setUser(authUser);
        } catch {
          clearStoredAuthToken();
          setUser(null);
        }
      } finally {
        setInitializing(false);
      }
    }

    void initializeAuth();
  }, []);

  async function handleLogin(payload: { email: string; password: string }) {
    setAuthenticating(true);

    try {
      const authResponse = await loginAuth(payload);
      setStoredAuthToken(authResponse.token);
      setUser(authResponse.user);
      setNeedsBootstrap(false);
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleBootstrap(payload: { name: string; email: string; password: string }) {
    setAuthenticating(true);

    try {
      const authResponse = await bootstrapAuth(payload);
      setStoredAuthToken(authResponse.token);
      setUser(authResponse.user);
      setNeedsBootstrap(false);
    } finally {
      setAuthenticating(false);
    }
  }

  function logout() {
    clearStoredAuthToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      initializing,
      authenticating,
      needsBootstrap,
      login: handleLogin,
      bootstrap: handleBootstrap,
      logout
    }),
    [authenticating, initializing, needsBootstrap, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
