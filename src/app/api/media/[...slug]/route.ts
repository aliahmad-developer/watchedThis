import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  if (!Array.isArray(params.slug)) {
    return NextResponse.json(
      { error: "Invalid route parameters" },
      { status: 400 }
    );
  }
  const [media_type, media_name_slug, id] = params.slug || [];

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

  const url = `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,images`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        {
          error: `TMDB API error: ${
            errorData.status_message || res.statusText
          }`,
          code: res.status,
        },
        { status: res.status }
      );
    }
    

    const data = await res.json();

    const transformedData = {
      id: data.id,
      title: data.title || data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date,
      runtime: data.runtime || data.episode_run_time?.[0],
      genres: data.genres,
      vote_average: data.vote_average,
      videos: data.videos?.results,
      images: data.images?.backdrops,
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
