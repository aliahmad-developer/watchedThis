import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET() {
  const mediaTypes = ["movie", "tv"];
  const media_type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];

  let data = null;
  let attempts = 0;

  while (!data && attempts < 10) {
    const randomId = Math.floor(Math.random() * 100000); // TMDb has valid IDs up to ~100000
    const url = `https://api.themoviedb.org/3/${media_type}/${randomId}?api_key=${TMDB_API_KEY}&language=en-US}&sort_by=popularity.desc`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if ((media_type === "movie" && json.title) || (media_type === "tv" && json.name)) {
          return NextResponse.json({
            media_type,
            id: randomId,
            title: json.title || json.name,
          });
        }
      }
    } catch (err) {
    }

    attempts++;
  }

  return NextResponse.json(
    { error: "Could not find valid random media" },
    { status: 500 }
  );
}
