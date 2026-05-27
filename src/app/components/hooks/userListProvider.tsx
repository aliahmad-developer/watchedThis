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
  const { user, status } = useAuth();
  const authLoading = status === "loading";

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
  }, [user, authLoading]);

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
