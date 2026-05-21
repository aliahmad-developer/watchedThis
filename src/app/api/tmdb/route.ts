import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

const ALLOWED_PATHS = [
  "/movie/",
  "/tv/",
  "/find/",
  "/search/",
  "/discover/",
  "/trending/",
  "/genre/",
  "/person/",
];

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const params = req.nextUrl.searchParams.get("params") ?? "";

  if (!path) {
    return NextResponse.json({ error: "Missing path param" }, { status: 400 });
  }

  if (!ALLOWED_PATHS.some((allowed) => path.startsWith(allowed))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  const cacheKey = `tmdb:${path}:${params}`;
  const cached = cache.get<unknown>(cacheKey, TTL.MEDIUM);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  let extraParams: Record<string, string> = {};
  if (params) {
    try {
      extraParams = JSON.parse(params);
    } catch {
      return NextResponse.json(
        { error: "Invalid params JSON" },
        { status: 400 },
      );
    }
  }

  const qs = new URLSearchParams(extraParams).toString();
  const fullPath = qs ? `${path}?${qs}` : path;

  try {
    const data = await tmdbFetch<unknown>(fullPath);
    const isValidResponse =
      data &&
      typeof data === "object" &&
      !("error" in data) &&
      !("message" in data);
    if (isValidResponse) {
      cache.set(cacheKey, data, true);
    }
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error(`[/api/tmdb] path=${path}`, error);
    cache.invalidate(cacheKey);
    return NextResponse.json(
      { message: "Error fetching from TMDB", error: String(error) },
      { status: 502 },
    );
  }
}
