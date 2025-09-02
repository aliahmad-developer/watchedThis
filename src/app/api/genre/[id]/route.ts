import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

interface TMDBMediaItem {
  id: number;
  genre_ids?: number[];
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  runtime?: number;
  episode_run_time?: number[];
}

// (optional) name lookup if you want to return a nice title
const GENRE_IDS = {
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

function parseIds(idParam: string): number[] {
  // support “28+12” or “28,12”
  return idParam
    .split(/[+,]/g)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
}

function namesForIds(mediaType: "movie" | "tv", ids: number[]): string[] {
  const map = mediaType === "movie" ? GENRE_IDS.movie : GENRE_IDS.tv;
  const entries = Object.entries(map);
  return ids
    .map((id) => entries.find(([_, v]) => v === id)?.[0])
    .filter(Boolean) as string[];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const mediaType = (req.nextUrl.searchParams.get("media_type") ||
      "") as "movie" | "tv";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const strict = ["true", "1", "yes"].includes(
      (req.nextUrl.searchParams.get("strict") || "false").toLowerCase()
    );

    if (!API_KEY) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      );
    }
    const ids = parseIds(idParam);
    if (!mediaType || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid media type or genre IDs" },
        { status: 400 }
      );
    }

    // For strict mode, we need to handle the filtering ourselves
    // since TMDB doesn't support AND logic natively
    const withGenres = ids.join("|"); // Always use OR for the initial API call

    const discoverUrl = new URL(`${BASE_URL}/discover/${mediaType}`);
    discoverUrl.searchParams.set("api_key", API_KEY);
    discoverUrl.searchParams.set("with_genres", withGenres);
    discoverUrl.searchParams.set("sort_by", "popularity.desc");
    discoverUrl.searchParams.set("page", String(page));
    discoverUrl.searchParams.set("with_watch_monetization_types", "flatrate");

    const discoverRes = await fetch(discoverUrl.toString(), { next: { revalidate: 60 } });
    if (!discoverRes.ok) {
      console.error("TMDB Discover API Error:", await discoverRes.text());
      return NextResponse.json({ error: "TMDB API error" }, { status: 502 });
    }

    const pageData = await discoverRes.json();

    // Filter results based on strict mode
    const filteredResults: TMDBMediaItem[] = (pageData.results || [])
      .filter((item: TMDBMediaItem) => item.poster_path && Array.isArray(item.genre_ids))
      .filter((item: TMDBMediaItem) =>
        strict
          ? ids.every((gid) => item.genre_ids!.includes(gid)) // AND - must include ALL selected genres
          : ids.some((gid) => item.genre_ids!.includes(gid)) // OR - can include ANY selected genre
      )
      .reduce((acc: TMDBMediaItem[], item: TMDBMediaItem) => {
        if (!acc.some((i) => i.id === item.id)) acc.push(item);
        return acc;
      }, []);

    // Enrich with runtime / episode_run_time
    const enrichedResults = await Promise.all(
      filteredResults.map(async (item) => {
        try {
          const detailUrl = `${BASE_URL}/${mediaType}/${item.id}?api_key=${API_KEY}`;
          const detailRes = await fetch(detailUrl);
          if (!detailRes.ok) throw new Error("Failed to fetch details");
          const detailData = await detailRes.json();
          return {
            ...item,
            runtime: detailData.runtime,
            episode_run_time: detailData.episode_run_time,
          };
        } catch (err) {
          console.error("Detail fetch failed for", item.id, err);
          return item;
        }
      })
    );

    const genreNames = namesForIds(mediaType, ids);
    const genreLabel =
      genreNames.length > 0
        ? strict
          ? genreNames.join(" & ")
          : genreNames.join(" | ")
        : "Unknown Genre";

    return NextResponse.json({
      results: enrichedResults,
      genreName: genreLabel,
      page: pageData.page,
      total_pages: pageData.total_pages,
      total_results: pageData.total_results,
      strict,
      ids,
    });
  } catch (error) {
    console.error("Genre API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre content" },
      { status: 500 }
    );
  }
}