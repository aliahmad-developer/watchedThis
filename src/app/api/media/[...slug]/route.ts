import { NextRequest, NextResponse } from "next/server";
import { fetchMediaById } from "@/lib/mediaDetails";
import { cache, TTL } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;

  if (!Array.isArray(slug) || slug.length < 3) {
    return NextResponse.json(
      { error: "Invalid route parameters" },
      { status: 400 },
    );
  }

  const media_type = slug[0];
  const id = slug[slug.length - 1];

  if (!media_type || !id) {
    return NextResponse.json(
      { error: "Missing media type or ID" },
      { status: 400 },
    );
  }

  if (!["movie", "tv"].includes(media_type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const cacheKey = `media:${media_type}:${id}`;
  const cached = cache.get<Record<string, unknown>>(cacheKey, TTL.DAY);

  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const payload = await fetchMediaById(media_type, Number(id));

    cache.set(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("TMDB API request failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch media data from TMDB" },
      { status: 500 },
    );
  }
}

