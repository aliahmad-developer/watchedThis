import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params?.slug || [];

  if (!Array.isArray(slug)) {
    return NextResponse.json(
      { error: "Invalid route parameters" },
      { status: 400 }
    );
  }

  if (slug.length < 2) {
    return NextResponse.json(
      { error: "Incomplete route parameters" },
      { status: 400 }
    );
  }

  const [media_type, media_name_slug, id] = slug;

  if (!media_type || !id) {
    return NextResponse.json(
      { error: "Missing media type or ID" },
      { status: 400 }
    );
  }

  if (!["movie", "tv"].includes(media_type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  const url = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,images,release_dates,content_ratings`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `TMDB API error: ${data.status_message || res.statusText}`,
          code: res.status,
        },
        { status: res.status }
      );
    }

    let certification: string | null = null;

    if (media_type === "movie" && data.release_dates?.results) {
      const usRelease = data.release_dates.results.find(
        (r: any) => r.iso_3166_1 === "US"
      );
      if (usRelease?.release_dates?.length) {
        const theatrical =
          usRelease.release_dates.find((d: any) => d.type === 3) ||
          usRelease.release_dates[0];
        certification = theatrical?.certification?.trim() || null;
      }
    } else if (media_type === "tv" && data.content_ratings?.results) {
      const usRating = data.content_ratings.results.find(
        (r: any) => r.iso_3166_1 === "US"
      );
      certification = usRating?.rating?.trim() || null;
    }

    const transformedData = {
      status: data.status,
      id: data.id,
      tagline: data.tagline,
      name: data.name,
      title: data.title || data.name,
      original_title: data.original_title || data.original_name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date,
      runtime: data.runtime || data.episode_run_time?.[0],
      genres: data.genres,
      vote_average: data.vote_average,
      videos: data.videos?.results,
      images: data.images?.backdrops,
      media_type,
      production_companies: data.production_companies,
      certification,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("TMDB API request failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch media data from TMDB" },
      { status: 500 }
    );
  }
}
