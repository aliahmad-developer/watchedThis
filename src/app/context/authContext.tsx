"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "firebase/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const AuthContext = createContext<AuthState>({
  user: null,
  status: "loading",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: "loading",
  });
  const mountedRef = useRef(true);
  const sessionSyncRef = useRef(false);
  const statusRef = useRef<AuthStatus>("loading"); // ← fixes stale closure

  const setAuthState = (next: AuthState | ((prev: AuthState) => AuthState)) => {
    if (typeof next === "function") {
      setState((prev) => {
        const resolved = next(prev);
        statusRef.current = resolved.status;
        return resolved;
      });
    } else {
      statusRef.current = next.status;
      setState(next);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && statusRef.current === "loading") {
        setAuthState({ user: null, status: "unauthenticated" });
      }
    }, 5000);

    let unsub: (() => void) | undefined;

    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");
      const auth = await getFirebaseAuth();

      unsub = onIdTokenChanged(auth, async (u) => {
        if (!mountedRef.current) return;

        if (!u) {
          setAuthState({ user: null, status: "unauthenticated" });
          return;
        }

        if (sessionSyncRef.current && statusRef.current === "authenticated") {
          setAuthState((prev) => ({ ...prev, user: u }));
          return;
        }

        setAuthState({
          user: u,
          status: "authenticated",
        });

        if (sessionSyncRef.current) {
          return;
        }

        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          });

          if (!res.ok) {
            const token = await u.getIdToken();

            await fetch("/api/auth/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                idToken: token,
              }),
            });
          }

          sessionSyncRef.current = true;
        } catch {}

        try {
          const token = await u.getIdToken(true);
          const sessionRes = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken: token }),
          });

          if (sessionRes.ok && mountedRef.current) {
            sessionSyncRef.current = true;
            setAuthState({ user: u, status: "authenticated" });
          } else if (mountedRef.current) {
            setAuthState({ user: null, status: "unauthenticated" });
          }
        } catch {
          if (mountedRef.current) {
            setAuthState({ user: null, status: "unauthenticated" });
          }
        }
      });
    })();

    const handleAuthUpdated = async () => {
      sessionSyncRef.current = false;
    };

    window.addEventListener("auth-updated", handleAuthUpdated);

    return () => {
      mountedRef.current = false;
      unsub?.();
      clearTimeout(safetyTimer);
      window.removeEventListener("auth-updated", handleAuthUpdated);
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
