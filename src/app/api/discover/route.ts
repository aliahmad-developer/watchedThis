import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; expires: number }>();

async function cachedTmdbFetch(path: string): Promise<unknown> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && now < hit.expires) return hit.data;

  const data = await tmdbFetch<unknown>(path);
  cache.set(path, { data, expires: now + CACHE_TTL_MS });
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get("mediaType") ?? "movie";
  const isTV = mediaType === "tv";

  const params = new URLSearchParams({
    language: "en-US",
    sort_by: searchParams.get("sortBy") ?? "popularity.desc",
    "vote_count.gte": "50",
    "vote_average.gte": searchParams.get("minRating") ?? "0",
    "vote_average.lte": searchParams.get("maxRating") ?? "10",
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
    const data = await cachedTmdbFetch(
      `/discover/${mediaType}?${params.toString()}`,
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
