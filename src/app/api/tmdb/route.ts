import { NextRequest, NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";

const TMDB_KEY = process.env.TMDB_API_KEY ?? "";
const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const path   = req.nextUrl.searchParams.get("path") ?? "";
  const params = req.nextUrl.searchParams.get("params") ?? "";

  if (!path) {
    return NextResponse.json({ error: "Missing path param" }, { status: 400 });
  }

  if (!TMDB_KEY) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured" }, { status: 500 });
  }

  // Build cache key from path + params so different queries cache separately
  const cacheKey = `tmdb:${path}:${params}`;
  const cached = cache.get<unknown>(cacheKey, TTL.MEDIUM);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set("api_key", TMDB_KEY);

    if (params) {
      try {
        const parsed = JSON.parse(params);
        for (const [k, v] of Object.entries(parsed)) {
          url.searchParams.set(k, v as string);
        }
      } catch {
        return NextResponse.json({ error: "Invalid params JSON" }, { status: 400 });
      }
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`TMDB responded with ${res.status}`);
    }

    const data = await res.json();
    cache.set(cacheKey, data);

    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error(`[/api/tmdb] path=${path}`, error);
    return NextResponse.json(
      { message: "Error fetching from TMDB", error: String(error) },
      { status: 502 }
    );
  }
}