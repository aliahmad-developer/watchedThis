import { NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";

const API_KEY = process.env.TMDB_ACCESS_TOKEN;
const CACHE_KEY = "trending:all:week";

export async function GET() {
  const cached = cache.get<{ results: unknown[] }>(CACHE_KEY, TTL.MEDIUM);

  if (cached?.results && Array.isArray(cached.results)) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    if (!API_KEY) {
      throw new Error("TMDB_ACCESS_TOKEN is not configured");
    }

    // API key passed as Bearer token — keeps it out of server logs and proxy URLs
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/week`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`TMDB responded with ${res.status}`);
    }

    const data = await res.json();
    const result = {
      results: Array.isArray(data?.results) ? data.results.slice(0, 10) : [],
    };
    cache.set(CACHE_KEY, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    console.error({
      level: "error",
      endpoint: "/api/trending",
      message: (error as Error).message,
    });
    return NextResponse.json(
      { message: "Error fetching trending media" },
      { status: 500 },
    );
  }
}
