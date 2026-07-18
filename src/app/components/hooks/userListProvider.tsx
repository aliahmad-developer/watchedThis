"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { createClient } from "@/lib/supabase/client";
import { ListStatus } from "../../user/library/types";

interface UserListContextType {
  items: Record<number, ListStatus>;
  loading: boolean;
  refetch: () => void;
}

const UserListContext = createContext<UserListContextType>({
  items: {},
  loading: true,
  refetch: () => {},
});

export function UserListProvider({ children }: { children: React.ReactNode }) {
  const { user, status, sessionReady } = useAuth();
  const authLoading = status === "loading";

  const [items, setItems] = useState<Record<number, ListStatus>>({});
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);

  useEffect(() => {
    if (authLoading || !sessionReady) return;

    if (!user) {
      setItems({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    setLoading(true);

    supabase
      .from("user_lists")
      .select("media_id, status")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("[userListProvider] fetch error:", error.message);
          setItems({});
          setLoading(false);
          return;
        }

        const next: Record<number, ListStatus> = {};
        (data ?? []).forEach((row) => {
          next[row.media_id as number] = row.status as ListStatus;
        });
        setItems(next);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, sessionReady, refetchTick]);

  const value = useMemo(() => ({ items, loading, refetch }), [items, loading, refetch]);

  return (
    <UserListContext.Provider value={value}>
      {children}
    </UserListContext.Provider>
  );
}

export function useUserListStore() {
  return useContext(UserListContext);
}