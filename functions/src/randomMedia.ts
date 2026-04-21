import { MediaItem } from "./dailyMedia";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

interface DiscoverResponse {
  results?: RawMedia[];
  total_pages?: number;
}

interface RawMedia {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

// ── Eras ──────────────────────────────────────────────────────────────────────
type Era = {
  min: number;
  max: number;
  weight: number;
  minVotes: number;
  dateParam: "primary_release_year" | "first_air_date_year";
};

const MOVIE_ERAS: Era[] = [
  {
    min: 2020,
    max: new Date().getFullYear(),
    weight: 15,
    minVotes: 80,
    dateParam: "primary_release_year",
  },
  {
    min: 2010,
    max: 2019,
    weight: 20,
    minVotes: 100,
    dateParam: "primary_release_year",
  },
  {
    min: 2000,
    max: 2009,
    weight: 18,
    minVotes: 80,
    dateParam: "primary_release_year",
  },
  {
    min: 1990,
    max: 1999,
    weight: 15,
    minVotes: 60,
    dateParam: "primary_release_year",
  },
  {
    min: 1980,
    max: 1989,
    weight: 12,
    minVotes: 40,
    dateParam: "primary_release_year",
  },
  {
    min: 1960,
    max: 1979,
    weight: 10,
    minVotes: 25,
    dateParam: "primary_release_year",
  },
  {
    min: 1920,
    max: 1959,
    weight: 10,
    minVotes: 10,
    dateParam: "primary_release_year",
  },
];

const TV_ERAS: Era[] = [
  {
    min: 2020,
    max: new Date().getFullYear(),
    weight: 20,
    minVotes: 50,
    dateParam: "first_air_date_year",
  },
  {
    min: 2010,
    max: 2019,
    weight: 25,
    minVotes: 60,
    dateParam: "first_air_date_year",
  },
  {
    min: 2000,
    max: 2009,
    weight: 20,
    minVotes: 40,
    dateParam: "first_air_date_year",
  },
  {
    min: 1990,
    max: 1999,
    weight: 15,
    minVotes: 20,
    dateParam: "first_air_date_year",
  },
  {
    min: 1980,
    max: 1989,
    weight: 10,
    minVotes: 10,
    dateParam: "first_air_date_year",
  },
  {
    min: 1960,
    max: 1979,
    weight: 10,
    minVotes: 5,
    dateParam: "first_air_date_year",
  },
];

const MOVIE_GENRES = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53,
  10752, 37,
];
const TV_GENRES = [
  10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766,
  10767, 10768,
];
const SORT_ORDERS = ["popularity.desc", "vote_average.desc", "vote_count.desc"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickWeightedEra(eras: Era[]): Era {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const era of eras) {
    r -= era.weight;
    if (r <= 0) return era;
  }
  return eras[eras.length - 1];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
      // Don't retry 401/403 — key issue, fail fast
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `TMDB auth failed: ${res.status} — check TMDB_API_KEY on Cloud Run`,
        );
      }
    } catch (err: any) {
      console.error(
        `[randomMedia] fetch attempt ${i + 1} failed:`,
        err?.message,
      );
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 400 * 2 ** i));
    }
  }
  throw new Error("fetchWithRetry exhausted");
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function getRandomMedia(
  seenIds = new Set<number>(),
  count = 1,
): Promise<MediaItem[]> {
  // Fail fast if key is missing — don't waste time on doomed requests
  if (!TMDB_API_KEY) {
    throw new Error(
      "TMDB_API_KEY is not set — add it to Cloud Run environment variables",
    );
  }

  const results: MediaItem[] = [];
  const maxAttempts = count * 8; // generous attempts to find unseen items

  for (let i = 0; i < maxAttempts && results.length < count; i++) {
    const media_type = Math.random() < 0.55 ? "movie" : "tv";
    const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;
    const era = pickWeightedEra(eras);
    const year = randomInt(era.min, era.max);
    const genre = pick(media_type === "movie" ? MOVIE_GENRES : TV_GENRES);
    const sort = pick(SORT_ORDERS);
    const page = randomInt(1, 10);

    const url =
      `${TMDB_BASE}/discover/${media_type}?api_key=${TMDB_API_KEY}` +
      `&language=en-US&sort_by=${sort}&${era.dateParam}=${year}` +
      `&with_genres=${genre}&vote_count.gte=${era.minVotes}&page=${page}`;

    try {
      const res = await fetchWithRetry(url);
      const data: DiscoverResponse = await res.json();

      const valid = (data.results ?? []).filter(
        (item) =>
          item.poster_path &&
          (item.vote_average ?? 0) > 5 &&
          !seenIds.has(item.id),
      );

      if (!valid.length) continue;

      const item = pick(valid);
      seenIds.add(item.id);

      results.push({
        media_type,
        id: item.id,
        title: item.title || item.name || "Unknown",
        overview: item.overview || "",
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date || "",
      });
    } catch (err: any) {
      console.error(`[randomMedia] attempt ${i + 1} error:`, err?.message);
      // If it's an auth error, stop immediately
      if (err?.message?.includes("TMDB auth failed")) throw err;
      // Otherwise continue to next attempt
    }
  }

  return results.slice(0, count);
}
