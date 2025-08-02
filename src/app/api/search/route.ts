// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const MAX_PAGES = 5; // You can raise this if needed

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
    let allResults: any[] = [];

    // Loop to fetch multiple pages
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}`
      );

      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json({ error: err.status_message }, { status: res.status });
      }

      const data = await res.json();
      const results = data.results || [];

      // Break early if no more results
      if (results.length === 0) break;

      allResults.push(...results);

      // Optional: break if we've fetched everything
      if (page >= data.total_pages) break;
    }

    // Filter only movie/tv with a valid title
    const filtered = allResults.filter(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        (item.title || item.name || item.original_name)
    );

    // Sort by popularity descending
    const sorted = filtered.sort((a, b) => b.popularity - a.popularity);

    // Fetch detailed info (runtime etc.)
    const detailedResults = await Promise.all(
      sorted.map(async (item) => {
        const detailRes = await fetch(
          `${TMDB_BASE}/${item.media_type}/${item.id}?api_key=${apiKey}&language=en-US`
        );

        if (!detailRes.ok) return null;

        const detail = await detailRes.json();

        return {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name || item.original_name || "Untitled",
          original_name: item.original_name,
          poster_path: item.poster_path,
          release_date: item.release_date || item.first_air_date || null,
          runtime:
            item.media_type === "movie"
              ? detail.runtime
              : detail.episode_run_time?.[0] || null,
          popularity: item.popularity,
        };
      })
    );

    // Remove any nulls (failed fetches)
    const cleaned = detailedResults.filter(Boolean);

    return NextResponse.json({ results: cleaned });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
