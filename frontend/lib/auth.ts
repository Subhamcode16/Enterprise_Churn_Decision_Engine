"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  name?: string;
  role: "admin" | "operator" | "executive";
  created_at?: string;
}

const TOKEN_KEY = "valence_auth_token";
const USER_KEY = "valence_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("valence-auth-change", { detail: { token, user } }));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("valence-auth-change", { detail: { token: null, user: null } }));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial sync
    setToken(getStoredToken());
    setUser(getStoredUser());
    setLoading(false);

    const handleAuthChange = (e: any) => {
      setToken(e.detail?.token || null);
      setUser(e.detail?.user || null);
    };

    window.addEventListener("valence-auth-change", handleAuthChange);
    return () => window.removeEventListener("valence-auth-change", handleAuthChange);
  }, []);

  return { user, token, isAuthenticated: Boolean(token && user), loading };
}
