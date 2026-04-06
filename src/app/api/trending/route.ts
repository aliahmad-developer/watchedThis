import { NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";

const API_KEY = process.env.TMDB_API_KEY;
const CACHE_KEY = "trending:all:week";

export async function GET() {
  const cached = cache.get<{ results: unknown[] }>(CACHE_KEY, TTL.MEDIUM);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    if (!API_KEY) {
      throw new Error("TMDB_API_KEY is not configured");
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`
    );

    if (!res.ok) {
      throw new Error(`TMDB responded with ${res.status}`);
    }

    const data = await res.json();
    const result = { results: data.results.slice(0, 10) };

    cache.set(CACHE_KEY, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error("[/api/trending]", error);
    return NextResponse.json(
      { message: "Error fetching trending media", error: String(error) },
      { status: 500 }
    );
  }
}