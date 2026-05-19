import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface NormalizedItem {
  media_type: string;
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface Era {
  min: number;
  max: number;
  weight: number;
  minVotes: number;
  dateParam: "primary_release_year" | "first_air_date_year";
}

// ─── Config ──────────────────────────────────────────────────────────────────

const POOL_SIZE = 20;
const POOL_REFILL_AT = 5;
const FETCH_BATCH = 5;

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

// ─── Pool ─────────────────────────────────────────────────────────────────────

const pool: NormalizedItem[] = [];
const seenIds = new Set<number>();
let refilling = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickWeighted(eras: Era[]): Era {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const era of eras) {
    r -= era.weight;
    if (r <= 0) return era;
  }
  return eras[eras.length - 1];
}

function normalize(item: MediaItem, media_type: string): NormalizedItem | null {
  const title = item.title ?? item.name;
  if (!item?.id || !title) return null;
  return {
    media_type,
    id: item.id,
    title,
    overview: item.overview ?? "",
    poster_path: item.poster_path ?? null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date ?? item.first_air_date ?? "",
  };
}

// ─── Single random fetch ──────────────────────────────────────────────────────

async function fetchOneRandom(): Promise<NormalizedItem | null> {
  const media_type = Math.random() < 0.55 ? "movie" : "tv";
  const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;
  const genres = media_type === "movie" ? MOVIE_GENRES : TV_GENRES;
  const era = pickWeighted(eras);
  const year = Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const sort = SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];
  const page = Math.floor(Math.random() * 10) + 1;

  try {
    const data = await tmdbFetch<{ results?: MediaItem[] }>(
      `/discover/${media_type}?language=en-US&sort_by=${sort}&${era.dateParam}=${year}` +
        `&with_genres=${genre}&vote_count.gte=${era.minVotes}&page=${page}`,
    );

    if (!data?.results?.length) return null;

    const valid = data.results.filter(
      (i) => i.poster_path && (i.vote_average ?? 0) > 5 && !seenIds.has(i.id),
    );

    if (!valid.length) return null;

    const item = valid[Math.floor(Math.random() * valid.length)];
    seenIds.add(item.id);
    return normalize(item, media_type);
  } catch {
    return null;
  }
}

// ─── Pool refill (fire and forget) ───────────────────────────────────────────

async function refillPool() {
  if (refilling) return;
  refilling = true;
  try {
    while (pool.length < POOL_SIZE) {
      const batch = await Promise.all(
        Array.from({ length: FETCH_BATCH }, () => fetchOneRandom()),
      );
      pool.push(...batch.filter((x): x is NormalizedItem => x !== null));
    }
  } finally {
    refilling = false;
  }
}

// ─── Fallback: trending ───────────────────────────────────────────────────────

async function fetchTrending(): Promise<NormalizedItem | null> {
  const media_type = Math.random() < 0.55 ? "movie" : "tv";
  try {
    const data = await tmdbFetch<{ results?: MediaItem[] }>(
      `/trending/${media_type}/week`,
    );
    if (!data?.results?.length) return null;
    const unseen = data.results.filter((i) => !seenIds.has(i.id));
    const item = unseen.length
      ? unseen[Math.floor(Math.random() * unseen.length)]
      : data.results[0];
    return normalize(item, media_type);
  } catch {
    return null;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  if (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(idx, 1);
    if (pool.length < POOL_REFILL_AT) refillPool();
    return NextResponse.json([item]);
  }

  refillPool();

  const item = (await fetchOneRandom()) ?? (await fetchTrending());

  if (!item) {
    return NextResponse.json({ error: "No results" }, { status: 503 });
  }

  return NextResponse.json([item]);
}
