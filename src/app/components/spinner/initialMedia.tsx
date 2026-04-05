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
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  excludeKeywords: string[];
  keywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  strictMode: boolean;
}

async function fetchFresh(filters: Filters, blacklist: SpinnerItem[] = []): Promise<SpinnerItem[]> {
  const isDefaultYear = filters.yearRange[0] === 1950 && filters.yearRange[1] === new Date().getFullYear();
  const isDefaultRating = filters.ratingRange[0] === 0 && filters.ratingRange[1] === 10;

  const params = new URLSearchParams({ 
    mediaType: filters.mediaType, 
    sortBy: filters.sortBy 
  });
  if (filters.strictMode || !isDefaultYear) {
    params.set("minYear", String(filters.yearRange[0]));
    params.set("maxYear", String(filters.yearRange[1]));
  }
  if (filters.strictMode || !isDefaultRating) {
    params.set("minRating", String(filters.ratingRange[0]));
    params.set("maxRating", String(filters.ratingRange[1]));
  }
  if (filters.genres.length) params.set("genres", filters.genres.join(","));
  if (filters.excludeGenres.length) params.set("excludeGenres", filters.excludeGenres.join(","));
  if (filters.excludeKeywords.length) params.set("excludeKeywords", filters.excludeKeywords.join(","));
  if (filters.keywords.length) params.set("keywords", filters.keywords.join(","));
  if (filters.strictMode) params.set("strict", "true");
  params.set("limit", String(30)); // Extra for blacklist filtering

  const res = await fetch(`/api/discover?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const blacklistIds = new Set(blacklist.map(b => b.id));
  return (data.results || [])
    .filter((r: any) => (r.backdrop_path || r.poster_path) && !blacklistIds.has(r.id))
    .slice(0, 20)
    .map((r: any) => ({
      id: r.id,
      mediaType: filters.mediaType,
      title: r.title || r.name || "Untitled",
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
    }));
}

function toSlots(items: SpinnerItem[]): (SpinnerItem | null)[] {
  return items.length >= 20
    ? items.slice(0, 20)
    : [...items, ...Array(20 - items.length).fill(null)];
}

export function useInitialMedia() {
  const [slots, setSlots] = useState<(SpinnerItem | null)[]>(
    Array(20).fill(null),
  );
  const [loading, setLoading] = useState(true);
  const [reshuffling, setReshuffling] = useState(false);

  // On mount — use cache if available, otherwise fetch with default filters
  useEffect(() => {
    const cached = readCache();
    if (cached && cached.length > 0) {
      setSlots(toSlots(cached));
      setLoading(false);
      return;
    }

    const defaultFilters: Filters = {
      mediaType: "movie",
      genres: [],
      excludeGenres: [],
      excludeKeywords: [],
      keywords: [],
      yearRange: [1950, new Date().getFullYear()],
      ratingRange: [0, 10],
      sortBy: "popularity.desc",
      strictMode: false,
    };

    fetchFresh(defaultFilters, [])
      .then((items) => {
        writeCache(items);
        setSlots(toSlots(items));
      })
      .catch(() => setSlots(Array(20).fill(null)))
      .finally(() => setLoading(false));
  }, []);

// Reshuffle — busts cache, fetches fresh with filters + blacklist
  const reshuffle = async (filters: Filters, blacklist: SpinnerItem[] = []) => {
    if (reshuffling) return;
    setReshuffling(true);
    clearCache();
    try {
      const items = await fetchFresh(filters, blacklist);
      writeCache(items);
      setSlots(toSlots(items));
    } finally {
      setReshuffling(false);
    }
  };

  return { slots, setSlots, loading, reshuffling, reshuffle };
}
