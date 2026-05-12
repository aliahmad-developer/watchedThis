import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();

async function cachedFetch<T>(url: string): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now < cached.expires) return cached.data as T;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);

  const data = await res.json();
  cache.set(url, { data, expires: now + CACHE_TTL_MS });
  return data as T;
}

async function fetchFromTMDB<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB API key");

  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${endpoint}${sep}api_key=${apiKey}`;
  return cachedFetch<T>(url);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TMDBDiscoverResponse {
  page: number;
  results: any[];
  total_pages: number;
}

interface TMDBCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
  headquarters?: string;
}

interface TMDBDetail {
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  overview?: string;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get("mediaType") || "movie";
  const page = searchParams.get("page") || "1";

  try {
    const [media, company] = await Promise.all([
      fetchFromTMDB<TMDBDiscoverResponse>(
        `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`,
      ),
      page === "1"
        ? fetchFromTMDB<TMDBCompany>(`/company/${id}`)
        : Promise.resolve(null),
    ]);

    // Fetch all runtimes in parallel — all cached after first load
    const resultsWithRuntime = await Promise.all(
      media.results.map(async (item) => {
        try {
          const detail = await fetchFromTMDB<TMDBDetail>(
            `/${mediaType}/${item.id}`,
          );
          return {
            ...item,
            runtime:
              mediaType === "movie"
                ? (detail.runtime ?? null)
                : (detail.episode_run_time?.[0] ?? null),
            number_of_seasons:
              detail.number_of_seasons ?? item.number_of_seasons ?? null,
            number_of_episodes:
              detail.number_of_episodes ?? item.number_of_episodes ?? null,
            vote_average: detail.vote_average ?? item.vote_average ?? null,
            overview: detail.overview ?? item.overview ?? null,
          };
        } catch {
          return { ...item, runtime: null };
        }
      }),
    );

    return NextResponse.json({
      ...(company ? { company } : {}),
      results: resultsWithRuntime,
      total_pages: media.total_pages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
