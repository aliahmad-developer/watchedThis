// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const MAX_PAGES = 5; // Maximum pages to fetch per request
const RESULTS_PER_PAGE = 20; // TMDB's default page size

interface TMDBResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  original_name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  popularity: number;
  // Add other properties you need
}

interface DetailedResult {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  original_name?: string;
  poster_path?: string;
  release_date: string | null;
  runtime: number | null;
  popularity: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const pageParam = searchParams.get("page") || "1";
  const currentPage = parseInt(pageParam);

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key missing" }, { status: 500 });
  }

  try {
    let allResults: TMDBResult[] = [];
    let totalPages = 1;

    // Fetch pages in a window around the current page
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(currentPage + MAX_PAGES - 1, startPage + MAX_PAGES - 1);

    for (let page = startPage; page <= endPage; page++) {
      const res = await fetch(
        `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=${page}`
      );

      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json({ error: err.status_message }, { status: res.status });
      }

      const data = await res.json();
      const results: TMDBResult[] = data.results || [];

      // Set total pages from first response
      if (page === startPage) {
        totalPages = data.total_pages;
      }

      // Break early if no more results
      if (results.length === 0) break;

      allResults.push(...results);
    }

    // Filter and sort results
    const filtered = allResults.filter(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        (item.title || item.name || item.original_name)
    );

    const sorted = filtered.sort((a, b) => b.popularity - a.popularity);

    // Get only the results for the requested page
    const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
    const endIdx = startIdx + RESULTS_PER_PAGE;
    const pagedResults = sorted.slice(startIdx, endIdx);

    // Fetch detailed info only for the current page's results
    const detailedResults: (DetailedResult | null)[] = await Promise.all(
      pagedResults.map(async (item) => {
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

    const cleaned = detailedResults.filter(Boolean) as DetailedResult[];

    return NextResponse.json({ 
      results: cleaned,
      page: currentPage,
      total_pages: totalPages,
      has_more: currentPage < totalPages
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}