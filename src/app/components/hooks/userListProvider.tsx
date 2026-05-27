"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, query } from "firebase/firestore";

import { useAuth } from "./useAuth";
import { getFirebaseDB } from "../../firebase/firebaseConfig";
import { ListStatus } from "../../user/library/types";

interface UserListItem {
  mediaId: number;
  status: ListStatus;
}

interface UserListContextType {
  items: Record<number, ListStatus>;
  loading: boolean;
}

const UserListContext = createContext<UserListContextType>({
  items: {},
  loading: true,
});

export function UserListProvider({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();

  const [items, setItems] = useState<Record<number, ListStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setItems({});
      setLoading(false);
      return;
    }

    const db = getFirebaseDB();

    const q = query(collection(db, "users", user.uid, "lists"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: Record<number, ListStatus> = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          next[data.mediaId] = data.status;
        });

        setItems(next);
        setLoading(false);
      },
      (error) => {
        if (error.code === "permission-denied") {
          setItems({});
          setLoading(false);
        }
      },
    );

    return unsubscribe;
  }, [user, authLoading]);

  const value = useMemo(
    () => ({
      items,
      loading,
    }),
    [items, loading],
  );

  return (
    <UserListContext.Provider value={value}>
      {children}
    </UserListContext.Provider>
  );
}

export function useUserListStore() {
  return useContext(UserListContext);
}
