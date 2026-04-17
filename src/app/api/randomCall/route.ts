import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  throw new Error("API_KEY is missing in environment variables");
}

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface DiscoverResponse {
  results?: MediaItem[];
  total_pages?: number;
}

interface Era {
  min: number;
  max: number;
  weight: number;
  minVotes: number;
  dateParam: "primary_release_year" | "first_air_date_year";
}

// ─────────────────────────────────────────────
// NORMALIZER (FIXED POSITION)
// ─────────────────────────────────────────────
function normalize(item: any, media_type: string) {
  if (!item?.id) return null;

  const title = item.title || item.name;
  if (!title) return null;

  return {
    media_type,
    id: item.id,
    title,
    overview: item.overview,
    poster_path: item.poster_path,
    vote_average: item.vote_average,
    release_date: item.release_date || item.first_air_date,
  };
}

// ─────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 50;
const cache = new Map<string, CacheEntry>();

function getCacheKey(count: number, entropy?: string) {
  const t = entropy || Date.now().toString(36);
  return `random_${count}_${t}`;
}

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCached(key: string, data: any[]) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, { data, timestamp: Date.now() });
}

// ─────────────────────────────────────────────
// ERAS
// ─────────────────────────────────────────────
const MOVIE_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 15, minVotes: 80, dateParam: "primary_release_year" },
  { min: 2010, max: 2019, weight: 20, minVotes: 100, dateParam: "primary_release_year" },
  { min: 2000, max: 2009, weight: 18, minVotes: 80, dateParam: "primary_release_year" },
  { min: 1990, max: 1999, weight: 15, minVotes: 60, dateParam: "primary_release_year" },
  { min: 1980, max: 1989, weight: 12, minVotes: 40, dateParam: "primary_release_year" },
  { min: 1960, max: 1979, weight: 10, minVotes: 25, dateParam: "primary_release_year" },
  { min: 1920, max: 1959, weight: 10, minVotes: 10, dateParam: "primary_release_year" },
];

const TV_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 20, minVotes: 50, dateParam: "first_air_date_year" },
  { min: 2010, max: 2019, weight: 25, minVotes: 60, dateParam: "first_air_date_year" },
  { min: 2000, max: 2009, weight: 20, minVotes: 40, dateParam: "first_air_date_year" },
  { min: 1990, max: 1999, weight: 15, minVotes: 20, dateParam: "first_air_date_year" },
  { min: 1980, max: 1989, weight: 10, minVotes: 10, dateParam: "first_air_date_year" },
  { min: 1960, max: 1979, weight: 10, minVotes: 5, dateParam: "first_air_date_year" },
];

// ─────────────────────────────────────────────
// GENRES / SORT
// ─────────────────────────────────────────────
const MOVIE_GENRES = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53,
  10752, 37,
];

const TV_GENRES = [
  10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766,
  10767, 10768,
];

const SORT_ORDERS = [
  "popularity.desc",
  "vote_average.desc",
  "vote_count.desc",
  "revenue.desc",
  "primary_release_date.desc",
];

// ─────────────────────────────────────────────
// HELPERS (FIXED)
// ─────────────────────────────────────────────
const pickWeightedEra = (eras: Era[]) => {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;

  for (const era of eras) {
    r -= era.weight;
    if (r <= 0) return era;
  }

  return eras[eras.length - 1];
};

const randomYearInEra = (era: Era) =>
  Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;

const pickRandomGenre = (genres: number[]) =>
  genres[Math.floor(Math.random() * genres.length)];

const pickRandomSort = () =>
  SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];

// ─────────────────────────────────────────────
// FETCH WITH RETRY
// ─────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  retries = 2,
  delayMs = 400,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * 2 ** i));
    }
  }

  throw new Error("Fetch failed");
}

// ─────────────────────────────────────────────
// CORE FETCH
// ─────────────────────────────────────────────
async function fetchOneRandom(seenIds: Set<number>, logContext: string) {
  const media_type = Math.random() < 0.55 ? "movie" : "tv";
  const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;

  const era = pickWeightedEra(eras);
  const year = randomYearInEra(era);
  const genre = pickRandomGenre(
    media_type === "movie" ? MOVIE_GENRES : TV_GENRES,
  );
  const sort = pickRandomSort();

  try {
    const baseUrl =
      `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
      `&language=en-US&sort_by=${sort}` +
      `&${era.dateParam}=${year}` +
      `&with_genres=${genre}` +
      `&vote_count.gte=${era.minVotes}`;

    const probeRes = await fetchWithRetry(`${baseUrl}&page=1`);

    if (probeRes.ok) {
      const probeData: DiscoverResponse = await probeRes.json();

      const totalPages = Math.min(probeData.total_pages ?? 1, 500);
      const page = Math.floor(Math.random() * totalPages) + 1;

      const pageRes =
        page === 1
          ? probeRes
          : await fetchWithRetry(`${baseUrl}&page=${page}`);

      if (pageRes.ok) {
        const pageData: DiscoverResponse = await pageRes.json();

        const validItems = (pageData.results || []).filter(
          (item) =>
            item.poster_path &&
            (item.vote_average ?? 0) > 5 &&
            !seenIds.has(item.id),
        );

        if (validItems.length) {
          const item = validItems[Math.floor(Math.random() * validItems.length)];

          seenIds.add(item.id);

          const normalized = normalize(item, media_type);
          if (normalized) return normalized;

          // Relaxed fallback for this page
          return {
            media_type,
            id: item.id,
            title: item.title || item.name || `Movie/TV #${item.id}`,
            overview: item.overview || '',
            poster_path: item.poster_path || null,
            vote_average: item.vote_average || 0,
            release_date: item.release_date || item.first_air_date || '',
          };
        }
      }
    }
  } catch {
    console.error({ stage: "discover", context: logContext });
  }

  // fallback random ID
  const MAX_ID = 500_000;

  for (let attempt = 0; attempt < 2; attempt++) {
    const id = Math.floor(Math.random() * MAX_ID) + 1;
    if (seenIds.has(id)) continue;

    try {
      const res = await fetchWithRetry(
        `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
        2,
      );

      if (res.ok) {
        const item: MediaItem = await res.json();

        if (
          (item.poster_path || true) &&
          (item.vote_average ?? 0) > 4 &&
          (item.title || item.name)
        ) {
          seenIds.add(id);

          return normalize(item, media_type);
        }
      }
    } catch {}
  }

  // trending
  try {
    const res = await fetchWithRetry(
      `https://api.themoviedb.org/3/trending/${media_type}/week?api_key=${TMDB_API_KEY}`,
    );

    if (res.ok) {
      const data: DiscoverResponse = await res.json();
      const items = (data.results || []).filter((i) => !seenIds.has(i.id));

      if (items.length) {
        const item = items[Math.floor(Math.random() * items.length)];
        seenIds.add(item.id);

        return normalize(item, media_type);
      } else if (data.results && data.results.length > 0) {
        // Force first trending if no unseen
        const item = data.results[0];
        return normalize(item, media_type);
      }
    }
  } catch {}

  return null;
}

// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(Number(searchParams.get("count") || 1), 20);
    const entropy = searchParams.get("t") || '';

    const cacheKey = getCacheKey(count, entropy);
    const cached = getCached(cacheKey);

    if (cached && cached.length === count) {
      return NextResponse.json(cached);
    }

    const seenIds = new Set<number>();
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const item = await fetchOneRandom(seenIds, `batch_${i}`);
      if (item) results.push(item);

      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, 80));
      }
    }

    setCached(cacheKey, results);

    return NextResponse.json(results);
  } catch (error) {
    console.error({ stage: "handler", error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
