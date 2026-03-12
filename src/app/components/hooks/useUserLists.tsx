"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
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

    const q = query(collection(db, "users", user.uid, "lists"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data() as ListItem);
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const removeItem = async (mediaId: number) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "lists", String(mediaId)));
    // onSnapshot will update items automatically
  };

  return { items, loading, isAuthenticated: !!user, authLoading, removeItem };
}