import { NextResponse } from "next/server";

// Optional: Force dynamic rendering to prevent caching issues
export const dynamic = "force-dynamic";

export async function GET() {
  // Use a server-only env variable
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not loaded from .env" },
      { status: 500 }
    );
  }

  const mediaType = Math.random() > 0.5 ? "movie" : "tv";

  try {
    // Get a random page of popular items (first just to find total_pages)
    const discoverUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&sort_by=popularity.desc`;

    const discoverRes = await fetch(discoverUrl, { cache: "no-store" });
    const discoverData = await discoverRes.json();

    if (!discoverRes.ok) {
      throw new Error(discoverData.status_message || "TMDB discover failed");
    }

    const totalPages = discoverData.total_pages;
    const randomPage = Math.floor(Math.random() * Math.min(totalPages, 500)) + 1;

    // Fetch a random page
    const randomPageUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&sort_by=popularity.desc&page=${randomPage}`;
    const randomPageRes = await fetch(randomPageUrl, { cache: "no-store" });
    const randomPageData = await randomPageRes.json();

    if (!randomPageRes.ok || !randomPageData.results?.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    // Pick a random item
    const randomIndex = Math.floor(Math.random() * randomPageData.results.length);
    const randomItem = randomPageData.results[randomIndex];

    // Fetch full details
    const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${randomItem.id}?api_key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl, { cache: "no-store" });
    const fullDetails = await detailsRes.json();

    if (!detailsRes.ok) {
      throw new Error(fullDetails.status_message || "TMDB details fetch failed");
    }

    return NextResponse.json({
      type: mediaType,
      ...fullDetails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch data from TMDB", details: error.message },
      { status: 500 }
    );
  }
}
