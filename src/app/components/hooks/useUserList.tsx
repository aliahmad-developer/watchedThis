"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../context/authContext";
import { useUserListStore } from "./userListProvider";
import { ListStatus } from "../../user/library/types";

interface MediaMeta {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  genre_ids?: number[];
}

export function useUserList(mediaMeta: MediaMeta) {
  const { user } = useAuth();
  const { items, refetch } = useUserListStore();
  const [loading, setLoading] = useState(false);

  const currentStatus = items[mediaMeta.mediaId] ?? null;

  const saveToList = async (status: ListStatus) => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      if (currentStatus === status) {
        await supabase
          .from("user_lists")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaMeta.mediaId);
      } else {
        await supabase.from("user_lists").upsert({
          user_id: user.id,
          media_id: mediaMeta.mediaId,
          media_type: mediaMeta.mediaType,
          title: mediaMeta.title,
          poster_path: mediaMeta.poster_path ?? null,
          genre_ids: mediaMeta.genre_ids ?? [],
          status,
          added_at: new Date().toISOString(),
        });
      }
      refetch();
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStatus,
    saveToList,
    loading,
    isAuthenticated: !!user,
  };
}