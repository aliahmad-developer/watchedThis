import { tmdbFetch } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

/**
 * Fetches an arbitrary TMDB path with caching, matching the caching
 * behavior of the /api/tmdb route (same cache key shape, same TTL, same
 * "don't cache TMDB error-shaped responses" guard).
 *
 * Shared by:
 * - the /api/tmdb route (client-side calls, with path allowlisting)
 * - server components that need a one-off TMDB path (e.g. the actors
 *   list page), which should call this directly rather than
 *   fetch()-ing `/api/tmdb?path=...` over HTTP. A same-domain fetch()
 *   from a server component is subject to Cloudflare's same-zone fetch
 *   restrictions and can fail unpredictably in production while working
 *   fine on localhost.
 *
 * NOTE: this function does NOT allowlist paths -- that check exists in
 * the /api/tmdb route because it accepts untrusted query-string input.
 * Callers using this directly are expected to pass trusted, hardcoded
 * paths (as the route's own ALLOWED_PATHS list already implies is safe).
 */
export async function fetchTmdbCached<T = unknown>(
  path: string,
  extraParams: Record<string, string> = {},
): Promise<T | null> {
  const params = Object.keys(extraParams).length
    ? JSON.stringify(extraParams)
    : "";
  const cacheKey = `tmdb:${path}:${params}`;

  const cached = cache.get<T>(cacheKey, TTL.MEDIUM);
  if (cached) return cached;

  const qs = new URLSearchParams(extraParams).toString();
  const fullPath = qs ? `${path}?${qs}` : path;

  try {
    const data = await tmdbFetch<T>(fullPath);
    const isValidResponse =
      data &&
      typeof data === "object" &&
      !("error" in (data as object)) &&
      !("message" in (data as object));

    if (isValidResponse) {
      cache.set(cacheKey, data, true);
    }

    return data;
  } catch (error) {
    console.error(`[fetchTmdbCached] path=${path}`, error);
    cache.invalidate(cacheKey);
    return null;
  }
}