"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";

const AuthContext = createContext<User | null | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let unsub: () => void;
    (async () => {
      const { onIdTokenChanged } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("../firebase/firebaseConfig");
      const auth = await getFirebaseAuth();
      unsub = onIdTokenChanged(auth, (u) => {
        setUser(u ?? null);
        if (u) {
          u.getIdToken().then(token => {
            document.cookie = `firebase-auth-token=${token}; path=/; SameSite=Strict; Secure; max-age=3600`;
          });
        } else {
          document.cookie = `firebase-auth-token=; path=/; max-age=0; SameSite=Strict; Secure`;
        }
      });
    })();
    return () => unsub?.();
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);