"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "firebase/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  sessionReady: boolean;
  firebaseInitialized: boolean;
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
  const sessionSyncRef = useRef(false);
  const statusRef = useRef<AuthStatus>("loading");

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
        setAuthState({
          user: null,
          status: "unauthenticated",
          sessionReady: false,
          firebaseInitialized: false,
        });
      }
    }, 5000);

    let unsub: (() => void) | undefined;

    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");
      const auth = await getFirebaseAuth();

      // Set firebaseInitialized immediately after auth is ready
      if (mountedRef.current) {
        setState(prev => ({ ...prev, firebaseInitialized: true }));
      }

      unsub = onIdTokenChanged(auth, async (u) => {
        if (!mountedRef.current) return;

        if (!u) {
          setAuthState({
            user: null,
            status: "unauthenticated",
            sessionReady: false,
            firebaseInitialized: true,
          });
          return;
        }

        // Already synced — just update user object
        if (sessionSyncRef.current) {
          setAuthState({
            user: u,
            status: "authenticated",
            sessionReady: true,
            firebaseInitialized: true,
          });
          return;
        }

        // Optimistically authenticated, session not ready yet
        setAuthState({ 
          user: u, 
          status: "authenticated", 
          sessionReady: false,
          firebaseInitialized: true,
        });

        try {
          const check = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          });

          if (!check.ok) {
            const token = await u.getIdToken(true);
            const sessionRes = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ idToken: token }),
            });
            
            if (!sessionRes.ok) {
              throw new Error(`Failed to create session: ${sessionRes.status}`);
            }
            
            // Small delay to ensure cookie is set before Firestore queries
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Only mark as synced AFTER successful session sync
          sessionSyncRef.current = true;
          if (mountedRef.current) {
            setAuthState({
              user: u,
              status: "authenticated",
              sessionReady: true,
              firebaseInitialized: true,
            });
          }
        } catch (err) {
          // Even on error, mark as synced to avoid infinite retries
          // but still set sessionReady to true so UI can proceed
          console.warn("[authContext] Session sync failed, proceeding anyway:", err);
          sessionSyncRef.current = true;
          if (mountedRef.current) {
            setAuthState({
              user: u,
              status: "authenticated",
              sessionReady: true,
              firebaseInitialized: true,
            });
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
