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
    const first10 = data.results.slice(0, 10);

    return NextResponse.json({ results: first10 });
  } catch (error) {
    console.error("API route error", error);
    return NextResponse.json(
      { message: "Error fetching trending media", error: String(error) },
      { status: 500 }
    );
  }
}
