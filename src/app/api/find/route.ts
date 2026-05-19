import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

/* ────────────────────────────────────────────────────────────── */
/* Types                                                          */
/* ────────────────────────────────────────────────────────────── */
interface TMDBKeyword {
  id: number;
  name: string;
}

interface TMDBDiscoverItem {
  id: number;
  title?: string;
  name?: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  overview?: string;
}

interface TMDBDiscoverResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBDiscoverItem[];
}

/* ────────────────────────────────────────────────────────────── */
/* Helpers                                                        */
/* ────────────────────────────────────────────────────────────── */
async function fetchKeywords(id: number, mediaType: string): Promise<string[]> {
  try {
    const data = await tmdbFetch<{
      keywords?: TMDBKeyword[];
      results?: TMDBKeyword[];
    }>(`/${mediaType}/${id}/keywords`, { next: { revalidate: 86400 } });
    const list = data.keywords ?? data.results ?? [];
    return list.slice(0, 6).map((k) => k.name);
  } catch {
    return [];
  }
}

async function resolveKeywordIds(
  terms: string[],
  separator: "|" | ",",
): Promise<string> {
  if (!terms.length) return "";

  const results = await Promise.all(
    terms.map(async (term) => {
      try {
        const data = await tmdbFetch<{ results?: TMDBKeyword[] }>(
          `/search/keyword?query=${encodeURIComponent(term.trim())}`,
          { next: { revalidate: 86400 } },
        );
        return (data.results ?? []).slice(0, 1).map((k) => k.id);
      } catch {
        return [];
      }
    }),
  );

  const ids = results.flat();
  return ids.length ? ids.join(separator) : "";
}

function parseMediaTypes(mediaTypeRaw: string): ("movie" | "tv")[] {
  const parsed = mediaTypeRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean) as ("movie" | "tv")[];
  return parsed.length ? parsed : ["movie"];
}

/**
 * TV statuses:
 * 0 In Production | 1 Returning Series | 2 Planned | 3 Canceled | 4 Ended
 */
function normalizeSortBy(sortBy: string, mediaType: "movie" | "tv"): string {
  if (
    sortBy === "primary_release_date.desc" ||
    sortBy === "primary_release_date.asc"
  ) {
    return mediaType === "tv"
      ? sortBy.replace("primary_release_date", "first_air_date")
      : sortBy;
  }
  return sortBy;
}

/* ────────────────────────────────────────────────────────────── */
/* Discover builder                                               */
/* ────────────────────────────────────────────────────────────── */
async function discoverMedia(
  mediaType: "movie" | "tv",
  searchParams: URLSearchParams,
  includeIds: string,
  excludeIds: string,
): Promise<TMDBDiscoverResponse> {
  const genres = searchParams.get("genres") ?? "";
  const excludeGenres = searchParams.get("excludeGenres") ?? "";
  const minYear = searchParams.get("minYear") ?? "";
  const maxYear = searchParams.get("maxYear") ?? "";
  const minRating = searchParams.get("minRating") ?? "";
  const maxRating = searchParams.get("maxRating") ?? "";
  const page = searchParams.get("page") ?? "1";
  const minVotes = searchParams.get("minVotes") ?? "";
  const sortByRaw = searchParams.get("sortBy") ?? "popularity.desc";
  const language = searchParams.get("language") ?? "";

  // TV only
  const minSeasons = searchParams.get("minSeasons") ?? "";
  const maxSeasons = searchParams.get("maxSeasons") ?? "";
  const minEpisodes = searchParams.get("minEpisodes") ?? "";
  const maxEpisodes = searchParams.get("maxEpisodes") ?? "";
  const tvStatus = searchParams.get("tvStatus") ?? "";
  const networks = searchParams.get("networks") ?? "";

  // Movie only
  const minRuntime = searchParams.get("minRuntime") ?? "";
  const maxRuntime = searchParams.get("maxRuntime") ?? "";

  // Build params — no api_key; tmdbFetch handles auth via Bearer header
  const params = new URLSearchParams({
    page,
    include_adult: "false",
    sort_by: normalizeSortBy(sortByRaw, mediaType),
  });

  /* Shared */
  if (genres) params.set("with_genres", genres);
  if (excludeGenres) params.set("without_genres", excludeGenres);
  if (includeIds) params.set("with_keywords", includeIds);
  if (excludeIds) params.set("without_keywords", excludeIds);
  if (minRating) params.set("vote_average.gte", minRating);
  if (maxRating) params.set("vote_average.lte", maxRating);
  if (language) params.set("with_original_language", language);

  params.set("vote_count.gte", minVotes || "20");

  /* TV-specific */
  if (mediaType === "tv") {
    if (minYear) params.set("first_air_date.gte", `${minYear}-01-01`);
    if (maxYear) params.set("first_air_date.lte", `${maxYear}-12-31`);
    if (minSeasons) params.set("with_number_of_seasons.gte", minSeasons);
    if (maxSeasons) params.set("with_number_of_seasons.lte", maxSeasons);
    if (minEpisodes) params.set("with_number_of_episodes.gte", minEpisodes);
    if (maxEpisodes) params.set("with_number_of_episodes.lte", maxEpisodes);
    if (tvStatus) params.set("with_status", tvStatus.split(",").join("|"));
    if (networks) params.set("with_networks", networks.split(",").join("|"));
  }

  /* Movie-specific */
  if (mediaType === "movie") {
    if (minYear) params.set("primary_release_date.gte", `${minYear}-01-01`);
    if (maxYear) params.set("primary_release_date.lte", `${maxYear}-12-31`);
    if (minRuntime) params.set("with_runtime.gte", minRuntime);
    if (maxRuntime) params.set("with_runtime.lte", maxRuntime);
  }

  return tmdbFetch<TMDBDiscoverResponse>(
    `/discover/${mediaType}?${params.toString()}`,
    { next: { revalidate: 3600 } },
  );
}

/* ────────────────────────────────────────────────────────────── */
/* Route                                                          */
/* ────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const mediaTypes = parseMediaTypes(
      searchParams.get("mediaType") ?? "movie",
    );
    const strict = searchParams.get("strict") === "true";

    const includeTerms = (searchParams.get("keywords") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const excludeTerms = (searchParams.get("excludeKeywords") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const [includeIds, excludeIds] = await Promise.all([
      resolveKeywordIds(includeTerms, strict ? "," : "|"),
      resolveKeywordIds(excludeTerms, ","),
    ]);

    const discovered = await Promise.all(
      mediaTypes.map((type) =>
        discoverMedia(type, searchParams, includeIds, excludeIds),
      ),
    );

    const mergedResults = discovered.flatMap((block, index) =>
      block.results.map((item) => ({ ...item, media_type: mediaTypes[index] })),
    );

    // Re-sort merged results when querying both movie + tv
    const sortBy = searchParams.get("sortBy") ?? "popularity.desc";
    if (mediaTypes.length > 1) {
      if (sortBy.includes("vote_average")) {
        mergedResults.sort(
          (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
        );
      } else if (sortBy.includes("vote_count")) {
        mergedResults.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
      }
    }

    const keywordsPerItem = await Promise.all(
      mergedResults.map((item) => fetchKeywords(item.id, item.media_type)),
    );

    const results = mergedResults.map((item, i) => ({
      id: item.id,
      title: item.title ?? item.name ?? "",
      backdrop_path: item.backdrop_path,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      vote_count: item.vote_count,
      release_date: item.release_date ?? item.first_air_date ?? "",
      genre_ids: item.genre_ids ?? [],
      overview: item.overview ?? "",
      media_type: item.media_type,
      keywords: keywordsPerItem[i],
    }));

    const totalPages = Math.min(
      Math.max(...discovered.map((x) => x.total_pages), 1),
      500,
    );
    const totalResults = discovered.reduce(
      (sum, x) => sum + x.total_results,
      0,
    );

    return NextResponse.json({
      results,
      total_pages: totalPages,
      total_results: totalResults,
      page: Number(searchParams.get("page") ?? "1"),
    });
  } catch (err) {
    console.error("Find API error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
