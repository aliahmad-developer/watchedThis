// src/app/api/trailer/route.ts

import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mediaId = url.searchParams.get("mediaId");
  const mediaType = url.searchParams.get("mediaType");
  const title = url.searchParams.get("title");
  const year = url.searchParams.get("year");

  if (!mediaId || !mediaType) {
    return NextResponse.json(
      { error: "Missing mediaId or mediaType" },
      { status: 400 },
    );
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key is missing" },
      { status: 500 },
    );
  }

  try {
    // =========================
    // 1. TMDB FETCH
    // =========================
    const tmdbUrl = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const tmdbRes = await fetch(tmdbUrl);
    const tmdbData = await tmdbRes.json();

    const videos = tmdbData.results || [];

    // ✅ expanded filter (important fix)
    const candidates = videos.filter((vid: any) => {
      return (
        vid.site === "YouTube" &&
        ["Trailer", "Teaser", "Clip"].includes(vid.type)
      );
    });

    // sort by best quality signals
    const sorted = candidates.sort((a: any, b: any) => {
      const scoreA =
        (a.official ? 2 : 0) +
        (a.type === "Trailer" ? 2 : 0) +
        (a.published_at ? new Date(a.published_at).getTime() : 0);

      const scoreB =
        (b.official ? 2 : 0) +
        (b.type === "Trailer" ? 2 : 0) +
        (b.published_at ? new Date(b.published_at).getTime() : 0);

      return scoreB - scoreA;
    });

    if (sorted.length > 0) {
      const best = sorted[0];

      return NextResponse.json(
        {
          key: best.key,
          source: "tmdb",
          type: best.type,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "s-maxage=86400, stale-while-revalidate",
          },
        },
      );
    }

    // =========================
    // 2. YOUTUBE FALLBACK (IMPROVED)
    // =========================
    if (YOUTUBE_API_KEY && title) {
      const queries = [
        `${title} ${year || ""} official trailer`,
        `${title} trailer`,
        `${title} final trailer`,
        `${title} teaser`,
      ];

      for (const q of queries) {
        const query = encodeURIComponent(q);

        const ytUrl = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=5&q=${query}&key=${YOUTUBE_API_KEY}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();

        if (ytData.items?.length) {
          // pick best match (avoid random junk videos)
          const bestMatch = ytData.items.find((item: any) =>
            item.snippet?.title?.toLowerCase().includes("trailer"),
          );

          const final = bestMatch || ytData.items[0];

          return NextResponse.json(
            {
              key: final.id.videoId,
              source: "youtube_fallback",
            },
            {
              status: 200,
              headers: {
                "Cache-Control": "s-maxage=86400, stale-while-revalidate",
              },
            },
          );
        }
      }
    }

    // =========================
    // 3. NOTHING FOUND
    // =========================
    return NextResponse.json({ error: "No trailer found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch trailer",
        detail: err.message,
      },
      { status: 500 },
    );
  }
}
