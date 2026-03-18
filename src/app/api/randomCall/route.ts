import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  total_pages?: number;
}

interface DiscoverResponse {
  results?: MediaItem[];
  total_pages?: number;
}

// ─── era selection ────────────────────────────────────────────────────────────

/**
 * Weighted era picker — older decades get a fair share rather than being
 * starved by the volume of recent content on TMDB.
 *
 * Each era also gets a vote_count threshold tuned to its era: older films
 * have fewer votes by nature so a flat >=100 filter kills most of them.
 */
interface Era {
  min: number;
  max: number;
  weight: number;
  minVotes: number;
  // TMDB discover uses different date params for movie vs tv
  dateParam: "primary_release_year" | "first_air_date_year";
}

const MOVIE_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 15, minVotes: 80,  dateParam: "primary_release_year" },
  { min: 2010, max: 2019,                    weight: 20, minVotes: 100, dateParam: "primary_release_year" },
  { min: 2000, max: 2009,                    weight: 18, minVotes: 80,  dateParam: "primary_release_year" },
  { min: 1990, max: 1999,                    weight: 15, minVotes: 60,  dateParam: "primary_release_year" },
  { min: 1980, max: 1989,                    weight: 12, minVotes: 40,  dateParam: "primary_release_year" },
  { min: 1960, max: 1979,                    weight: 10, minVotes: 25,  dateParam: "primary_release_year" },
  { min: 1920, max: 1959,                    weight: 10, minVotes: 10,  dateParam: "primary_release_year" },
];

const TV_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 20, minVotes: 50,  dateParam: "first_air_date_year" },
  { min: 2010, max: 2019,                    weight: 25, minVotes: 60,  dateParam: "first_air_date_year" },
  { min: 2000, max: 2009,                    weight: 20, minVotes: 40,  dateParam: "first_air_date_year" },
  { min: 1990, max: 1999,                    weight: 15, minVotes: 20,  dateParam: "first_air_date_year" },
  { min: 1980, max: 1989,                    weight: 10, minVotes: 10,  dateParam: "first_air_date_year" },
  { min: 1960, max: 1979,                    weight: 10, minVotes: 5,   dateParam: "first_air_date_year" },
];

const pickWeightedEra = (eras: Era[]): Era => {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const era of eras) {
    r -= era.weight;
    if (r <= 0) return era;
  }
  return eras[eras.length - 1];
};

const randomYearInEra = (era: Era): number =>
  Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;

// ─── genre randomization ──────────────────────────────────────────────────────

// A broad set of genre IDs — randomly picking one pushes discover into
// different slices of the catalogue each call.
const MOVIE_GENRES = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37];
const TV_GENRES   = [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766, 10767, 10768];

const pickRandomGenre = (genres: number[]): number =>
  genres[Math.floor(Math.random() * genres.length)];

// ─── sort order randomization ─────────────────────────────────────────────────

// Rotating sort orders exposes different slices of the same year/genre bucket.
const SORT_ORDERS = [
  "popularity.desc",
  "vote_average.desc",
  "vote_count.desc",
  "revenue.desc",        // movies only but harmless for tv
  "primary_release_date.desc",
];

const pickRandomSort = (): string =>
  SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];

// ─── network ──────────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  retries = 3,
  delayMs = 400,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * 2 ** i));
    }
  }
  throw new Error("Unreachable");
}

// ─── core fetch ───────────────────────────────────────────────────────────────

async function fetchOneRandom(seenIds: Set<number>) {
  const media_type = Math.random() < 0.55 ? "movie" : "tv"; // slight movie bias
  const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;
  const era = pickWeightedEra(eras);
  const year = randomYearInEra(era);
  const genre = pickRandomGenre(media_type === "movie" ? MOVIE_GENRES : TV_GENRES);
  const sort = pickRandomSort();

  // ── 1. discover with randomized parameters ────────────────────────────────
  try {
    // First probe: get total_pages so we can pick a truly random page
    const probeUrl =
      `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
      `&language=en-US&sort_by=${sort}` +
      `&${era.dateParam}=${year}` +
      `&with_genres=${genre}` +
      `&vote_count.gte=${era.minVotes}` +
      `&page=1`;

    const probeRes = await fetchWithRetry(probeUrl);
    if (probeRes.ok) {
      const probeData: DiscoverResponse = await probeRes.json();
      // TMDB caps at 500 pages regardless of total_pages value
      const availablePages = Math.min(probeData.total_pages ?? 1, 500);
      const page = Math.floor(Math.random() * availablePages) + 1;

      // If page 1 already has results and we randomly picked page 1, use it directly
      const pageData: DiscoverResponse =
        page === 1
          ? probeData
          : await fetchWithRetry(
              `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
              `&language=en-US&sort_by=${sort}` +
              `&${era.dateParam}=${year}` +
              `&with_genres=${genre}` +
              `&vote_count.gte=${era.minVotes}` +
              `&page=${page}`,
            ).then((r) => (r.ok ? r.json() : { results: [] }));

      const validItems = (pageData.results ?? []).filter(
        (item) =>
          item.poster_path &&
          (item.vote_average ?? 0) > 5 &&
          !seenIds.has(item.id),
      );

      if (validItems.length > 0) {
        // Pick randomly from the page rather than always taking index 0
        const item = validItems[Math.floor(Math.random() * validItems.length)];
        seenIds.add(item.id);
        return {
          media_type,
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date,
          year,
          source: "discover",
        };
      }
    }
  } catch (err) {
    console.error("Discover fetch failed:", err);
  }

  // ── 2. fallback: random ID ────────────────────────────────────────────────
  // Only used if discover returns nothing (rare genre+era combo).
  // ID range is tightened to ~500K which is where the bulk of valid entries sit.
  const MAX_ID = 500_000;
  for (let i = 0; i < 4; i++) {
    const randomId = Math.floor(Math.random() * MAX_ID) + 1;
    if (seenIds.has(randomId)) continue;

    try {
      const res = await fetchWithRetry(
        `https://api.themoviedb.org/3/${media_type}/${randomId}?api_key=${TMDB_API_KEY}&language=en-US`,
        2,
        300,
      );
      if (res.ok) {
        const json: MediaItem = await res.json();
        const hasTitle = json.title || json.name;
        if (hasTitle && json.poster_path && (json.vote_average ?? 0) > 5) {
          seenIds.add(randomId);
          return {
            media_type,
            id: randomId,
            title: json.title || json.name,
            overview: json.overview,
            poster_path: json.poster_path,
            vote_average: json.vote_average,
            release_date: json.release_date || json.first_air_date,
            year: json.release_date
              ? new Date(json.release_date).getFullYear()
              : json.first_air_date
              ? new Date(json.first_air_date).getFullYear()
              : null,
            source: "random_id",
          };
        }
      }
    } catch (err) {
      console.error(`Random ID attempt ${i + 1} failed:`, err);
    }
  }

  // ── 3. final fallback: trending ───────────────────────────────────────────
  try {
    const res = await fetchWithRetry(
      `https://api.themoviedb.org/3/trending/${media_type}/week?api_key=${TMDB_API_KEY}`,
    );
    if (res.ok) {
      const data: DiscoverResponse = await res.json();
      const items = (data.results ?? []).filter((i) => !seenIds.has(i.id));
      if (items.length > 0) {
        const item = items[Math.floor(Math.random() * items.length)];
        seenIds.add(item.id);
        return {
          media_type,
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date,
          year: item.release_date
            ? new Date(item.release_date).getFullYear()
            : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : null,
          source: "trending",
        };
      }
    }
  } catch (err) {
    console.error("Trending fallback failed:", err);
  }

  return null;
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(parseInt(searchParams.get("count") ?? "1", 10), 20);

    // Shared set passed into every parallel call so duplicates are avoided
    // even across concurrent fetches within the same batch request.
    const seenIds = new Set<number>();

    if (count === 1) {
      const result = await fetchOneRandom(seenIds);
      if (!result) {
        return NextResponse.json(
          { error: "Could not find valid random media. Please try again." },
          { status: 503 },
        );
      }
      return NextResponse.json(result);
    }

    // Batch: run in parallel but stagger slightly to avoid TMDB rate limits
    const results = await Promise.allSettled(
      Array.from({ length: count }, (_, i) =>
        new Promise<any>((resolve) =>
          setTimeout(() => fetchOneRandom(seenIds).then(resolve), i * 50),
        ),
      ),
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error in random media endpoint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}