import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

interface TMDBReleaseDates {
  results: {
    iso_3166_1: string;
    release_dates: { type: number; certification: string }[];
  }[];
}

interface TMDBContentRatings {
  results: { iso_3166_1: string; rating: string }[];
}

interface TMDBDetailResponse {
  id: number;
  status?: string;
  tagline?: string;
  name?: string;
  title?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
  vote_average?: number;
  videos?: { results: unknown[] };
  images?: { backdrops: unknown[] };
  production_companies?: unknown[];
  keywords?: unknown;
  release_dates?: TMDBReleaseDates;
  content_ratings?: TMDBContentRatings;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;

  if (!Array.isArray(slug) || slug.length < 3) {
    return NextResponse.json(
      { error: "Invalid route parameters" },
      { status: 400 },
    );
  }

  const media_type = slug[0];
  const id = slug[slug.length - 1];

  if (!media_type || !id) {
    return NextResponse.json(
      { error: "Missing media type or ID" },
      { status: 400 },
    );
  }

  if (!["movie", "tv"].includes(media_type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const creditsPath =
      media_type === "movie"
        ? `/movie/${id}/credits?language=en-US`
        : `/tv/${id}/aggregate_credits?language=en-US`;

    const [data, credits] = await Promise.all([
      tmdbFetch<TMDBDetailResponse>(
        `/${media_type}/${id}?language=en-US&append_to_response=videos,images,release_dates,content_ratings,keywords`,
      ),
      tmdbFetch<unknown>(creditsPath),
    ]);

    let certification: string | null = null;

    if (media_type === "movie" && data.release_dates?.results) {
      const usRelease = data.release_dates.results.find(
        (r) => r.iso_3166_1 === "US",
      );
      if (usRelease?.release_dates?.length) {
        const theatrical =
          usRelease.release_dates.find((d) => d.type === 3) ??
          usRelease.release_dates[0];
        certification = theatrical?.certification?.trim() || null;
      }
    } else if (media_type === "tv" && data.content_ratings?.results) {
      const usRating = data.content_ratings.results.find(
        (r) => r.iso_3166_1 === "US",
      );
      certification = usRating?.rating?.trim() || null;
    }

    return NextResponse.json({
      status: data.status,
      id: data.id,
      tagline: data.tagline,
      name: data.name,
      title: data.title ?? data.name,
      original_title: data.original_title ?? data.original_name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date ?? data.first_air_date,
      runtime: data.runtime ?? data.episode_run_time?.[0],
      genres: data.genres,
      vote_average: data.vote_average,
      videos: data.videos?.results,
      images: data.images?.backdrops,
      media_type,
      production_companies: data.production_companies,
      certification,
      credits,
      keywords: data.keywords ?? null,
    });
  } catch (error) {
    console.error("TMDB API request failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch media data from TMDB" },
      { status: 500 },
    );
  }
}
