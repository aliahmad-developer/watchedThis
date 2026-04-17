import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY missing");

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
const FETCH_TIMEOUT_MS = 5000; 
const FETCH_BATCH = 5;      

const MOVIE_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 15, minVotes: 80,  dateParam: "primary_release_year" },
  { min: 2010, max: 2019,                     weight: 20, minVotes: 100, dateParam: "primary_release_year" },
  { min: 2000, max: 2009,                     weight: 18, minVotes: 80,  dateParam: "primary_release_year" },
  { min: 1990, max: 1999,                     weight: 15, minVotes: 60,  dateParam: "primary_release_year" },
  { min: 1980, max: 1989,                     weight: 12, minVotes: 40,  dateParam: "primary_release_year" },
  { min: 1960, max: 1979,                     weight: 10, minVotes: 25,  dateParam: "primary_release_year" },
  { min: 1920, max: 1959,                     weight: 10, minVotes: 10,  dateParam: "primary_release_year" },
];

const TV_ERAS: Era[] = [
  { min: 2020, max: new Date().getFullYear(), weight: 20, minVotes: 50, dateParam: "first_air_date_year" },
  { min: 2010, max: 2019,                     weight: 25, minVotes: 60, dateParam: "first_air_date_year" },
  { min: 2000, max: 2009,                     weight: 20, minVotes: 40, dateParam: "first_air_date_year" },
  { min: 1990, max: 1999,                     weight: 15, minVotes: 20, dateParam: "first_air_date_year" },
  { min: 1980, max: 1989,                     weight: 10, minVotes: 10, dateParam: "first_air_date_year" },
  { min: 1960, max: 1979,                     weight: 10, minVotes: 5,  dateParam: "first_air_date_year" },
];

const MOVIE_GENRES = [28,12,16,35,80,99,18,10751,14,36,27,10402,9648,10749,878,53,10752,37];
const TV_GENRES    = [10759,16,35,80,99,18,10751,10762,9648,10763,10764,10765,10766,10767,10768];
const SORT_ORDERS  = ["popularity.desc","vote_average.desc","vote_count.desc"];

// ─── Pool ─────────────────────────────────────────────────────────────────────

const pool: any[] = [];
const seenIds = new Set<number>();
let refilling = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickWeighted(eras: Era[]): Era {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const era of eras) { r -= era.weight; if (r <= 0) return era; }
  return eras[eras.length - 1];
}

function normalize(item: any, media_type: string) {
  const title = item.title || item.name;
  if (!item?.id || !title) return null;
  return {
    media_type,
    id: item.id,
    title,
    overview: item.overview ?? "",
    poster_path: item.poster_path ?? null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date || item.first_air_date || "",
  };
}

async function tmdbFetch(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Single random fetch (one round trip only) ────────────────────────────────

async function fetchOneRandom(): Promise<any | null> {
  const media_type = Math.random() < 0.55 ? "movie" : "tv";
  const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;
  const era = pickWeighted(eras);
  const year = Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;
  const genre = (media_type === "movie" ? MOVIE_GENRES : TV_GENRES)[
    Math.floor(Math.random() * (media_type === "movie" ? MOVIE_GENRES : TV_GENRES).length)
  ];
  const sort = SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];
  const page = Math.floor(Math.random() * 10) + 1; // skip probe, just pick a page

  const url =
    `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
    `&language=en-US&sort_by=${sort}&${era.dateParam}=${year}` +
    `&with_genres=${genre}&vote_count.gte=${era.minVotes}&page=${page}`;

  const data = await tmdbFetch(url);
  if (!data?.results?.length) return null;

  const valid = data.results.filter(
    (i: MediaItem) =>
      i.poster_path &&
      (i.vote_average ?? 0) > 5 &&
      !seenIds.has(i.id)
  );

  if (!valid.length) return null;

  const item = valid[Math.floor(Math.random() * valid.length)];
  seenIds.add(item.id);
  return normalize(item, media_type);
}

// ─── Pool refill (fire and forget) ───────────────────────────────────────────

async function refillPool() {
  if (refilling) return;
  refilling = true;

  try {
    while (pool.length < POOL_SIZE) {
      const batch = await Promise.all(
        Array.from({ length: FETCH_BATCH }, () => fetchOneRandom())
      );
      const valid = batch.filter(Boolean);
      pool.push(...valid);
    }
  } finally {
    refilling = false;
  }
}

// ─── Fallback: trending ───────────────────────────────────────────────────────

async function fetchTrending(): Promise<any | null> {
  const media_type = Math.random() < 0.55 ? "movie" : "tv";
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/trending/${media_type}/week?api_key=${TMDB_API_KEY}`
  );
  if (!data?.results?.length) return null;
  const unseen = data.results.filter((i: MediaItem) => !seenIds.has(i.id));
  const item = unseen.length
    ? unseen[Math.floor(Math.random() * unseen.length)]
    : data.results[0];
  return normalize(item, media_type);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  if (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(idx, 1);

    if (pool.length < POOL_REFILL_AT) {
      refillPool();
    }

    return NextResponse.json([item]);
  }

  refillPool(); // start filling in background

  const item = (await fetchOneRandom()) ?? (await fetchTrending());

  if (!item) {
    return NextResponse.json({ error: "No results" }, { status: 503 });
  }

  return NextResponse.json([item]);
}