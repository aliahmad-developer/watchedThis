"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../context/authContext";
import { ListStatus } from "../../user/library/types";

export interface ListItem {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  status: ListStatus;
  addedAt: string | null;
}

export function useUserLists() {
  const { user, status, sessionReady } = useAuth();
  const authLoading = status === "loading";
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_lists")
      .select("media_id, media_type, title, poster_path, status, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("[useUserLists] fetch error:", error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(
      (data ?? []).map((row) => ({
        mediaId: row.media_id as number,
        mediaType: row.media_type as "movie" | "tv",
        title: row.title as string,
        poster_path: row.poster_path ?? undefined,
        status: row.status as ListStatus,
        addedAt: row.added_at as string | null,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !sessionReady) return;
    fetchItems();
  }, [authLoading, sessionReady, fetchItems]);

  const removeItem = async (mediaId: number) => {
    if (!user) return;

    const supabase = createClient();
    await supabase
      .from("user_lists")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", mediaId);

    await fetchItems();
  };

  return { items, loading, isAuthenticated: !!user, authLoading, removeItem };
}