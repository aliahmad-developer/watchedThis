"use client";

import { useState } from "react";

import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseDB } from "../../firebase/firebaseConfig";

import { useAuth } from "./useAuth";
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

  const { items } = useUserListStore();

  const [loading, setLoading] = useState(false);

  const currentStatus = items[mediaMeta.mediaId] ?? null;

  const saveToList = async (status: ListStatus) => {
    if (!user) return;

    setLoading(true);

    try {
      const db = getFirebaseDB();

      const ref = doc(
        db,
        "users",
        user.uid,
        "lists",
        String(mediaMeta.mediaId),
      );

      if (currentStatus === status) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          mediaId: mediaMeta.mediaId,
          mediaType: mediaMeta.mediaType,
          title: mediaMeta.title,
          poster_path: mediaMeta.poster_path ?? null,
          genre_ids: mediaMeta.genre_ids ?? [], 
          status,
          addedAt: serverTimestamp(),
        });
      }
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
