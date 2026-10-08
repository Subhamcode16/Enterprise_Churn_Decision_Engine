"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  name?: string;
  role: "admin" | "operator" | "executive";
  auth_provider?: string;
  last_login?: string;
  created_at?: string;
}

const TOKEN_KEY = "valence_auth_token";
const USER_KEY = "valence_auth_user";
const LAST_PROVIDER_KEY = "valence_last_auth_provider";

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

export function getStoredLastProvider(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PROVIDER_KEY);
}

export function setStoredLastProvider(provider: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_PROVIDER_KEY, provider);
}

export function setStoredAuth(token: string, user: AuthUser, provider?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const activeProvider = provider || user.auth_provider || "email";
  localStorage.setItem(LAST_PROVIDER_KEY, activeProvider);
  window.dispatchEvent(new CustomEvent("valence-auth-change", { detail: { token, user, provider: activeProvider } }));
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
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial sync
    setToken(getStoredToken());
    setUser(getStoredUser());
    setLastProvider(getStoredLastProvider());
    setLoading(false);

    const handleAuthChange = (e: any) => {
      setToken(e.detail?.token || null);
      setUser(e.detail?.user || null);
      setLastProvider(e.detail?.provider || getStoredLastProvider());
    };

    window.addEventListener("valence-auth-change", handleAuthChange);
    return () => window.removeEventListener("valence-auth-change", handleAuthChange);
  }, []);

  return { 
    user, 
    token, 
    lastProvider,
    isAuthenticated: Boolean(token && user), 
    loading 
  };
}
