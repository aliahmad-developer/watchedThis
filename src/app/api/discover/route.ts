import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY!;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();

async function cachedFetch(url: string): Promise<unknown> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now < cached.expires) return cached.data;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  cache.set(url, { data, expires: now + CACHE_TTL_MS });
  return data;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get("mediaType") || "movie";
  const isTV = mediaType === "tv";

  const params = new URLSearchParams({
    api_key: KEY,
    language: "en-US",
    sort_by: searchParams.get("sortBy") || "popularity.desc",
    "vote_count.gte": "50",
    "vote_average.gte": searchParams.get("minRating") || "0",
    "vote_average.lte": searchParams.get("maxRating") || "10",
    page: String(Math.floor(Math.random() * 5) + 1),
  });

  const minYear = searchParams.get("minYear");
  const maxYear = searchParams.get("maxYear");
  const dateGteKey = isTV ? "first_air_date.gte" : "primary_release_date.gte";
  const dateLteKey = isTV ? "first_air_date.lte" : "primary_release_date.lte";
  if (minYear) params.set(dateGteKey, `${minYear}-01-01`);
  if (maxYear) params.set(dateLteKey, `${maxYear}-12-31`);

  const genres = searchParams.get("genres");
  if (genres) params.set("with_genres", genres);

  try {
    const url = `${TMDB_BASE}/discover/${mediaType}?${params}`;
    const data = await cachedFetch(url);

    if (!data) {
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}