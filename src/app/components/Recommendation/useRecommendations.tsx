"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../context/authContext";
import { getRecommendations, deriveTasteProfile } from "./scorer";
import { loadBehaviour } from "./behaviourTracker";

import type {
  MediaItem,
  ScoredItem,
  TasteProfile,
  RecommendationProfile,
} from "./types";

async function tmdbGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T | null> {
  try {
    const url = new URL("/api/tmdb", window.location.origin);

    url.searchParams.set("path", path);

    if (Object.keys(params).length) {
      url.searchParams.set("params", JSON.stringify(params));
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();

      console.error("[tmdb] failed:", res.status, text);

      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("[tmdb] fetch failed:", path, e);

    return null;
  }
}
async function fetchCandidates(topGenreIds: number[]): Promise<MediaItem[]> {
  const results: MediaItem[] = [];

  const [trendMovies, trendTV] = await Promise.all([
    tmdbGet<{ results: MediaItem[] }>("/trending/movie/week"),
    tmdbGet<{ results: MediaItem[] }>("/trending/tv/week"),
  ]);

  (trendMovies?.results ?? []).forEach((m) =>
    results.push({
      ...m,
      media_type: "movie",
    }),
  );

  (trendTV?.results ?? []).forEach((m) =>
    results.push({
      ...m,
      media_type: "tv",
    }),
  );

  const genreRequests = topGenreIds.slice(0, 3).flatMap((genreId) => [
    tmdbGet<{ results: MediaItem[] }>("/discover/movie", {
      with_genres: String(genreId),
      sort_by: "popularity.desc",
      page: "1",
    }),

    tmdbGet<{ results: MediaItem[] }>("/discover/tv", {
      with_genres: String(genreId),
      sort_by: "popularity.desc",
      page: "1",
    }),
  ]);

  const genreResults = await Promise.all(genreRequests);

  genreResults.forEach((page, i) => {
    const mediaType: "movie" | "tv" = i % 2 === 0 ? "movie" : "tv";

    (page?.results ?? []).forEach((m) =>
      results.push({
        ...m,
        media_type: mediaType,
      }),
    );
  });

  const seen = new Set<string>();

  return results.filter((m) => {
    const key = `${m.id}-${m.media_type}`;

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
}

async function enrichItem(item: ScoredItem): Promise<ScoredItem> {
  try {
    const path =
      item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

    const detail = await tmdbGet<MediaItem>(path);

    if (!detail) return item;

    return {
      ...item,

      runtime: detail.runtime ?? item.runtime,

      episode_run_time: detail.episode_run_time ?? item.episode_run_time,

      number_of_episodes: detail.number_of_episodes ?? item.number_of_episodes,

      number_of_seasons: detail.number_of_seasons ?? item.number_of_seasons,

      genres: detail.genres ?? item.genres,
    };
  } catch {
    return item;
  }
}

interface ListDoc {
  mediaId: number;
  mediaType: "movie" | "tv";
  status: string;
  title?: string;
  poster_path?: string;
  genre_ids?: number[]; // add this
}

async function fetchUserList(uid: string): Promise<ListDoc[]> {
  const { getDocs, collection } = await import("firebase/firestore");
  const firebase = await import("../../firebase/firebaseConfig");
  const db = firebase.getFirebaseDB();

  try {
    const snap = await getDocs(collection(db, "users", uid, "lists"));
    return snap.docs.map((d) => d.data() as ListDoc);
  } catch {
    return [];
  }
}
interface UseRecommendationsOptions {
  limit?: number;
  excludeWatched?: boolean;
  excludeIds?: number[];
  enrichBatchSize?: number;
}

interface UseRecommendationsReturn {
  recommendations: ScoredItem[];
  tasteProfile: TasteProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRecommendations(
  opts: UseRecommendationsOptions = {},
): UseRecommendationsReturn {
  const {
    limit = 20,
    excludeWatched = true,
    excludeIds = [],
    enrichBatchSize = 0,
  } = opts;

  const user = useAuth();

  const uid = user?.uid;

  const [recommendations, setRecommendations] = useState<ScoredItem[]>([]);

  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  const abortRef = useRef(false);
  const loadingTimeoutRef = useRef<number | null>(null);

  const excludeIdsKey = useMemo(() => excludeIds.join(","), [excludeIds]);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const getCacheKey = useCallback(
    (userId: string) => {
      const d = new Date();

      const today = [
        d.getUTCFullYear(),
        String(d.getUTCMonth() + 1).padStart(2, "0"),
        String(d.getUTCDate()).padStart(2, "0"),
      ].join("-");

      return [
        "recommendations-v2",
        userId,
        today,
        `limit=${limit}`,
        `excludeWatched=${excludeWatched}`,
        `excludeIds=${excludeIdsKey}`,
      ].join("|");
    },
    [limit, excludeWatched, excludeIdsKey],
  );

  useEffect(() => {
    if (user === undefined) return;

    if (!uid) {
      setRecommendations([]);
      setTasteProfile(null);
      setIsLoading(false);
      return;
    }

    abortRef.current = false;

    setIsLoading(true);
    setError(null);

    // Production safety: never get stuck in loading forever.
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (abortRef.current) return;
      console.warn("[recs] loading timeout reached; forcing stop");
      setIsLoading(false);
    }, 12000);

    (async () => {
      try {
        const cacheKey = getCacheKey(uid);

        try {
          const raw = localStorage.getItem(cacheKey);

          if (raw) {
            const parsed = JSON.parse(raw);

            if (
              parsed?.recommendations &&
              Array.isArray(parsed.recommendations)
            ) {
              setRecommendations(parsed.recommendations);

              setTasteProfile(parsed.tasteProfile ?? null);

              setIsLoading(false);

              return;
            }
          }
        } catch {}

        // ─────────────────────────────
        // FETCH USER DATA
        // ─────────────────────────────

        const [listDocs, behaviour] = await Promise.all([
          fetchUserList(uid),
          loadBehaviour(uid),
        ]);

        if (abortRef.current) return;

        const favouriteIds = listDocs
          .filter((d) => d.status === "favourite")
          .map((d) => d.mediaId);

        const libraryIds = listDocs
          .filter((d) => d.status === "plan_to_watch")
          .map((d) => d.mediaId);

        const watchedIds = listDocs
          .filter((d) => d.status === "completed")
          .map((d) => d.mediaId);

        const tempProfile: RecommendationProfile = {
          allMedia: listDocs.map((d) => ({
            id: d.mediaId,
            media_type: d.mediaType,
            title: d.title,
            poster_path: d.poster_path,
            genre_ids: d.genre_ids ?? [], // add this
          })),

          favouriteIds,
          libraryIds,
          watchedIds,

          clickLog: behaviour.clickLog ?? [],

          searchHistory: behaviour.searchHistory ?? [],

          findFilters: behaviour.findFilters ?? [],

          ratings: {},
        };

        const taste = deriveTasteProfile(tempProfile);

        // ─────────────────────────────
        // TOP GENRES
        // ─────────────────────────────

        const topGenreNames = taste.topGenres.map((g) => g.genre);

        const { TMDB_GENRES } = await import("./types");

        const nameToId = Object.fromEntries(
          Object.entries(TMDB_GENRES).map(([id, name]) => [name, Number(id)]),
        );

        const topGenreIds = topGenreNames
          .map((n) => nameToId[n])
          .filter(Boolean) as number[];
        const candidates = await fetchCandidates(topGenreIds);
        if (abortRef.current) return;

        const profile: RecommendationProfile = {
          allMedia: candidates,

          favouriteIds,
          libraryIds,
          watchedIds,

          clickLog: behaviour.clickLog ?? [],

          searchHistory: behaviour.searchHistory ?? [],

          findFilters: behaviour.findFilters ?? [],

          ratings: {},
        };

        const recs = getRecommendations(profile, {
          limit,
          excludeWatched,
          excludeIds,
        });

        if (abortRef.current) return;
        setRecommendations(recs);

        const tasteProfileData = deriveTasteProfile(profile);

        setTasteProfile(tasteProfileData);

        setIsLoading(false);
        if (recs.length > 0) {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                recommendations: recs,
                tasteProfile: tasteProfileData,
              }),
            );
          } catch {
           
          }
        }
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              recommendations: recs,
              tasteProfile: tasteProfileData,
            }),
          );
        } catch {
          // ignore localStorage errors
        }

        if (enrichBatchSize > 0) {
          const enrichTargets = recs.slice(0, enrichBatchSize);

          enrichTargets.forEach(async (item, index) => {
            const enriched = await enrichItem(item);

            if (abortRef.current) return;

            // stagger enrich slightly
            await new Promise((r) => setTimeout(r, index * 80));

            setRecommendations((prev) =>
              prev.map((p) =>
                p.id === enriched.id && p.media_type === enriched.media_type
                  ? enriched
                  : p,
              ),
            );
          });
        }
      } catch (err) {
        console.error("[recs] error:", err); // ← add so you can see what's throwing
        if (!abortRef.current) {
          setError("Could not load recommendations.");
        }
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      abortRef.current = true;
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [
    tick,
    uid,
    limit,
    excludeWatched,
    excludeIdsKey,
    enrichBatchSize,
    getCacheKey,
  ]);

  return {
    recommendations,
    tasteProfile,
    isLoading,
    error,
    refresh,
  };
}
