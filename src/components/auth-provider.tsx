"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { SESSION_TOKEN_KEY } from "@/lib/api";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  isActive: boolean;
};

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<{ data: AdminUser }>("/auth/me")
      .then((response) => setUser(response.data.data))
      .catch(() => {
        window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{
      data: { accessToken: string; user: AdminUser };
    }>("/auth/login", { email, password });

    window.sessionStorage.setItem(
      SESSION_TOKEN_KEY,
      response.data.data.accessToken,
    );
    setUser(response.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
