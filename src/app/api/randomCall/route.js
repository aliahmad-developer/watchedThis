import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not loaded from .env" },
      { status: 500 }
    );
  }
  const mediaType = Math.random() > 0.5 ? "movie" : "tv";

  try {
    // First get a random page of popular items
    const discoverUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&sort_by=popularity.desc`;
    const discoverRes = await fetch(discoverUrl);
    const discoverData = await discoverRes.json();

    // Get total pages available
    const totalPages = discoverData.total_pages;
    // Limit to first 500 pages (TMDB max for discover is 500)
    const randomPage =
      Math.floor(Math.random() * Math.min(totalPages, 500)) + 1;

    // Fetch a random page
    const randomPageUrl = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${apiKey}&sort_by=popularity.desc&page=${randomPage}`;
    const randomPageRes = await fetch(randomPageUrl);
    const randomPageData = await randomPageRes.json();

    // Select a random item from the results
    if (randomPageData.results && randomPageData.results.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * randomPageData.results.length
      );
      const randomItem = randomPageData.results[randomIndex];

      // Fetch full details of the selected item
      const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${randomItem.id}?api_key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const fullDetails = await detailsRes.json();

      return NextResponse.json({
        type: mediaType,
        ...fullDetails,
      });
    } else {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data from TMDB", details: error.message },
      { status: 500 }
    );
  }
}
