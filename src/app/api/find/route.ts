import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY  = process.env.TMDB_API_KEY;

async function fetchKeywords(id: number, mediaType: string): Promise<string[]> {
  try {
    const res  = await fetch(
      `${TMDB_BASE}/${mediaType}/${id}/keywords?api_key=${TMDB_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.keywords || data.results || [];
    return list.slice(0, 6).map((k: { name: string }) => k.name);
  } catch {
    return [];
  }
}

async function resolveKeywordIds(terms: string[], separator: "|" | ","): Promise<string> {
  if (!terms.length) return "";
  const results = await Promise.all(
    terms.map(async (term) => {
      const res  = await fetch(
        `${TMDB_BASE}/search/keyword?api_key=${TMDB_KEY}&query=${encodeURIComponent(term.trim())}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      // Take the closest match (first result)
      return (data.results || []).slice(0, 1).map((k: { id: number }) => k.id);
    })
  );
  const ids = results.flat();
  return ids.length ? ids.join(separator) : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mediaType      = searchParams.get("mediaType")      || "movie";
  const genres         = searchParams.get("genres")         || "";
  const excludeGenres  = searchParams.get("excludeGenres")  || "";
  
  const keywordsRaw    = searchParams.get("keywords")       || searchParams.get("keyword") || "";
  const excludeKwRaw   = searchParams.get("excludeKeywords") || "";
  const minYear        = searchParams.get("minYear")        || "";
  const maxYear        = searchParams.get("maxYear")        || "";
  const minRating      = searchParams.get("minRating")      || "";
  const maxRating      = searchParams.get("maxRating")      || "";
  const minSeasons     = searchParams.get("minSeasons")     || "";
  const maxSeasons     = searchParams.get("maxSeasons")     || "";
  const minEpisodes    = searchParams.get("minEpisodes")    || "";
  const maxEpisodes    = searchParams.get("maxEpisodes")    || "";
  const page           = searchParams.get("page")           || "1";
  const sortBy         = searchParams.get("sortBy")         || "popularity.desc";
  const strict         = searchParams.get("strict")         === "true";
  const isTV           = mediaType === "tv";

  try {
    const includeTerms = keywordsRaw ? keywordsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    const excludeTerms = excludeKwRaw ? excludeKwRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    // strict = AND (comma), non-strict = OR (pipe)
    const [includeIds, excludeIds] = await Promise.all([
      resolveKeywordIds(includeTerms, strict ? "," : "|"),
      resolveKeywordIds(excludeTerms, ","), // exclude is always AND
    ]);

    const params = new URLSearchParams({
      api_key:          TMDB_KEY || "",
      sort_by:          sortBy,
      page,
      include_adult:    "false",
      "vote_count.gte": "20",
    });

    if (genres)        params.set("with_genres",         genres);
    if (excludeGenres) params.set("without_genres",      excludeGenres);
    if (includeIds)    params.set("with_keywords",       includeIds);
    if (excludeIds)    params.set("without_keywords",    excludeIds);
    if (minRating)     params.set("vote_average.gte",    minRating);
    if (maxRating)     params.set("vote_average.lte",    maxRating);

    if (isTV) {
      if (minYear)     params.set("first_air_date.gte",          `${minYear}-01-01`);
      if (maxYear)     params.set("first_air_date.lte",          `${maxYear}-12-31`);
      if (minSeasons)  params.set("with_number_of_seasons.gte",  minSeasons);
      if (maxSeasons)  params.set("with_number_of_seasons.lte",  maxSeasons);
      if (minEpisodes) params.set("with_number_of_episodes.gte", minEpisodes);
      if (maxEpisodes) params.set("with_number_of_episodes.lte", maxEpisodes);
    } else {
      if (minYear) params.set("primary_release_date.gte", `${minYear}-01-01`);
      if (maxYear) params.set("primary_release_date.lte", `${maxYear}-12-31`);
    }

    const res  = await fetch(
      `${TMDB_BASE}/discover/${mediaType}?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();

    const rawResults = data.results || [];

    const keywordsPerItem = await Promise.all(
      rawResults.map((item: Record<string, unknown>) =>
        fetchKeywords(item.id as number, mediaType)
      )
    );

    const results = rawResults.map((item: Record<string, unknown>, i: number) => ({
      id:            item.id,
      title:         (item.title || item.name) as string,
      backdrop_path: item.backdrop_path,
      poster_path:   item.poster_path,
      vote_average:  item.vote_average,
      release_date:  (item.release_date || item.first_air_date) as string,
      genre_ids:     item.genre_ids,
      overview:      item.overview,
      media_type:    mediaType,
      keywords:      keywordsPerItem[i],
    }));

    return NextResponse.json({
      results,
      total_pages:   Math.min(data.total_pages, 500),
      total_results: data.total_results,
      page:          data.page,
    });
  } catch (err) {
    console.error("Find API error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}