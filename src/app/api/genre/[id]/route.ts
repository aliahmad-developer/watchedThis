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

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const genreId = parseInt(params.id);
    const mediaType = req.nextUrl.searchParams.get("media_type") as
      | "movie"
      | "tv";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");

    if (!API_KEY) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      );
    }

    if (!mediaType || isNaN(genreId)) {
      return NextResponse.json(
        { error: "Invalid media type or genre ID" },
        { status: 400 }
      );
    }

    const genreName =
      mediaType === "movie"
        ? Object.entries(GENRE_IDS.movie).find(([_, id]) => id === genreId)?.[0]
        : Object.entries(GENRE_IDS.tv).find(([_, id]) => id === genreId)?.[0];

    if (!genreName) {
      return NextResponse.json({
        results: [],
        genreName: "Unknown Genre",
        empty: true,
      });
    }

    const discoverUrl = new URL(`${BASE_URL}/discover/${mediaType}`);
    discoverUrl.searchParams.set("api_key", API_KEY);
    discoverUrl.searchParams.set("with_genres", genreId.toString());
    discoverUrl.searchParams.set("sort_by", "popularity.desc");
    discoverUrl.searchParams.set("page", page.toString());
    discoverUrl.searchParams.set("with_watch_monetization_types", "flatrate");

    const discoverRes = await fetch(discoverUrl.toString());
    if (!discoverRes.ok) {
      console.error("TMDB Discover API Error:", await discoverRes.text());
      return NextResponse.json({ error: "TMDB API error" }, { status: 502 });
    }

    const pageData = await discoverRes.json();

    const filteredResults: TMDBMediaItem[] = pageData.results
      .filter(
        (item: TMDBMediaItem) =>
          item.genre_ids?.includes(genreId) && item.poster_path
      )
      .reduce((unique: TMDBMediaItem[], item: TMDBMediaItem) => {
        if (!unique.some((i) => i.id === item.id)) {
          unique.push(item);
        }
        return unique;
      }, []);

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
          return item; // fallback
        }
      })
    );

    return NextResponse.json({
      results: enrichedResults,
      genreName,
      page: pageData.page,
      total_pages: pageData.total_pages,
      total_results: pageData.total_results,
    });
  } catch (error) {
    console.error("Genre API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre content" },
      { status: 500 }
    );
  }
}
