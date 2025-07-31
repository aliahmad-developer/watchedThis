// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key missing" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`
    );

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json({ error: errData.status_message }, { status: res.status });
    }

    const { results } = await res.json();

    // Limit to top 5 and get details for each (in parallel)
    const topResults = results
      .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")

    const detailedResults = await Promise.all(
      topResults.map(async (item: any) => {
        const detailRes = await fetch(
          `${TMDB_BASE}/${item.media_type}/${item.id}?api_key=${apiKey}&language=en-US`
        );
        const detail = await detailRes.json();

        return {
          id: item.id,
          media_type: item.media_type,
          title: item.title,
          name: item.name,
          original_name: item.original_name,
          poster_path: item.poster_path,
          release_date: item.release_date || item.first_air_date || null,
          runtime: item.media_type === "movie" ? detail.runtime : detail.episode_run_time?.[0] || null,
        };
      })
    );

    return NextResponse.json({ results: detailedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
