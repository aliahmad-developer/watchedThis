import { tmdbFetch } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

// ── Cached TMDB fetch ─────────────────────────────────────────────────────────
// Reuses the app's shared ServerCache (@/lib/cache) instead of a separate
// ad-hoc Map, so this stays consistent with the rest of the app and gets
// the same "never cache errors" behavior. TTL.SHORT (5 min) matches the
// original CACHE_TTL_MS here.
async function cachedTmdbFetch<T>(path: string): Promise<T> {
  const key = `tmdb:${path}`;
  const cached = cache.get<T>(key, TTL.SHORT);
  if (cached) return cached;

  const data = await tmdbFetch<T>(path);
  cache.set(key, data);
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
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  vote_average?: number | null;
  overview?: string | null;
  runtime?: number | null;
  [key: string]: unknown;
}

export interface ProductionCompanyResult {
  company?: TMDBCompany;
  results: DiscoverItem[];
  total_pages: number;
}

/**
 * Fetches a production company's catalog. Shared by:
 * - the /api/production/[id] route (client-side calls)
 * - server components (the production company page and the production
 *   list page), which should call this directly rather than fetch()-ing
 *   /api/production/[id] over HTTP. A same-domain fetch() from a server
 *   component is subject to Cloudflare's same-zone fetch restrictions
 *   and can fail unpredictably in production while working fine on
 *   localhost.
 *
 * @param opts.includeCompany - fetch company metadata (name/logo/etc).
 *   Defaults to true. The list page doesn't display this per-studio, so
 *   it passes false to save a subrequest per call.
 * @param opts.enrichDetails - fetch per-item runtime/vote/overview via
 *   an extra TMDB call per result. Defaults to true. This is what the
 *   single-company page needs for its full grid, but it multiplies
 *   subrequests by up to 20x per call (one per discover result), which
 *   matters a lot on Cloudflare Workers -- the Free plan caps a single
 *   request to 50 total outbound subrequests, and even paid plans have
 *   a real ceiling. Callers that only need a handful of poster
 *   thumbnails (e.g. the production list page rendering 5 items per
 *   studio) should pass false.
 */
export async function fetchProductionCompanyData(
  id: string,
  mediaType: string,
  page: string,
  opts: { includeCompany?: boolean; enrichDetails?: boolean } = {},
): Promise<ProductionCompanyResult> {
  const { includeCompany = true, enrichDetails = true } = opts;

  const [media, company] = await Promise.all([
    cachedTmdbFetch<TMDBDiscoverResponse>(
      `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`,
    ),
    includeCompany && page === "1"
      ? cachedTmdbFetch<TMDBCompany>(`/company/${id}`)
      : Promise.resolve(null),
  ]);

  const items = media.results as DiscoverItem[];

  const resultsWithRuntime = enrichDetails
    ? await Promise.all(
        items.map(async (item) => {
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
      )
    : items.map((item) => ({ ...item, runtime: null }));

  return {
    ...(company ? { company } : {}),
    results: resultsWithRuntime,
    total_pages: media.total_pages,
  };
}
