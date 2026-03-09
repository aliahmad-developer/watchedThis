import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY!;

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
    page: String(Math.floor(Math.random() * 5) + 1), // random page for variety
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
    const res = await fetch(`${TMDB_BASE}/discover/${mediaType}?${params}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}