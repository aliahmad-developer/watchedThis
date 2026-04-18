import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const RESULTS_PER_PAGE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();

async function cachedFetch(url: string): Promise<unknown> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now < cached.expires) return cached.data;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  cache.set(url, { data, expires: now + CACHE_TTL_MS });
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────
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
  if (title === q) score += 5000;
  else if (title.startsWith(q)) score += 2000;
  else if (title.includes(q)) score += 500;
  if ((item.vote_count ?? 0) > 100) score += (item.vote_average ?? 0) * 80;
  return score;
}

function deduplicateByScore(
  results: (TMDBResult & { _score: number })[]
): (TMDBResult & { _score: number })[] {
  const seen = new Map<number, TMDBResult & { _score: number }>();
  for (const item of results) {
    const existing = seen.get(item.id);
    if (!existing || item._score > existing._score) seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

async function fetchSearchPage(
  url: string,
  mediaType?: "movie" | "tv"
): Promise<TMDBResult[]> {
  try {
    const data = await cachedFetch(url) as { results?: TMDBResult[] } | null;
    if (!data) return [];
    const results: TMDBResult[] = data.results || [];
    if (mediaType) return results.map((r) => ({ ...r, media_type: mediaType }));
    return results.filter(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );
  } catch {
    return [];
  }
}

async function fetchDetails(
  item: TMDBResult,
  apiKey: string
): Promise<DetailedResult | null> {
  try {
    const url = `${TMDB_BASE}/${item.media_type}/${item.id}?api_key=${apiKey}&language=en-US`;
    const detail = await cachedFetch(url) as {
      runtime?: number;
      episode_run_time?: number[];
      vote_average?: number;
      vote_count?: number;
      overview?: string;
      genres?: { name: string }[];
    } | null;

    if (!detail) return null;

    const runtime =
      item.media_type === "movie"
        ? detail.runtime ?? null
        : detail.episode_run_time?.[0] ?? detail.runtime ?? null;

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
      genres: detail.genres?.map((g) => g.name) ?? [],
    };
  } catch {
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  const keyword = searchParams.get("keyword")?.trim();
  const pageParam = searchParams.get("page") || "1";
  const currentPage = Math.max(1, parseInt(pageParam));

  if (!query && !keyword) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key missing" },
      { status: 500 }
    );
  }

  const base = `api_key=${apiKey}&language=en-US`;

  try {
    // ── Keyword mode ──────────────────────────────────────────────────────────
    if (keyword) {
      const kwUrl = `${TMDB_BASE}/search/keyword?api_key=${apiKey}&query=${encodeURIComponent(keyword)}`;
      const kwData = await cachedFetch(kwUrl) as { results?: { id: number }[] } | null;
      const kwId: number | undefined = kwData?.results?.[0]?.id;

      if (!kwId) {
        return NextResponse.json({
          results: [],
          page: 1,
          total_pages: 1,
          has_more: false,
        });
      }

      const [movieData, tvData] = await Promise.all([
        cachedFetch(`${TMDB_BASE}/discover/movie?${base}&with_keywords=${kwId}&sort_by=popularity.desc&page=${currentPage}`),
        cachedFetch(`${TMDB_BASE}/discover/tv?${base}&with_keywords=${kwId}&sort_by=popularity.desc&page=${currentPage}`),
      ]) as [
        { results?: TMDBResult[]; total_pages?: number } | null,
        { results?: TMDBResult[]; total_pages?: number } | null
      ];

      const movies: TMDBResult[] = (movieData?.results || []).map((r) => ({
        ...r,
        media_type: "movie" as const,
      }));
      const shows: TMDBResult[] = (tvData?.results || []).map((r) => ({
        ...r,
        media_type: "tv" as const,
      }));

      const combined = [...movies, ...shows].sort(
        (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
      );

      const totalPages = Math.max(
        movieData?.total_pages ?? 1,
        tvData?.total_pages ?? 1
      );

      const detailedResults: DetailedResult[] = combined.map((item) => ({
        id: item.id,
        media_type: item.media_type,
        title: item.title || item.name || item.original_name || "Untitled",
        original_name: item.original_name || item.original_title || undefined,
        poster_path: item.poster_path ?? null,
        backdrop_path: item.backdrop_path ?? null,
        release_date: item.release_date || item.first_air_date || null,
        runtime: null,
        popularity: item.popularity,
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count ?? 0,
        overview: item.overview || "",
        genres: [],
      }));

      return NextResponse.json({
        results: detailedResults,
        page: currentPage,
        total_pages: totalPages,
        has_more: currentPage < totalPages,
      });
    }

    // ── # mode ────────────────────────────────────────────────────────────────
    if (query === "#") {
      const numWords = ["zero","one","two","three","four","five","six","seven","eight","nine"];
      const digits = ["0","1","2","3","4","5","6","7","8","9"];
      const allVariants = [...digits, ...numWords];

      const batches = await Promise.all(
        allVariants.map((v) => {
          const e = encodeURIComponent(v);
          return Promise.all([
            fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${e}&page=1`),
            fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${e}&page=1`, "movie"),
            fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${e}&page=1`, "tv"),
          ]);
        })
      );

      const allRaw = batches.flat(2);
      const startsWithNumber = (item: TMDBResult) => {
        const t = (item.title ?? item.name ?? "").toLowerCase();
        return /^[0-9]/.test(t) || numWords.some((w) => t.startsWith(w));
      };

      const scored = allRaw
        .filter((item) => (item.title || item.name) && startsWithNumber(item))
        .map((item) => ({ ...item, _score: buildScore(item, query) }));

      const deduped = deduplicateByScore(scored);
      const sorted = deduped.sort((a, b) => b._score - a._score);

      const totalPages = Math.max(1, Math.ceil(sorted.length / RESULTS_PER_PAGE));
      const pageSlice = sorted.slice(
        (currentPage - 1) * RESULTS_PER_PAGE,
        currentPage * RESULTS_PER_PAGE
      );

      const detailedResults = await Promise.all(
        pageSlice.map((item) => fetchDetails(item, apiKey))
      );

      return NextResponse.json({
        results: detailedResults.filter(Boolean),
        page: currentPage,
        total_pages: totalPages,
        has_more: currentPage < totalPages,
      });
    }

    // ── Normal search ─────────────────────────────────────────────────────────
    const enc = encodeURIComponent(query!);

    const tasks: Promise<TMDBResult[]>[] = [
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=1`),
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=2`),
      fetchSearchPage(`${TMDB_BASE}/search/multi?${base}&query=${enc}&page=3`),
      fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${enc}&page=1`, "movie"),
      fetchSearchPage(`${TMDB_BASE}/search/movie?${base}&query=${enc}&page=2`, "movie"),
      fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${enc}&page=1`, "tv"),
      fetchSearchPage(`${TMDB_BASE}/search/tv?${base}&query=${enc}&page=2`, "tv"),
    ];

    const batches = await Promise.all(tasks);
    const allRaw = batches.flat();

    const scored = allRaw
      .filter((item) => item.title || item.name || item.original_name)
      .map((item) => ({ ...item, _score: buildScore(item, query!) }));

    const deduped = deduplicateByScore(scored);
    const sorted = deduped.sort((a, b) => b._score - a._score);

    const totalPages = Math.max(1, Math.ceil(sorted.length / RESULTS_PER_PAGE));
    const pageSlice = sorted.slice(
      (currentPage - 1) * RESULTS_PER_PAGE,
      currentPage * RESULTS_PER_PAGE
    );

    const detailedResults = await Promise.all(
      pageSlice.map((item) => fetchDetails(item, apiKey))
    );

    return NextResponse.json({
      results: detailedResults.filter(Boolean),
      page: currentPage,
      total_pages: totalPages,
      has_more: currentPage < totalPages,
    });

  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}