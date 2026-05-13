import { NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";

const API_KEY = process.env.TMDB_API_KEY;
const STREAMING_PROVIDERS = [8, 9, 15, 337, 384];

const CACHE_KEY = "spotlight:streaming:US";

export async function GET() {
  try {
    const cached = cache.get(CACHE_KEY, TTL.MEDIUM);
    if (cached) {
      return NextResponse.json(cached);
    }

    // ✅ 2. Fetch discover endpoints (with Next.js caching)
    const [movieRes, tvRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join(
          "|",
        )}&watch_region=US`,
        { next: { revalidate: 3600 } }, // 1 hour
      ),
      fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join(
          "|",
        )}&watch_region=US`,
        { next: { revalidate: 3600 } },
      ),
    ]);

    if (!movieRes.ok || !tvRes.ok) {
      console.error("TMDB fetch error", movieRes.status, tvRes.status);
      throw new Error("Failed to fetch streaming content");
    }

    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    // ✅ 3. Normalize + filter
    const combined = [
      ...movieData.results
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({
          ...item,
          media_type: "movie",
          first_air_date: item.release_date,
        })),
      ...tvData.results
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({
          ...item,
          media_type: "tv",
          title: item.name,
        })),
    ];

    // ✅ 4. Sort + slice
    const topItems = combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    // ✅ 5. Enrich (parallel + cached fetch)
    const enriched = await Promise.all(
      topItems.map(async (item) => {
        const { id, media_type } = item;

        try {
          const [providersRes, detailRes] = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/${media_type}/${id}/watch/providers?api_key=${API_KEY}`,
              { next: { revalidate: 86400 } }, // 24h (providers rarely change)
            ),
            fetch(
              `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${API_KEY}&append_to_response=credits`,
              { next: { revalidate: 86400 } },
            ),
          ]);

          const providersData = providersRes.ok
            ? await providersRes.json()
            : null;

          const detail = detailRes.ok ? await detailRes.json() : {};

          const usProviders = providersData?.results?.US;

          return {
            ...item,
            ...detail,
            watch_providers: usProviders,
            runtime:
              media_type === "movie"
                ? detail.runtime
                : detail.episode_run_time?.[0] || null,
          };
        } catch (err) {
          console.error(`Error enriching ${media_type}/${id}`, err);
          return item;
        }
      }),
    );

    const response = {
      results: enriched,
      providers: STREAMING_PROVIDERS,
    };

    // ✅ 6. Store FULL response in cache
    cache.set(CACHE_KEY, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("API route error", error);

    return NextResponse.json(
      {
        message: "Error fetching streaming content",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
