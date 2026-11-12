"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

const AuthContext = createContext(null);

/**
 * Who is shopping. Wraps the whole shop, so any component can ask useAuth():
 *   const { user, isAuthenticated, login, register, logout } = useAuth();
 *
 * On first load it checks the saved wristband with GET /api/auth/me. If Java no longer
 * accepts it (expired), the wristband is thrown away quietly and you're a guest again.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/api/auth/me", { silent: true, redirectOn401: false })
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // The API client fires this when Java says the session is over
  useEffect(() => {
    const ended = () => setUser(null);
    window.addEventListener("vn:session-ended", ended);
    return () => window.removeEventListener("vn:session-ended", ended);
  }, []);

  const startSession = useCallback((res) => {
    setToken(res.token, res.expiresIn);
    setUser(res.user);
    window.dispatchEvent(new Event("vn:auth-changed"));
    return res.user;
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await api("/api/auth/login", { method: "POST", body: { email, password } })),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession(await api("/api/auth/register", { method: "POST", body: details })),
    [startSession],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    window.dispatchEvent(new Event("vn:auth-changed"));
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
