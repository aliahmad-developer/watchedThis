"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { getFirebaseDB } from "../../firebase/firebaseConfig";
import { ListStatus } from "../../user/library/types";

interface UserListContextType {
  items: Record<number, ListStatus>;
  loading: boolean;
}

const UserListContext = createContext<UserListContextType>({
  items: {},
  loading: true,
});

export function UserListProvider({ children }: { children: React.ReactNode }) {
  const { user, status, sessionReady } = useAuth();
  const authLoading = status === "loading";

  const [items, setItems] = useState<Record<number, ListStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !sessionReady) return;

    if (!user) {
      setItems({});
      setLoading(false);
      return;
    }

    const db = getFirebaseDB();
    const uid = user.uid;

    // Safety: guard against transient auth states that can cause Firestore to hang/timeout.
    if (!uid) {
      setItems({});
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", uid, "lists"));

    // onSnapshot can sometimes hang in production (network/timeout). Track and log.
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      console.error(
        "[userListProvider] Firestore onSnapshot timeout; uid:",
        uid,
      );
      setItems({});
      setLoading(false);
    }, 15000);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        window.clearTimeout(timeoutId);
        if (timedOut) return;

        const next: Record<number, ListStatus> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          // data.mediaId may not be a number at runtime; normalize.
          const mediaId = Number((data as any).mediaId);
          const status = (data as any).status as ListStatus;
          if (!Number.isNaN(mediaId)) next[mediaId] = status;
        });
        setItems(next);
        setLoading(false);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        if (timedOut) return;

        console.error(
          "[userListProvider] snapshot error:",
          error.code,
          error.message,
        );
        setItems({});
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user, authLoading, sessionReady]);

  const value = useMemo(() => ({ items, loading }), [items, loading]);

  return (
    <UserListContext.Provider value={value}>
      {children}
    </UserListContext.Provider>
  );
}

export function useUserListStore() {
  return useContext(UserListContext);
}
