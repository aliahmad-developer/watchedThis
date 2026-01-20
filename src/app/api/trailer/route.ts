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
    return NextResponse.json({ error: "Missing mediaId or mediaType" }, { status: 400 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB API key is missing" }, { status: 500 });
  }

  try {
    const tmdbUrl = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const tmdbRes = await fetch(tmdbUrl);
    const tmdbData = await tmdbRes.json();

    const trailers = (tmdbData.results || []).filter(
      (vid: any) => vid.site === "YouTube" && vid.type === "Trailer"
    );

    const officialFirst = trailers.sort((a: any, b: any) => {
      if (a.official && !b.official) return -1;
      if (!a.official && b.official) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    if (officialFirst.length > 0) {
      const best = officialFirst[0];
      return NextResponse.json({ key: best.key, source: "tmdb" }, {
        status: 200,
        headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" }
      });
    }

    // Fallback to YouTube
    if (YOUTUBE_API_KEY && title) {
      const query = encodeURIComponent(`${title} ${year || ""} official trailer`);
      const ytUrl = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=1&q=${query}&key=${YOUTUBE_API_KEY}`;
      const ytRes = await fetch(ytUrl);
      const ytData = await ytRes.json();

      if (ytData.items?.length > 0) {
        const ytTrailer = ytData.items[0];
        return NextResponse.json({ key: ytTrailer.id.videoId, source: "youtube_fallback" }, {
          status: 200,
          headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" }
        });
      }
    }

    return NextResponse.json({ error: "No trailer found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch trailer", detail: err.message }, { status: 500 });
  }
}
