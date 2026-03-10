"use client";

import { useEffect, useState } from "react";
import { SpinnerItem } from "./types";

const CACHE_KEY = "spinnerSlots";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

interface CacheEntry {
  items: SpinnerItem[];
  ts: number;
}

function readCache(): SpinnerItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.items;
  } catch {
    return null;
  }
}

function writeCache(items: SpinnerItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
  } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

async function fetchFresh(): Promise<SpinnerItem[]> {
  const calls = Array.from({ length: 20 }, () =>
    fetch("/api/randomCall").then((r) => r.json()).catch(() => null)
  );
  const results = await Promise.allSettled(calls);
  return results
    .filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value?.id)
    .map((r) => {
      const v = (r as PromiseFulfilledResult<any>).value;
      return {
        id: v.id,
        mediaType: v.media_type as "movie" | "tv",
        title: v.title || v.name || "Untitled",
        poster_path: v.poster_path,
      };
    });
}

function toSlots(items: SpinnerItem[]): (SpinnerItem | null)[] {
  return items.length >= 20
    ? items.slice(0, 20)
    : [...items, ...Array(20 - items.length).fill(null)];
}

export function useInitialMedia() {
  const [slots, setSlots] = useState<(SpinnerItem | null)[]>(Array(20).fill(null));
  const [loading, setLoading] = useState(true);
  const [reshuffling, setReshuffling] = useState(false);

  // On mount — use cache if available, otherwise fetch
  useEffect(() => {
    const cached = readCache();
    if (cached && cached.length > 0) {
      setSlots(toSlots(cached));
      setLoading(false);
      return;
    }

    fetchFresh()
      .then((items) => {
        writeCache(items);
        setSlots(toSlots(items));
      })
      .catch(() => setSlots(Array(20).fill(null)))
      .finally(() => setLoading(false));
  }, []);

  // Reshuffle — busts cache, fetches fresh, respects blacklist
  const reshuffle = async (blacklist: SpinnerItem[] = []) => {
    if (reshuffling) return;
    setReshuffling(true);
    clearCache();
    try {
      const items = await fetchFresh();
      const blacklistIds = new Set(blacklist.map((b) => b.id));
      const filtered = items.filter((item) => !blacklistIds.has(item.id));
      writeCache(filtered);
      setSlots(toSlots(filtered));
    } finally {
      setReshuffling(false);
    }
  };

  return { slots, setSlots, loading, reshuffling, reshuffle };
}