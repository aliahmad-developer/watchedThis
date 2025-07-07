import { NextResponse } from "next/server";

const API_KEY = process.env.TMDB_API_KEY;

export async function GET() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`
    );

    if (!res.ok) {
      console.error("TMDB fetch error", res.status);
      throw new Error("Failed to fetch trending content");
    }

    const data = await res.json();
    const first8 = data.results.slice(0, 8);

    // Enrich each item with runtime/episode_run_time
    const enriched = await Promise.all(
      first8.map(async (item: any) => {
        const type = item.media_type;

        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}`
          );

          if (!detailRes.ok) {
            console.warn(`Failed to fetch detail for ${type}/${item.id}`);
            return item; // Fallback to original item
          }

          const detail = await detailRes.json();
          return { ...item, ...detail }; // Merge data
        } catch (err) {
          console.error(`Error fetching detail for ${type}/${item.id}`, err);
          return item;
        }
      })
    );

    return NextResponse.json({ results: enriched });
  } catch (error) {
    console.error("API route error", error);
    return NextResponse.json(
      { message: "Error fetching popular media", error: String(error) },
      { status: 500 }
    );
  }
}
