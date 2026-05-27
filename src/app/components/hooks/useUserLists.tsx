"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
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
  const { user, status, sessionReady } = useAuth();
  const authLoading = status === "loading";
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !sessionReady) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    (async () => {
      const { collection, query, onSnapshot } =
        await import("firebase/firestore");
      const firebaseConfig = await import("../../firebase/firebaseConfig");
      const db = firebaseConfig.getFirebaseDB();

      const q = query(collection(db, "users", user.uid, "lists"));

      // Safety: guard against Firestore hanging in production
      let timedOut = false;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        console.error(
          "[useUserLists] Firestore onSnapshot timeout; uid:",
          user.uid,
        );
        setItems([]);
        setLoading(false);
      }, 15000);

      unsubscribe = onSnapshot(
        q,
        (snap) => {
          window.clearTimeout(timeoutId);
          if (timedOut) return;

          const data = snap.docs.map((d) => d.data() as ListItem);
          setItems(data);
          setLoading(false);
        },
        (error) => {
          window.clearTimeout(timeoutId);
          if (timedOut) return;

          console.error(
            "[useUserLists] snapshot error:",
            error.code,
            error.message,
          );

          if (error.code === "permission-denied") {
            setItems([]);
            setLoading(false);
          } else if (error.code === "unauthenticated") {
            // User not authenticated
            setItems([]);
            setLoading(false);
          } else if (error.code === "failed-precondition") {
            // Firestore not available or quota exceeded
            setItems([]);
            setLoading(false);
          } else {
            // Other errors - log and try to continue
            console.error("[useUserLists] unhandled error:", error);
            setItems([]);
            setLoading(false);
          }
        },
      );
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, sessionReady]);

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
