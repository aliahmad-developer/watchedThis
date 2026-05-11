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
    // 1. TMDB FETCH (IMPORTANT FIX)
    // =========================
    const tmdbUrl = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}`;

    const tmdbRes = await fetch(tmdbUrl);
    const tmdbData = await tmdbRes.json();

    const videos = tmdbData.results || [];

    // ✅ DO NOT over-filter like before
    const youtubeVideos = videos.filter(
      (v: any) => v.site === "YouTube" && v.key,
    );

    if (youtubeVideos.length > 0) {
      const scored = youtubeVideos
        .map((v: any) => {
          let score = 0;

          // prioritize official content
          if (v.official) score += 3;

          // type importance (match TMDB behavior)
          if (v.type === "Trailer") score += 3;
          else if (v.type === "Teaser") score += 2;
          else if (v.type === "Featurette") score += 2;
          else if (v.type === "Clip") score += 1;

          // recency boost
          if (v.published_at) {
            score += new Date(v.published_at).getTime() / 1e12;
          }

          return { ...v, score };
        })
        .sort((a: any, b: any) => b.score - a.score);

      const best = scored[0];

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
    // 2. YOUTUBE FALLBACK
    // =========================
    if (YOUTUBE_API_KEY && title) {
      const queries = [
        `${title} ${year || ""} official trailer`,
        `${title} official trailer`,
        `${title} trailer`,
        `${title} teaser`,
      ];

      for (const q of queries) {
        const ytUrl = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
          q,
        )}&key=${YOUTUBE_API_KEY}`;

        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();

        if (ytData.items?.length) {
          const bestMatch =
            ytData.items.find((item: any) =>
              item.snippet?.title?.toLowerCase().includes("trailer"),
            ) || ytData.items[0];

          return NextResponse.json(
            {
              key: bestMatch.id.videoId,
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
