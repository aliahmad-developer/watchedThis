"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";

import type { User } from "firebase/auth";

const AuthContext = createContext<User | null | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const nullTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");

      const auth = await getFirebaseAuth();

      if (mounted && auth.currentUser) {
        setUser(auth.currentUser);
      }

      unsub = onIdTokenChanged(auth, (u) => {
        if (!mounted) return;
        if (u) {
          if (nullTimer.current) clearTimeout(nullTimer.current);
          setUser(u);
        } else {
          nullTimer.current = setTimeout(() => {
            if (mounted) setUser(null);
          }, 1000);
        }
      });
    })();

    return () => {
      mounted = false;
      unsub?.();
      if (nullTimer.current) clearTimeout(nullTimer.current);
    };
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
