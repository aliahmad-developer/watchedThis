"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  sessionReady: boolean;      // kept for compatibility — Supabase has no async session-sync step, so this mirrors `status !== "loading"`
  firebaseInitialized: boolean; // kept for compatibility — always true once client mounts
}

const AuthContext = createContext<AuthState>({
  user: null,
  status: "loading",
  sessionReady: false,
  firebaseInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: "loading",
    sessionReady: false,
    firebaseInitialized: false,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mountedRef.current) return;
      setState({
        user,
        status: user ? "authenticated" : "unauthenticated",
        sessionReady: true,
        firebaseInitialized: true,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setState({
        user: session?.user ?? null,
        status: session?.user ? "authenticated" : "unauthenticated",
        sessionReady: true,
        firebaseInitialized: true,
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);