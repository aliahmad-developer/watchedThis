import { tmdbFetch } from "@/lib/tmdbRequest";

interface TMDBMediaItem {
  id: number;
  genre_ids?: number[];
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  runtime?: number | null;
  episode_run_time?: number[];
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

interface TMDBDiscoverResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBMediaItem[];
}

interface TMDBDetailResponse extends TMDBMediaItem {
  runtime?: number | null;
  episode_run_time?: number[];
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

// ── Genre IDs ────────────────────────────────────────────────────────────────
export const GENRE_IDS = {
  movie: {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    "Science Fiction": 878,
    "TV Movie": 10770,
    Thriller: 53,
    War: 10752,
    Western: 37,
  },
  tv: {
    Action: 10759,
    Adventure: 10759,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Kids: 10762,
    Mystery: 9648,
    News: 10763,
    Reality: 10764,
    Romance: 10749,
    "Sci-Fi & Fantasy": 10765,
    Soap: 10766,
    Talk: 10767,
    War: 10768,
    Western: 37,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export function parseGenreIds(idParam: string): number[] {
  return idParam
    .split(/[+,]/g)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
}

export function namesForGenreIds(
  mediaType: "movie" | "tv",
  ids: number[],
): string[] {
  const map = mediaType === "movie" ? GENRE_IDS.movie : GENRE_IDS.tv;
  const entries = Object.entries(map);
  return ids
    .map((id) => entries.find(([, v]) => v === id)?.[0])
    .filter(Boolean) as string[];
}

export interface GenreMediaResult {
  results: TMDBMediaItem[];
  genreName: string;
  page: number;
  total_pages: number;
  total_results: number;
  strict: boolean;
  ids: number[];
}

/**
 * Fetches media for one or more genre IDs. Shared by:
 * - the /api/genre/[id] route (client-side calls)
 * - server components (e.g. the genre list page), which should call
 *   this directly rather than fetch()-ing /api/genre/[id] over HTTP. A
 *   same-domain fetch() from a server component is subject to
 *   Cloudflare's same-zone fetch restrictions and can fail
 *   unpredictably in production while working fine on localhost.
 *
 * @param opts.enrichDetails - fetch per-item runtime/vote/overview via
 *   an extra TMDB call per result. Defaults to true, matching the
 *   original route behavior. Callers that only need a handful of
 *   poster thumbnails (e.g. the genre list page rendering 5 items per
 *   genre across 25+ genre sections) should pass false -- without it,
 *   that page alone could trigger 1,000+ outbound subrequests in a
 *   single render, which exceeds Cloudflare Workers' per-request
 *   subrequest cap (50 on the Free plan, and a real ceiling even on
 *   paid plans).
 */
export async function fetchGenreMedia(
  mediaType: "movie" | "tv",
  ids: number[],
  page: number,
  strict: boolean,
  opts: { enrichDetails?: boolean } = {},
): Promise<GenreMediaResult> {
  const { enrichDetails = true } = opts;

  // ── Discover ─────────────────────────────────────────────────────────────
  const params = new URLSearchParams({
    with_genres: ids.join("|"),
    sort_by: "popularity.desc",
    page: String(page),
    with_watch_monetization_types: "flatrate",
  });

  const pageData = await tmdbFetch<TMDBDiscoverResponse>(
    `/discover/${mediaType}?${params.toString()}`,
    { next: { revalidate: 60 } },
  );

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredResults: TMDBMediaItem[] = (pageData.results ?? [])
    .filter((item) => item.poster_path && Array.isArray(item.genre_ids))
    .filter((item) =>
      strict
        ? ids.every((gid) => item.genre_ids!.includes(gid))
        : ids.some((gid) => item.genre_ids!.includes(gid)),
    )
    .reduce((acc: TMDBMediaItem[], item) => {
      if (!acc.some((i) => i.id === item.id)) acc.push(item);
      return acc;
    }, []);

  // ── Enrich Details ───────────────────────────────────────────────────────
  const enrichedResults = enrichDetails
    ? await Promise.all(
        filteredResults.map(async (item) => {
          try {
            const detail = await tmdbFetch<TMDBDetailResponse>(
              `/${mediaType}/${item.id}?language=en-US`,
              { next: { revalidate: 60 } },
            );

            const runtime =
              mediaType === "movie"
                ? (detail.runtime ?? null)
                : (detail.episode_run_time?.find((v) => v > 0) ??
                  detail.runtime ??
                  null);

            return {
              ...item,
              runtime,
              episode_run_time: detail.episode_run_time ?? [],
              vote_average: detail.vote_average ?? item.vote_average ?? 0,
              vote_count: detail.vote_count ?? item.vote_count ?? 0,
              overview: detail.overview ?? item.overview ?? "",
              number_of_seasons: detail.number_of_seasons,
              number_of_episodes: detail.number_of_episodes,
            };
          } catch (err) {
            console.error("Detail fetch failed for", item.id, err);
            return item;
          }
        }),
      )
    : filteredResults;

  // ── Genre Label ──────────────────────────────────────────────────────────
  const genreNames = namesForGenreIds(mediaType, ids);
  const genreLabel =
    genreNames.length > 0
      ? strict
        ? genreNames.join(" & ")
        : genreNames.join(" | ")
      : "Unknown Genre";

  return {
    results: enrichedResults,
    genreName: genreLabel,
    page: pageData.page,
    total_pages: pageData.total_pages,
    total_results: pageData.total_results,
    strict,
    ids,
  };
}