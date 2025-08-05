import { NextResponse } from "next/server";

const API_KEY = process.env.TMDB_API_KEY;
const STREAMING_PROVIDERS = [8, 9, 15, 337, 384]; // Netflix, Prime Video, Hulu, Disney+, HBO Max

export async function GET() {
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`),
      fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`),
    ]);

    if (!movieRes.ok || !tvRes.ok) {
      console.error("TMDB fetch error", movieRes.status, tvRes.status);
      throw new Error("Failed to fetch streaming content");
    }

    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    // Add media_type and filter items with no backdrop
    const combined = [
      ...movieData.results
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({ 
          ...item, 
          media_type: "movie",
          first_air_date: item.release_date // Alias for consistent naming
        })),
      ...tvData.results
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({ 
          ...item, 
          media_type: "tv",
          title: item.name // Alias for consistent naming
        })),
    ];

    // Sort by popularity and get top 12
    const sortedByPopularity = combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    // Enrich with watch provider data
    const enriched = await Promise.all(
      sortedByPopularity.map(async (item) => {
        const { id, media_type } = item;

        try {
          // Get watch providers
          const providersRes = await fetch(
            `https://api.themoviedb.org/3/${media_type}/${id}/watch/providers?api_key=${API_KEY}`
          );

          if (!providersRes.ok) {
            return item;
          }

          const providersData = await providersRes.json();
          const usProviders = providersData.results?.US;

          // Get additional details if needed
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${API_KEY}&append_to_response=credits`
          );

          const detail = detailRes.ok ? await detailRes.json() : {};

          return { 
            ...item,
            ...detail,
            watch_providers: usProviders,
            runtime: media_type === "movie" 
              ? detail.runtime 
              : detail.episode_run_time?.[0] || null
          };
        } catch (err) {
          console.error(`Error enriching ${media_type}/${id}`, err);
          return item;
        }
      })
    );

    return NextResponse.json({ 
      results: enriched,
      providers: STREAMING_PROVIDERS 
    });
  } catch (error) {
    console.error("API route error", error);
    return NextResponse.json(
      { message: "Error fetching streaming content", error: String(error) },
      { status: 500 }
    );
  }
}