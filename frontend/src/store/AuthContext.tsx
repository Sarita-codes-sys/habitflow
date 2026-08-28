import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import client from '../api/client';

interface User {
  id: number;
  email: string;
  displayName: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  // isLoading = true means "we have a token but haven't validated it yet"
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/profile');
      setUser(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      // ONLY clear token if the server explicitly says the token is bad (401)
      // Do NOT logout on network errors (ECONNREFUSED, timeout) — Neon DB cold start
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
      // For any other error (network down, 500, etc.) keep the user logged in
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoading(true);
    try {
      const res = await client.get('/profile');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
