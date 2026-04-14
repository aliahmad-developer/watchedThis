//  Priority weights:
//    1. Favourites & ratings  → 40 %
//    2. Search history        → 25 %
//    3. Saved library         → 20 %
//    4. Click behaviour       → 15 %
// ─────────────────────────────────────────────────────────────

import {
  MediaItem,
  RecommendationProfile,
  ScoredItem,
  ReasonTag,
  TasteProfile,
  TMDB_GENRES,
} from "./types";

const W = {
  // 1. Favourites & ratings
  FAV_DIRECT: 40,
  FAV_GENRE_MATCH: 12,

  // 2. Search history
  SEARCH_TITLE: 18,
  SEARCH_GENRE: 9,
  SEARCH_RECENCY: 5, // bonus for last 3 searches

  // 3. Library
  LIB_GENRE_MATCH: 8,

  // 4. Clicks
  CLICK_DIRECT: 5, // per click, capped at 3
  CLICK_RECENCY: 6, // in last 5 clicks
  CLICK_GENRE: 3,

  FIND_GENRE_MATCH: 10, // per genre match from find filters
  FIND_KEYWORD_MATCH: 8, // keyword in title/overview
  FIND_RECENCY: 4,
} as const;

// ── Helpers ───────────────────────────────────────────────────

export function deriveGenres(item: MediaItem): string[] {
  if (item.genres?.length) return item.genres.map((g) => g.name);
  if (item.genre_ids?.length)
    return item.genre_ids
      .map((id) => TMDB_GENRES[id])
      .filter(Boolean) as string[];
  return [];
}

function overlap(a: string[], b: string[]): number {
  return a.filter((x) => b.includes(x)).length;
}

function fuzzy(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  return t.includes(q) || q.includes(t);
}

function collectGenres(ids: number[], allMedia: MediaItem[]): string[] {
  return [
    ...new Set(
      allMedia
        .filter((m) => ids.includes(m.id))
        .flatMap((m) => deriveGenres(m)),
    ),
  ];
}

// ── Score a single item ───────────────────────────────────────

export function scoreItem(
  item: MediaItem,
  profile: RecommendationProfile,
): { total: number; breakdown: Record<string, number> } {
  const { favouriteIds, libraryIds, clickLog, searchHistory, allMedia } =
    profile;

  const breakdown: Record<string, number> = {};
  let total = 0;

  const add = (key: string, val: number) => {
    if (!val) return;
    breakdown[key] = (breakdown[key] ?? 0) + val;
    total += val;
  };

  const itemGenres = deriveGenres(item);

  // ── 1. FAVOURITES ────────────────────────────────────────
  if (favouriteIds.includes(item.id)) {
    add("fav_direct", W.FAV_DIRECT);
  }
  const favGenres = collectGenres(favouriteIds, allMedia);
  add("fav_genre", overlap(itemGenres, favGenres) * W.FAV_GENRE_MATCH);

  // ── 2. SEARCH HISTORY ────────────────────────────────────
  const recentSearches = searchHistory.slice(-10);
  const last3 = searchHistory.slice(-3);

  for (const query of recentSearches) {
    const bonus = last3.includes(query) ? W.SEARCH_RECENCY : 0;
    const title = item.title ?? item.name ?? "";

    if (fuzzy(title, query)) add("search_title", W.SEARCH_TITLE + bonus);

    if (itemGenres.some((g) => fuzzy(g, query)))
      add("search_genre", W.SEARCH_GENRE + bonus);
  }

  // ── 3. LIBRARY ───────────────────────────────────────────
  const libGenres = collectGenres(libraryIds, allMedia);
  add("lib_genre", overlap(itemGenres, libGenres) * W.LIB_GENRE_MATCH);

  // ── 4. CLICK BEHAVIOUR ───────────────────────────────────
  const clickIds = clickLog.map((c) => c.id);
  const recentClicks = clickIds.slice(-5);
  const clickCount = clickIds.filter((id) => id === item.id).length;

  add("click_direct", Math.min(clickCount, 3) * W.CLICK_DIRECT);
  if (recentClicks.includes(item.id)) add("click_recency", W.CLICK_RECENCY);

  const recentClickGenres = collectGenres(recentClicks, allMedia);
  add("click_genre", overlap(itemGenres, recentClickGenres) * W.CLICK_GENRE);

  // ── 5. FIND FILTERS ─────────────────────────────────────────
  if (profile.findFilters?.length) {
    const recentFinds = profile.findFilters.slice(-10);
    const last5Finds = profile.findFilters.slice(-5);

    for (const snap of recentFinds) {
      const isRecent = last5Finds.includes(snap);
      const recencyBonus = isRecent ? W.FIND_RECENCY : 0;

      // Genre inclusion matches
      const genreHits = overlap(
        itemGenres,
        snap.genres.map((id) => TMDB_GENRES[id]).filter(Boolean) as string[],
      );
      if (genreHits > 0)
        add("find_genre", genreHits * (W.FIND_GENRE_MATCH + recencyBonus));

      // Penalise excluded genres
      const excludeHits = overlap(
        itemGenres,
        snap.excludeGenres
          .map((id) => TMDB_GENRES[id])
          .filter(Boolean) as string[],
      );
      if (excludeHits > 0) {
        const penalty = excludeHits * 15;
        breakdown["find_exclude"] = (breakdown["find_exclude"] ?? 0) - penalty;
        total -= penalty;
      }

      // Keyword matches against title/overview
      const title = (item.title ?? item.name ?? "").toLowerCase();
      const overview = (item.overview ?? "").toLowerCase();
      for (const kw of snap.keywords) {
        if (title.includes(kw) || overview.includes(kw))
          add("find_keyword", W.FIND_KEYWORD_MATCH + recencyBonus);
      }
    }
  }

  return { total, breakdown };
}

// ── Rank full catalogue ───────────────────────────────────────

export function getRecommendations(
  profile: RecommendationProfile,
  opts: {
    limit?: number;
    excludeIds?: number[];
    excludeWatched?: boolean;
    filterGenre?: string;
  } = {},
): ScoredItem[] {
  const {
    limit = 20,
    excludeIds = [],
    excludeWatched = true,
    filterGenre,
  } = opts;

  const { allMedia, watchedIds, favouriteIds, libraryIds } = profile;

  const candidates = allMedia.filter((item) => {
    if (excludeIds.includes(item.id)) return false;
    if (excludeWatched && watchedIds.includes(item.id)) return false;
    if (filterGenre && !deriveGenres(item).includes(filterGenre)) return false;
    return true;
  });

  const scored: ScoredItem[] = candidates.map((item) => {
    const { total, breakdown } = scoreItem(item, profile);
    return {
      ...item,
      score: total,
      breakdown,
      reason: getPrimaryReason(breakdown, item, profile),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── Reason tag ────────────────────────────────────────────────

export function getPrimaryReason(
  breakdown: Record<string, number>,
  item: MediaItem,
  profile: RecommendationProfile,
): ReasonTag {
  if (breakdown.fav_direct)
    return { label: "Because you favourited it", type: "favourite" };
  if ((breakdown.fav_genre ?? 0) >= W.FAV_GENRE_MATCH * 2)
    return { label: "Matches your favourite genres", type: "genre" };
  if ((breakdown.find_genre ?? 0) >= W.FIND_GENRE_MATCH)
    return { label: "Matches your search filters", type: "search" };
  if (breakdown.find_keyword)
    return { label: "Matches keywords you searched for", type: "search" };
  if (breakdown.search_title)
    return { label: "Matches your searches", type: "search" };
  if (breakdown.search_genre)
    return { label: "Based on your recent searches", type: "search" };
  if ((breakdown.lib_genre ?? 0) >= W.LIB_GENRE_MATCH * 2)
    return { label: "Similar to your library", type: "library" };
  if (breakdown.click_recency)
    return { label: "You recently explored this", type: "click" };
  if (breakdown.click_genre)
    return { label: "Similar to what you clicked", type: "click" };
  return { label: "Recommended for you", type: "algo" };
}

// ── Taste profile ─────────────────────────────────────────────

export function deriveTasteProfile(
  profile: RecommendationProfile,
): TasteProfile {
  const { favouriteIds, libraryIds, clickLog, allMedia } = profile;

  const interactedIds = [
    ...new Set([...favouriteIds, ...libraryIds, ...clickLog.map((c) => c.id)]),
  ];

  const interacted = allMedia.filter((m) => interactedIds.includes(m.id));

  const freq: Record<string, number> = {};
  interacted.forEach((item) => {
    const weight = favouriteIds.includes(item.id)
      ? 3
      : libraryIds.includes(item.id)
        ? 2
        : 1;
    deriveGenres(item).forEach((g) => {
      freq[g] = (freq[g] ?? 0) + weight;
    });
  });

  const topGenres = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, score]) => ({ genre, score }));

  return {
    topGenres,
    totalFavourites: favouriteIds.length,
    totalLibrary: libraryIds.length,
    totalClicks: clickLog.length,
    activityScore:
      favouriteIds.length * 3 + libraryIds.length * 2 + clickLog.length,
  };
}
