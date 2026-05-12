//  Priority weights:
//    1. Favourites & ratings  → 40 %
//    2. Search history        → 25 %
//    3. Saved library         → 20 %
//    4. Click behaviour       → 15 %
//
//  Improvements applied:
//    ① Genre concentration weights  — dominant genres score exponentially higher
//    ② Recency decay                — older saves/favourites lose influence over time
//    ③ Diversity injection          — no genre can occupy more than 40% of results
//    ④ Cold-start fallback          — new users get top-rated content instead of nothing
//    ⑤ Token-level search matching  — "dark psychological thriller" matches overview words
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
  SEARCH_RECENCY: 5,       // bonus for last 3 searches
  SEARCH_TOKEN: 4,         // per token match in overview (improvement ⑤)

  // 3. Library
  LIB_GENRE_MATCH: 8,

  // 4. Clicks
  CLICK_DIRECT: 5,         // per click, capped at 3
  CLICK_RECENCY: 6,        // in last 5 clicks
  CLICK_GENRE: 3,

  // 5. Find filters
  FIND_GENRE_MATCH: 10,
  FIND_KEYWORD_MATCH: 8,
  FIND_RECENCY: 4,

  // Soft penalty for already-watched items (improvement ④ extension)
  WATCHED_PENALTY: 60,
} as const;

// Max share any one genre can occupy in the final result list (improvement ③)
const MAX_GENRE_SHARE = 0.4;

// ── Recency decay (improvement ②) ────────────────────────────
//
//  Returns a multiplier 0.4–1.0 based on how long ago the timestamp is.
//  Items saved/favourited today → 1.0x
//  Items from 2+ years ago      → 0.4x (still counts, just less)
//  Half-life of 180 days: influence halves every 6 months.

function recencyDecay(savedAtMs: number | undefined): number {
  if (!savedAtMs) return 0.75; // no timestamp → neutral middle weight
  const daysSince = (Date.now() - savedAtMs) / (1000 * 60 * 60 * 24);
  const halfLifeDays = 180;
  const decay = Math.pow(0.5, daysSince / halfLifeDays);
  return Math.max(0.4, Math.min(1.0, decay));
}

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

// Sums concentration weights of matching genres instead of flat count.
// e.g. Anime weight 2.66 vs Action weight 1.2 → anime match scores 2x+ higher.
function weightedOverlap(
  itemGenres: string[],
  targetGenres: string[],
  weights: Record<string, number>,
): number {
  return itemGenres
    .filter((g) => targetGenres.includes(g))
    .reduce((sum, g) => sum + (weights[g] ?? 1), 0);
}

function fuzzy(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  return t.includes(q) || q.includes(t);
}

// ── Token-level search matching (improvement ⑤) ───────────────
//
//  Splits a multi-word query like "dark psychological thriller" into tokens
//  and checks each against the item's title + overview text.
//  Awards W.SEARCH_TOKEN per token hit so descriptive queries score
//  even when no title or genre exactly matches.
//  Stop words are filtered so "what to watch tonight" doesn't pollute scores.

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","it","its","this","that","was","are","be","been","have","has","do",
  "i","me","my","we","you","your","what","how","why","when","where","who",
  "watch","find","show","movies","movie","tv","series","good","best","top",
]);

function tokenMatch(item: MediaItem, query: string): number {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (!tokens.length) return 0;

  const haystack = [
    item.title ?? "",
    item.name ?? "",
    item.overview ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return tokens.filter((t) => haystack.includes(t)).length;
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

// ── Genre concentration weights (improvement ①) ───────────────
//
//  Derives a per-genre multiplier from how dominant each genre is
//  across the user's favourites, library, and recent clicks.
//
//  Formula:  weight = 1 + (genreFrequencyRatio * 2)
//
//  Anime at 83% → weight 2.66x | Action at 10% → 1.20x | unseen → 1.00x

function deriveGenreWeights(
  profile: RecommendationProfile,
): Record<string, number> {
  const { favouriteIds, libraryIds, clickLog, allMedia } = profile;
  const freq: Record<string, number> = {};

  allMedia
    .filter((m) => favouriteIds.includes(m.id))
    .forEach((item) =>
      deriveGenres(item).forEach((g) => {
        freq[g] = (freq[g] ?? 0) + 3;
      }),
    );

  allMedia
    .filter((m) => libraryIds.includes(m.id))
    .forEach((item) =>
      deriveGenres(item).forEach((g) => {
        freq[g] = (freq[g] ?? 0) + 2;
      }),
    );

  // Only last 50 clicks to keep weights recent
  clickLog.slice(-50).forEach((c) => {
    const item = allMedia.find((m) => m.id === c.id);
    if (item)
      deriveGenres(item).forEach((g) => {
        freq[g] = (freq[g] ?? 0) + 1;
      });
  });

  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (!total) return {};

  const weights: Record<string, number> = {};
  for (const [genre, count] of Object.entries(freq)) {
    weights[genre] = 1 + (count / total) * 2;
  }
  return weights;
}

// ── Cold-start detection (improvement ④) ─────────────────────
//
//  A user is "cold" if they have fewer than 3 meaningful interactions.
//  Cold users bypass the scoring engine entirely and get a quality fallback.

function isColdStart(profile: RecommendationProfile): boolean {
  return profile.favouriteIds.length + profile.libraryIds.length < 3;
}

// ── Score a single item ───────────────────────────────────────

export function scoreItem(
  item: MediaItem,
  profile: RecommendationProfile,
  genreWeights: Record<string, number> = {},
): { total: number; breakdown: Record<string, number> } {
  const { favouriteIds, libraryIds, clickLog, searchHistory, allMedia, watchedIds } =
    profile;

  const breakdown: Record<string, number> = {};
  let total = 0;

  const add = (key: string, val: number) => {
    if (!val) return;
    breakdown[key] = (breakdown[key] ?? 0) + val;
    total += val;
  };

  const itemGenres = deriveGenres(item);
  const savedAtMap = (profile.savedAtMap ?? {}) as Record<number, number>;

  // ── 1. FAVOURITES (with recency decay) ───────────────────
  if (favouriteIds.includes(item.id)) {
    const decay = recencyDecay(savedAtMap[item.id]);
    add("fav_direct", W.FAV_DIRECT * decay);
  }

  const favGenres = collectGenres(favouriteIds, allMedia);
  const favDecay =
    favouriteIds.length > 0
      ? favouriteIds.reduce((sum, id) => sum + recencyDecay(savedAtMap[id]), 0) /
        favouriteIds.length
      : 0.75;

  add(
    "fav_genre",
    weightedOverlap(itemGenres, favGenres, genreWeights) *
      W.FAV_GENRE_MATCH *
      favDecay,
  );

  // ── 2. SEARCH HISTORY (with token matching) ───────────────
  const recentSearches = searchHistory.slice(-10);
  const last3 = searchHistory.slice(-3);

  for (const query of recentSearches) {
    const bonus = last3.includes(query) ? W.SEARCH_RECENCY : 0;
    const title = item.title ?? item.name ?? "";

    if (fuzzy(title, query)) add("search_title", W.SEARCH_TITLE + bonus);

    if (itemGenres.some((g) => fuzzy(g, query)))
      add("search_genre", W.SEARCH_GENRE + bonus);

    // Token-level overview match — catches descriptive multi-word queries
    const tokenHits = tokenMatch(item, query);
    if (tokenHits > 0)
      add("search_token", tokenHits * (W.SEARCH_TOKEN + bonus));
  }

  // ── 3. LIBRARY (with recency decay) ──────────────────────
  const libDecay =
    libraryIds.length > 0
      ? libraryIds.reduce((sum, id) => sum + recencyDecay(savedAtMap[id]), 0) /
        libraryIds.length
      : 0.75;

  const libGenres = collectGenres(libraryIds, allMedia);
  add(
    "lib_genre",
    weightedOverlap(itemGenres, libGenres, genreWeights) *
      W.LIB_GENRE_MATCH *
      libDecay,
  );

  // ── 4. CLICK BEHAVIOUR ───────────────────────────────────
  const clickIds = clickLog.map((c) => c.id);
  const recentClicks = clickIds.slice(-5);
  const clickCount = clickIds.filter((id) => id === item.id).length;

  add("click_direct", Math.min(clickCount, 3) * W.CLICK_DIRECT);
  if (recentClicks.includes(item.id)) add("click_recency", W.CLICK_RECENCY);

  const recentClickGenres = collectGenres(recentClicks, allMedia);
  add(
    "click_genre",
    weightedOverlap(itemGenres, recentClickGenres, genreWeights) *
      W.CLICK_GENRE,
  );

  // ── 5. FIND FILTERS ──────────────────────────────────────
  if (profile.findFilters?.length) {
    const recentFinds = profile.findFilters.slice(-10);
    const last5Finds = profile.findFilters.slice(-5);

    for (const snap of recentFinds) {
      const isRecent = last5Finds.includes(snap);
      const recencyBonus = isRecent ? W.FIND_RECENCY : 0;

      const snapGenreNames = snap.genres
        .map((id) => TMDB_GENRES[id])
        .filter(Boolean) as string[];
      const genreHits = weightedOverlap(itemGenres, snapGenreNames, genreWeights);
      if (genreHits > 0)
        add("find_genre", genreHits * (W.FIND_GENRE_MATCH + recencyBonus));

      const excludeNames = snap.excludeGenres
        .map((id) => TMDB_GENRES[id])
        .filter(Boolean) as string[];
      const excludeHits = overlap(itemGenres, excludeNames);
      if (excludeHits > 0) {
        const penalty = excludeHits * 15;
        breakdown["find_exclude"] = (breakdown["find_exclude"] ?? 0) - penalty;
        total -= penalty;
      }

      const titleText = (item.title ?? item.name ?? "").toLowerCase();
      const overviewText = (item.overview ?? "").toLowerCase();
      for (const kw of snap.keywords) {
        if (titleText.includes(kw) || overviewText.includes(kw))
          add("find_keyword", W.FIND_KEYWORD_MATCH + recencyBonus);
      }
    }
  }

  // ── 6. SOFT WATCHED PENALTY ──────────────────────────────
  //
  //  Instead of hard-excluding watched items, apply a heavy penalty so they
  //  only surface at the very bottom if nothing else is available.
  if (watchedIds?.includes(item.id)) {
    breakdown["watched_penalty"] = -W.WATCHED_PENALTY;
    total -= W.WATCHED_PENALTY;
  }

  return { total, breakdown };
}

// ── Diversity injection (improvement ③) ──────────────────────
//
//  After sorting by score, ensures no single genre exceeds MAX_GENRE_SHARE
//  (40%) of the final list. Overflow items are pushed to the end rather than
//  dropped — the user still sees them if they scroll.

function injectDiversity(items: ScoredItem[], limit: number): ScoredItem[] {
  const maxPerGenre = Math.ceil(limit * MAX_GENRE_SHARE);
  const genreCount: Record<string, number> = {};
  const primary: ScoredItem[] = [];
  const overflow: ScoredItem[] = [];

  for (const item of items) {
    const genres = deriveGenres(item);
    const dominant = genres[0]; // first genre treated as primary

    if (!dominant) {
      primary.push(item);
      continue;
    }

    const current = genreCount[dominant] ?? 0;
    if (current < maxPerGenre) {
      genreCount[dominant] = current + 1;
      primary.push(item);
    } else {
      overflow.push(item);
    }
  }

  return [...primary, ...overflow].slice(0, limit);
}

// ── Cold-start fallback (improvement ④) ──────────────────────
//
//  New users with < 3 saves get top-rated content sorted by a
//  Bayesian-style quality score: vote_average * log10(vote_count).
//  This surfaces genuinely popular items rather than obscure high-rated ones.

function coldStartRecommendations(
  allMedia: MediaItem[],
  opts: { limit: number; excludeIds: number[] },
): ScoredItem[] {
  const { limit, excludeIds } = opts;

  return allMedia
    .filter((m) => !excludeIds.includes(m.id))
    .filter((m) => (m.vote_count ?? 0) >= 100) // minimum credibility threshold
    .map((m) => {
      const rating = m.vote_average ?? 0;
      const votes = m.vote_count ?? 0;
      const qualityScore = rating * Math.log10(Math.max(votes, 10));
      return {
        ...m,
        score: Math.round(qualityScore * 10),
        breakdown: { cold_start: Math.round(qualityScore * 10) },
        reason: {
          label: "Popular & highly rated",
          type: "algo" as const,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
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

  const { allMedia, watchedIds } = profile;

  // ── Cold start: skip scoring, return quality fallback ─────
  if (isColdStart(profile)) {
    return coldStartRecommendations(allMedia, {
      limit,
      excludeIds: [
        ...excludeIds,
        ...(excludeWatched ? (watchedIds ?? []) : []),
      ],
    });
  }

  // Compute genre weights once — reused across all candidates (O(1) per item)
  const genreWeights = deriveGenreWeights(profile);

  const candidates = allMedia.filter((item) => {
    if (excludeIds.includes(item.id)) return false;
    // Watched items are no longer hard-excluded — soft penalty handles them
    if (filterGenre && !deriveGenres(item).includes(filterGenre)) return false;
    return true;
  });

  const scored: ScoredItem[] = candidates.map((item) => {
    const { total, breakdown } = scoreItem(item, profile, genreWeights);
    return {
      ...item,
      score: total,
      breakdown,
      reason: getPrimaryReason(breakdown, item, profile),
    };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  // Apply diversity cap so one genre can't flood the entire shelf
  return injectDiversity(sorted, limit);
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
  if (breakdown.search_token)
    return { label: "Matches your searches", type: "search" };
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