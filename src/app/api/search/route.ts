// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const RESULTS_PER_PAGE = 20;

interface TMDBResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  original_name?: string;
  original_title?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  popularity: number;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  genre_ids?: number[];
}

interface DetailedResult {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  original_name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date: string | null;
  runtime: number | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
  overview: string;
  genres: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildScore(item: TMDBResult, query: string): number {
  const title = (item.title || item.name || "").toLowerCase();
  const q = query.toLowerCase();
  let score = item.popularity ?? 0;

  // Exact title match — big boost
  if (title === q) score += 5000;
  // Starts with query
  else if (title.startsWith(q)) score += 2000;
  // Contains query
  else if (title.includes(q)) score += 500;

  // Vote weight — reward well-rated content with enough votes
  if ((item.vote_count ?? 0) > 100) {
    score += (item.vote_average ?? 0) * 80;
  }

  return score;
}

function deduplicateByScore(
  results: (TMDBResult & { _score: number })[]
): (TMDBResult & { _score: number })[] {
  const seen = new Map<number, TMDBResult & { _score: number }>();
  for (const item of results) {
    const existing = seen.get(item.id);
    if (!existing || item._score > existing._score) {
      seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

// Safe fetch — returns [] on any failure, never throws
async function fetchSearchPage(
  url: string,
  mediaType?: "movie" | "tv"
): Promise<TMDBResult[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results: TMDBResult[] = data.results || [];
    if (mediaType) {
      return results.map((r) => ({ ...r, media_type: mediaType }));
    }
    return results.filter(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );
  } catch {
    return [];
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  const pageParam = searchParams.get("page") || "1";
  const currentPage = Math.max(1, parseInt(pageParam));

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key missing" }, { status: 500 });
  }

  try {
    const enc = encodeURIComponent(query);
    const base = `api_key=${apiKey}&language=en-US`;

    // ── Multi-strategy parallel search ────────────────────────────────────────
    // Strategy 1 — multi search pages 1–3 (broadest, catches everything)
    // Strategy 2 — dedicated movie + tv endpoints (surface results multi misses)
    // Strategy 3 — broad fallback using first 2 words (for long queries)
    // Strategy 4 — year-aware search (e.g. "Inception 2010")

    const tasks: Promise<TMDBResult[]>[] = [
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=1`),
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=2`),
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=3`),
      fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${enc}&page=1`, "movie"),
      fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${enc}&page=2`, "movie"),
      fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${enc}&page=1`, "tv"),
      fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${enc}&page=2`, "tv"),
    ];

    // Broad fallback — first 2 words for 4+ word queries
    const words = query.split(/\s+/);
    if (words.length >= 4) {
      const broad = encodeURIComponent(words.slice(0, 2).join(" "));
      tasks.push(
        fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${broad}&page=1`),
        fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${broad}&page=1`, "movie"),
        fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${broad}&page=1`, "tv")
      );
    }

    // Year-aware fallback — "Inception 2010" → search "Inception" filtered by year
    const yearMatch = query.match(/^(.*?)\s+(\d{4})$/);
    if (yearMatch) {
      const stripped = encodeURIComponent(yearMatch[1].trim());
      const year = yearMatch[2];
      tasks.push(
        fetchSearchPage(
          `${TMDB_BASE}/search/movie?${base}&query=${stripped}&primary_release_year=${year}&page=1`,
          "movie"
        ),
        fetchSearchPage(
          `${TMDB_BASE}/search/tv?${base}&query=${stripped}&first_air_date_year=${year}&page=1`,
          "tv"
        )
      );
    }

    // All strategies run in parallel — latency = slowest single request
    const batches = await Promise.all(tasks);
    const allRaw = batches.flat();

    // Score, deduplicate, sort
    const scored = allRaw
      .filter((item) => item.title || item.name || item.original_name)
      .map((item) => ({ ...item, _score: buildScore(item, query) }));

    const deduped = deduplicateByScore(scored);
    const sorted = deduped.sort((a, b) => b._score - a._score);

    // Paginate before fetching details (avoids fetching details for unneeded pages)
    const totalResults = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
    const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
    const pageSlice = sorted.slice(startIdx, startIdx + RESULTS_PER_PAGE);

    if (pageSlice.length === 0) {
      return NextResponse.json({
        results: [],
        page: currentPage,
        total_pages: totalPages,
        has_more: false,
      });
    }

    // Fetch full details in parallel for this page only
    const detailedResults = await Promise.all(
      pageSlice.map(async (item): Promise<DetailedResult | null> => {
        try {
          const res = await fetch(
            `${TMDB_BASE}/${item.media_type}/${item.id}?${base}`
          );
          if (!res.ok) return null;
          const detail = await res.json();

          // TV runtime: try multiple fields in priority order
          const tvRuntime =
            detail.episode_run_time?.[0] ??
            detail.episode_run_time?.[1] ??
            detail.runtime ??
            null;

          const runtime =
            item.media_type === "movie"
              ? detail.runtime ?? null
              : tvRuntime;

          const genres: string[] =
            detail.genres?.map((g: { name: string }) => g.name) ?? [];

          return {
            id: item.id,
            media_type: item.media_type,
            title: item.title || item.name || item.original_name || "Untitled",
            original_name: item.original_name || item.original_title || undefined,
            poster_path: item.poster_path ?? null,
            backdrop_path: item.backdrop_path ?? null,
            release_date: item.release_date || item.first_air_date || null,
            runtime,
            popularity: item.popularity,
            vote_average: detail.vote_average ?? 0,
            vote_count: detail.vote_count ?? 0,
            overview: detail.overview || item.overview || "",
            genres,
          };
        } catch {
          return null;
        }
      })
    );

    const cleaned = detailedResults.filter(Boolean) as DetailedResult[];

    return NextResponse.json({
      results: cleaned,
      page: currentPage,
      total_pages: totalPages,
      has_more: currentPage < totalPages,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}