"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

const AdminAuthContext = createContext(null);

/**
 * Who is in the manager's office. Only role ADMIN may sign in: a customer's correct
 * password still gets a clear "no admin access" message, and no wristband is kept.
 */
export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/api/auth/me", { silent: true, redirectOn401: false })
      .then((me) => (me.role === "ADMIN" ? setUser(me) : clearToken()))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api("/api/auth/login", { method: "POST", body: { email, password } });
    if (res.user.role !== "ADMIN") {
      throw new ApiError(403, "This account doesn't have admin access. Please use the shop to sign in.", "Forbidden");
    }
    setToken(res.token, res.expiresIn);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
