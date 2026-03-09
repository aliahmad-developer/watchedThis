"use client";

import { useEffect, useState } from "react";
import { SpinnerItem } from "./types";

export function useInitialMedia() {
  const [slots, setSlots] = useState<(SpinnerItem | null)[]>(Array(20).fill(null));
  const [loading, setLoading] = useState(true);

  const fetchRandom = async (): Promise<SpinnerItem[]> => {
    const calls = Array.from({ length: 20 }, () =>
      fetch("/api/randomCall").then((r) => r.json()).catch(() => null)
    );
    const results = await Promise.allSettled(calls);
    return results
      .filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<{ id: number; media_type: string; title?: string; name?: string; poster_path?: string } | null>).value?.id)
      .map((r) => {
        const v = (r as PromiseFulfilledResult<{ id: number; media_type: string; title?: string; name?: string; poster_path?: string }>).value;
        return {
          id: v.id,
          mediaType: v.media_type as "movie" | "tv",
          title: v.title || v.name || "Untitled",
          poster_path: v.poster_path,
        };
      });
  };

  useEffect(() => {
    fetchRandom()
      .then((items) => setSlots(
        items.length >= 20 ? items.slice(0, 20) : [...items, ...Array(20 - items.length).fill(null)]
      ))
      .catch(() => setSlots(Array(20).fill(null)))
      .finally(() => setLoading(false));
  }, []);

  return { slots, setSlots, loading, fetchRandom };
}