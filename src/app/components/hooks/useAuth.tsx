"use client";

import { useEffect, useState } from "react";


export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any;
    let cancelled = false;
    (async () => {
      const fbAuth = await import("firebase/auth");
      const fbConfig = await import("../../firebase/firebaseConfig");
      const auth = await fbConfig.getFirebaseAuth();
      unsubscribe = fbAuth.onAuthStateChanged(auth, (firebaseUser: any) => {
        if (!cancelled) {
          setUser(firebaseUser);
          setAuthLoading(false);
        }
      });
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, authLoading };
}