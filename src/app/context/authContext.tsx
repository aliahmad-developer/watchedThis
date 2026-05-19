"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User } from "firebase/auth";

const AuthContext = createContext<User | null | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const nullTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let unsub: (() => void) | undefined;

    // Safety net: never hang forever — resolve to null after 5s
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setUser((prev) => (prev === undefined ? null : prev));
      }
    }, 5000);

    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");

      const auth = await getFirebaseAuth();

      if (mountedRef.current && auth.currentUser) {
        setUser(auth.currentUser);
      }

      unsub = onIdTokenChanged(auth, (u) => {
        if (!mountedRef.current) return;
        if (nullTimer.current) clearTimeout(nullTimer.current);

        if (u) {
          setUser(u);
        } else {
          nullTimer.current = setTimeout(() => {
            if (mountedRef.current) setUser(null);
          }, 1000);
        }
      });
    })();

    // Listen for One Tap / manual auth-updated events
    const handleAuthUpdated = async () => {
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");
      const auth = await getFirebaseAuth();
      if (mountedRef.current) {
        setUser(auth.currentUser ?? null);
      }
    };

    window.addEventListener("auth-updated", handleAuthUpdated);

    return () => {
      mountedRef.current = false;
      unsub?.();
      clearTimeout(safetyTimer);
      if (nullTimer.current) clearTimeout(nullTimer.current);
      window.removeEventListener("auth-updated", handleAuthUpdated);
    };
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
