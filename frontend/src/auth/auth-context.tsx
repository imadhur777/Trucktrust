import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY, User } from "@/src/api/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: SignUpPayload) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "shipper" | "driver";
  company?: string;
  truck_type?: string;
  capacity?: string;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = await storage.secureGet<string>(TOKEN_KEY, "");
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/auth/me");
      setUserState(me);
    } catch {
      await storage.secureRemove(TOKEN_KEY);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    await storage.secureSet(TOKEN_KEY, res.access_token);
    setUserState(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const res = await api.post<{ access_token: string; user: User }>("/auth/register", payload);
    await storage.secureSet(TOKEN_KEY, res.access_token);
    setUserState(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUserState(null);
  }, []);

  const value: AuthState = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refresh: loadMe,
    setUser: setUserState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
