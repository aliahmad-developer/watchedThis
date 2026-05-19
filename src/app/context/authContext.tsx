"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { User } from "firebase/auth";

const AuthContext = createContext<User | null | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");

      const auth = await getFirebaseAuth();

      if (mounted) {
        setUser(auth.currentUser ?? null);
      }

      unsub = onIdTokenChanged(auth, (u) => {
        if (!mounted) return;
        setUser(u ?? null);
      });
    })();

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
