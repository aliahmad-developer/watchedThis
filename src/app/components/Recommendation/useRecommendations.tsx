"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// Fetch candidate media — trending + genre-targeted pages
async function fetchCandidates(topGenreIds: number[]): Promise<MediaItem[]> {
  const results: MediaItem[] = [];

  // Always pull trending (movies + TV)
  const [trendMovies, trendTV] = await Promise.all([
    tmdbGet<{ results: MediaItem[] }>("/trending/movie/week"),
    tmdbGet<{ results: MediaItem[] }>("/trending/tv/week"),
  ]);

  (trendMovies?.results ?? []).forEach((m) =>
    results.push({ ...m, media_type: "movie" }),
  );
  (trendTV?.results ?? []).forEach((m) =>
    results.push({ ...m, media_type: "tv" }),
  );

  // Pull up to 2 genre-targeted pages for the user's top genres
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
      results.push({ ...m, media_type: mediaType }),
    );
  });

  // Deduplicate by id + media_type
  const seen = new Set<string>();
  return results.filter((m) => {
    const key = `${m.id}-${m.media_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Enrich scored items with detail fields (runtime, episode_run_time,
 * number_of_episodes, number_of_seasons, genres) that list/discover
 * endpoints do not return.
 *
 * Only enriches the top `batchSize` items to keep request count low.
 */
async function enrichWithDetails(
  items: ScoredItem[],
  batchSize = 12,
): Promise<ScoredItem[]> {
  const toEnrich = items.slice(0, batchSize);
  const rest = items.slice(batchSize);

  const enriched = await Promise.all(
    toEnrich.map(async (item) => {
      const path =
        item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

      const detail = await tmdbGet<MediaItem>(path);
      if (!detail) return item;

      return {
        ...item,
        // Movie runtime (minutes)
        runtime: detail.runtime ?? item.runtime,
        // TV runtime array e.g. [42]
        episode_run_time: detail.episode_run_time ?? item.episode_run_time,
        // TV episode / season counts
        number_of_episodes:
          detail.number_of_episodes ?? item.number_of_episodes,
        number_of_seasons: detail.number_of_seasons ?? item.number_of_seasons,
        // Full genre objects (list endpoints only return genre_ids)
        genres: detail.genres ?? item.genres,
      } as ScoredItem;
    }),
  );

  return [...enriched, ...rest];
}

// ── Read user list from Firestore ─────────────────────────────

interface ListDoc {
  mediaId: number;
  mediaType: "movie" | "tv";
  status: string; // "favourite" | "plan_to_watch" | "completed"
  title?: string;
  poster_path?: string;
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

// ── Hook ──────────────────────────────────────────────────────

interface UseRecommendationsOptions {
  /** Max items to return (default: 20) */
  limit?: number;
  /** Hide items the user has already watched/completed (default: true) */
  excludeWatched?: boolean;
  /** IDs to always hide (e.g. currently displayed hero item) */
  excludeIds?: number[];
  /**
   * How many of the top recommendations to enrich with full detail data
   * (runtime, episode count, etc.).  Defaults to 12.
   * Set to 0 to disable enrichment entirely.
   */
  enrichBatchSize?: number;
}

interface UseRecommendationsReturn {
  recommendations: ScoredItem[];
  tasteProfile: TasteProfile | null;
  isLoading: boolean;
  error: string | null;
  /** Call after any user action to force a fresh score */
  refresh: () => void;
}

export function useRecommendations(
  opts: UseRecommendationsOptions = {},
): UseRecommendationsReturn {
  const {
    limit = 20,
    excludeWatched = true,
    excludeIds = [],
    enrichBatchSize = 12,
  } = opts;

  const [recommendations, setRecommendations] = useState<ScoredItem[]>([]);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const excludeIdsKey = excludeIds.join(",");
  // Prevent stale async updates if uid changes mid-flight
  const abortRef = useRef(false);

  useEffect(() => {
    let unsub: () => void;
    const initAuth = async () => {
      const firebaseAuth = await import("firebase/auth");
      const firebaseConfig = await import("../../firebase/firebaseConfig");
      const auth = await firebaseConfig.getFirebaseAuth();

      unsub = firebaseAuth.onAuthStateChanged(auth, (user) => {
        const uid = user?.uid;

        if (!uid) {
          setIsLoading(false);
          setRecommendations([]);
          return;
        }

        abortRef.current = false;
        setIsLoading(true);
        setError(null);

        (async () => {
          try {
            // 1. Load user list + behaviour in parallel
            const [listDocs, behaviour] = await Promise.all([
              fetchUserList(uid),
              loadBehaviour(uid),
            ]);

            const clickLog = behaviour.clickLog ?? [];
            const searchHistory = behaviour.searchHistory ?? [];
            const findFilters = behaviour.findFilters ?? [];

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

            // 2. Derive top genre IDs from favourites for targeted TMDB fetches
            const tempProfile: RecommendationProfile = {
              allMedia: listDocs.map((d) => ({
                id: d.mediaId,
                media_type: d.mediaType,
                title: d.title,
                poster_path: d.poster_path,
              })),
              favouriteIds,
              libraryIds,
              watchedIds,
              clickLog,
              searchHistory,
              findFilters,
              ratings: {},
            };

            const taste = deriveTasteProfile(tempProfile);
            const topGenreNames = taste.topGenres.map((g) => g.genre);

            // Map genre names back to TMDB IDs for the discover API
            const { TMDB_GENRES } = await import("./types");
            const nameToId = Object.fromEntries(
              Object.entries(TMDB_GENRES).map(([id, name]) => [
                name,
                Number(id),
              ]),
            );
            const topGenreIds = topGenreNames
              .map((n) => nameToId[n])
              .filter(Boolean) as number[];

            // 3. Fetch candidates from TMDB
            const candidates = await fetchCandidates(topGenreIds);
            if (abortRef.current) return;

            // 4. Build full profile and score
            const profile: RecommendationProfile = {
              allMedia: candidates,
              favouriteIds,
              libraryIds,
              watchedIds,
              clickLog,
              searchHistory,
              findFilters,
              ratings: {},
            };

            const recs = getRecommendations(profile, {
              limit,
              excludeWatched,
              excludeIds,
            });
            const taste2 = deriveTasteProfile(profile);

            // 5. Enrich top N recommendations with detail fields
            //    (runtime, episode_run_time, number_of_episodes, number_of_seasons)
            //    Discover/trending endpoints omit these — detail endpoint is required.
            const enriched =
              enrichBatchSize > 0
                ? await enrichWithDetails(recs, enrichBatchSize)
                : recs;

            if (abortRef.current) return;

            setRecommendations(enriched);
            setTasteProfile(taste2);
          } catch {
            if (!abortRef.current) setError("Could not load recommendations.");
          } finally {
            if (!abortRef.current) setIsLoading(false);
          }
        })();
      });
    };
    initAuth();

    return () => {
      unsub?.();
      abortRef.current = true;
    };
  }, [tick, limit, excludeWatched, excludeIdsKey, enrichBatchSize]); // eslint-disable-line

  return { recommendations, tasteProfile, isLoading, error, refresh };
}
