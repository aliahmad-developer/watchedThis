import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const TRAILER_CACHE_HEADER = "s-maxage=86400, stale-while-revalidate";

interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

interface TMDBVideosResponse {
  results?: TMDBVideo[];
}

interface YouTubeItem {
  id: { videoId: string };
  snippet: { title: string };
}

interface YouTubeSearchResponse {
  items?: YouTubeItem[];
}

// Key in header, never in the URL — keeps it out of server logs and proxy traces
async function youtubeSearch(
  query: string,
): Promise<YouTubeSearchResponse | null> {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const url =
      `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=5` +
      `&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "X-Goog-Api-Key": YOUTUBE_API_KEY },
    });
    if (!res.ok) return null;
    return res.json() as Promise<YouTubeSearchResponse>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  const mediaType = searchParams.get("mediaType");
  const title = searchParams.get("title");
  const year = searchParams.get("year");

  if (!mediaId || !mediaType) {
    return NextResponse.json(
      { error: "Missing mediaId or mediaType" },
      { status: 400 },
    );
  }

  try {
    // ── 1. TMDB videos ────────────────────────────────────────────────────────
    const tmdbData = await tmdbFetch<TMDBVideosResponse>(
      `/${mediaType}/${mediaId}/videos`,
    );

    const youtubeVideos = (tmdbData.results ?? []).filter(
      (v) => v.site === "YouTube" && v.key,
    );

    if (youtubeVideos.length > 0) {
      const best = youtubeVideos
        .map((v) => {
          let score = 0;
          if (v.official) score += 3;
          if (v.type === "Trailer") score += 3;
          else if (v.type === "Teaser") score += 2;
          else if (v.type === "Featurette") score += 2;
          else if (v.type === "Clip") score += 1;
          if (v.published_at)
            score += new Date(v.published_at).getTime() / 1e12;
          return { ...v, score };
        })
        .sort((a, b) => b.score - a.score)[0];

      return NextResponse.json(
        { key: best.key, source: "tmdb", type: best.type },
        { status: 200, headers: { "Cache-Control": TRAILER_CACHE_HEADER } },
      );
    }

    // ── 2. YouTube fallback ───────────────────────────────────────────────────
    if (YOUTUBE_API_KEY && title) {
      const queries = [
        `${title} ${year ?? ""} official trailer`,
        `${title} official trailer`,
        `${title} trailer`,
        `${title} teaser`,
      ];

      for (const q of queries) {
        const ytData = await youtubeSearch(q);
        if (ytData?.items?.length) {
          const best =
            ytData.items.find((item) =>
              item.snippet?.title?.toLowerCase().includes("trailer"),
            ) ?? ytData.items[0];

          return NextResponse.json(
            { key: best.id.videoId, source: "youtube_fallback" },
            { status: 200, headers: { "Cache-Control": TRAILER_CACHE_HEADER } },
          );
        }
      }
    }

    return NextResponse.json({ error: "No trailer found" }, { status: 404 });
  } catch (err: unknown) {
    console.error("[/api/trailer]", err);
    return NextResponse.json(
      { error: "Failed to fetch trailer" },
      { status: 500 },
    );
  }
}
