import { tmdbFetch } from "@/lib/tmdbRequest";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
  media_type?: string;
}

interface TMDBCast {
  name: string;
}
interface TMDBCrew {
  job: string;
  name: string;
}

interface TMDBPagedResponse {
  results: TMDBItem[];
  total_pages?: number;
}

interface TMDBDetailResponse {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  episode_run_time?: number[];
}

interface TMDBCreditsResponse {
  cast?: TMDBCast[];
  crew?: TMDBCrew[];
}

export interface SimilarMediaResult {
  source?: {
    id: number;
    title: string;
    type: "movie" | "tv";
    year: string;
    poster: string | null;
    backdrop: string | null;
    overview: string;
    genres: string[];
    vote: number;
    runtime: number | null;
    cast: string[];
    director: string | null;
  };
  similar: {
    id: number;
    title: string;
    type: "movie" | "tv";
    year: string;
    poster: string | null;
    backdrop: string | null;
    vote: number;
    overview: string;
    genre_ids: number[];
  }[];
  has_more: boolean;
  page: number;
  total_pages: number;
}

/**
 * Fetches "similar/recommended" media for a given title. Shared by:
 * - the /api/echo route (client-side calls, e.g. from the browser)
 * - server components (e.g. the MoreLikeThis shelf), which should call
 *   this directly rather than fetching /api/echo over HTTP. A same-domain
 *   fetch() from a server component is subject to Cloudflare's same-zone
 *   fetch restrictions and can fail unpredictably in production while
 *   working fine on localhost.
 */
export async function fetchSimilarMedia(
  id: string | number,
  type: "movie" | "tv",
  page = 1,
): Promise<SimilarMediaResult> {
  const [det, cred] = await Promise.all([
    tmdbFetch<TMDBDetailResponse>(`/${type}/${id}`),
    tmdbFetch<TMDBCreditsResponse>(`/${type}/${id}/credits`),
  ]);

  const recData = await tmdbFetch<TMDBPagedResponse>(
    `/${type}/${id}/recommendations?page=${page}`,
  );

  const hasRecommendations = (recData.results ?? []).length > 0;
  let sim: TMDBPagedResponse;

  if (hasRecommendations) {
    sim = recData;
  } else {
    const genreIds = (det.genres ?? []).map((g) => g.id).join(",");
    const discoverEndpoint = genreIds
      ? `/discover/${type}?with_genres=${genreIds}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`
      : `/discover/${type}?sort_by=vote_average.desc&vote_count.gte=100&page=${page}`;

    sim = await tmdbFetch<TMDBPagedResponse>(discoverEndpoint);
  }

  const cast: string[] = (cred.cast ?? []).slice(0, 5).map((c) => c.name);
  const director: string | null =
    type === "movie"
      ? ((cred.crew ?? []).find((c) => c.job === "Director")?.name ?? null)
      : null;

  const source =
    page === 1
      ? {
          id: det.id,
          title: det.title ?? det.name ?? "",
          type,
          year: (det.release_date ?? det.first_air_date ?? "").slice(0, 4),
          poster: det.poster_path ?? null,
          backdrop: det.backdrop_path ?? null,
          overview: det.overview ?? "",
          genres: (det.genres ?? []).map((g) => g.name) as string[],
          vote: det.vote_average ?? 0,
          runtime: det.runtime ?? det.episode_run_time?.[0] ?? null,
          cast,
          director,
        }
      : undefined;

  const similar = (sim.results ?? [])
    .filter((item) => item.id !== det.id)
    .map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "",
      type,
      year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
      poster: item.poster_path ?? null,
      backdrop: item.backdrop_path ?? null,
      vote: item.vote_average ?? 0,
      overview: item.overview ?? "",
      genre_ids: item.genre_ids ?? [],
    }));

  return {
    source,
    similar,
    has_more: page < (sim.total_pages ?? 1),
    page,
    total_pages: sim.total_pages ?? 1,
  };
}
