"use client";

import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";
import { ListStatus } from "../../user/library/types";

interface MediaMeta {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
}

export function useUserList(mediaMeta: MediaMeta) {
  const { user, authLoading } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<ListStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCurrentStatus(null); return; }

    (async () => {
      const { doc, getDoc } = await import("firebase/firestore");
      const firebaseConfig = await import("../../firebase/firebaseConfig");
      const db = firebaseConfig.getFirebaseDB();
      const ref = doc(db, "users", user!.uid, "lists", String(mediaMeta.mediaId));
      const snap = await getDoc(ref);
      if (snap.exists()) setCurrentStatus(snap.data().status as ListStatus);
      else setCurrentStatus(null);
    })();
  }, [user, authLoading, mediaMeta.mediaId]);

  const saveToList = async (status: ListStatus) => {
    if (!user) return;
    setLoading(true);
    try {
      const { doc, deleteDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const firebaseConfig = await import("../../firebase/firebaseConfig");
      const db = firebaseConfig.getFirebaseDB();
      const ref = doc(db, "users", user!.uid, "lists", String(mediaMeta.mediaId));
      if (currentStatus === status) {
        await deleteDoc(ref);
        setCurrentStatus(null);
      } else {
        const data: Record<string, unknown> = {
          mediaId: mediaMeta.mediaId,
          mediaType: mediaMeta.mediaType,
          status,
          addedAt: serverTimestamp(),
        };
        if (mediaMeta.title) data.title = mediaMeta.title;
        if (mediaMeta.poster_path) data.poster_path = mediaMeta.poster_path;
        await setDoc(ref, data);
        setCurrentStatus(status);
      }
    } finally {
      setLoading(false);
    }
  };

  return { currentStatus, saveToList, loading, isAuthenticated: !!user };
}