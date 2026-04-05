"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { ListStatus } from "../../user/library/types";

export interface ListItem {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  status: ListStatus;
  addedAt: { seconds: number } | null;
}


export function useUserLists() {
  const { user, authLoading } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setItems([]); setLoading(false); return; }

    let unsubscribe: (() => void) | null = null;

    (async () => {
      const { collection, query, onSnapshot } = await import("firebase/firestore");
      const firebaseConfig = await import("../../firebase/firebaseConfig");
      const db = firebaseConfig.getFirebaseDB();
      
      const q = query(collection(db, "users", user.uid, "lists"));
      unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => d.data() as ListItem);
        setItems(data);
        setLoading(false);
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);


  const removeItem = async (mediaId: number) => {
    if (!user) return;

    const { deleteDoc, doc } = await import("firebase/firestore");
    const firebaseConfig = await import("../../firebase/firebaseConfig");
    const db = firebaseConfig.getFirebaseDB();
    await deleteDoc(doc(db, "users", user.uid, "lists", String(mediaId)));
    // onSnapshot will update items automatically
  };

  return { items, loading, isAuthenticated: !!user, authLoading, removeItem };
}

