import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();

async function cachedTmdbFetch<T>(path: string): Promise<T> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && now < hit.expires) return hit.data as T;

  const data = await tmdbFetch<T>(path);
  cache.set(path, { data, expires: now + CACHE_TTL_MS });
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TMDBDiscoverResponse {
  page: number;
  results: unknown[];
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

interface DiscoverItem {
  id: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  overview?: string;
  [key: string]: unknown;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get("mediaType") ?? "movie";
  const page = searchParams.get("page") ?? "1";

  try {
    const [media, company] = await Promise.all([
      cachedTmdbFetch<TMDBDiscoverResponse>(
        `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`,
      ),
      page === "1"
        ? cachedTmdbFetch<TMDBCompany>(`/company/${id}`)
        : Promise.resolve(null),
    ]);

    const resultsWithRuntime = await Promise.all(
      (media.results as DiscoverItem[]).map(async (item) => {
        try {
          const detail = await cachedTmdbFetch<TMDBDetail>(
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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
