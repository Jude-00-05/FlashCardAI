import { createContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'flashcard-token';
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
const DEV_TOKEN = 'skip-auth-token';
const DEV_USER: AuthUser = {
  id: '000000000000000000000001',
  name: 'Local User',
  email: 'local@flashcard.ai'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      if (SKIP_AUTH) {
        setToken(DEV_TOKEN);
        setUser(DEV_USER);
        setIsLoading(false);
        return;
      }

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ user: AuthUser }>('/auth/me');
        setUser(response.data.user);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void hydrate();
  }, [token]);

  async function login(email: string, password: string): Promise<void> {
    if (SKIP_AUTH) {
      setToken(DEV_TOKEN);
      setUser(DEV_USER);
      return;
    }

    const response = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
    const nextToken = response.data.token;
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(response.data.user);
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    if (SKIP_AUTH) {
      setToken(DEV_TOKEN);
      setUser(DEV_USER);
      return;
    }

    const response = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
      name,
      email,
      password
    });
    const nextToken = response.data.token;
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(response.data.user);
  }

  function logout() {
    if (SKIP_AUTH) {
      return;
    }

    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
