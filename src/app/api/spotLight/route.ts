import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

const STREAMING_PROVIDERS = [8, 9, 15, 337, 384];
const CACHE_KEY = "spotlight:streaming:US";

interface TMDBDiscoverItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  popularity: number;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
}

interface TMDBDiscoverResponse {
  results: TMDBDiscoverItem[];
}

interface TMDBWatchProvidersResponse {
  results?: {
    US?: unknown;
  };
}

interface TMDBDetailResponse {
  runtime?: number | null;
  episode_run_time?: number[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    const cached = cache.get(CACHE_KEY, TTL.MEDIUM);
    if (cached) {
      return NextResponse.json(cached);
    }

    const providers = STREAMING_PROVIDERS.join("|");

    const [movieData, tvData] = await Promise.all([
      tmdbFetch<TMDBDiscoverResponse>(
        `/discover/movie?sort_by=popularity.desc&with_watch_providers=${providers}&watch_region=US`,
        { next: { revalidate: 3600 } },
      ),
      tmdbFetch<TMDBDiscoverResponse>(
        `/discover/tv?sort_by=popularity.desc&with_watch_providers=${providers}&watch_region=US`,
        { next: { revalidate: 3600 } },
      ),
    ]);

    const combined = [
      ...movieData.results
        .filter((item) => item.backdrop_path)
        .map((item) => ({
          ...item,
          media_type: "movie",
          first_air_date: item.release_date,
        })),
      ...tvData.results
        .filter((item) => item.backdrop_path)
        .map((item) => ({ ...item, media_type: "tv", title: item.name })),
    ];

    const topItems = combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    const enriched = await Promise.all(
      topItems.map(async (item) => {
        const { id, media_type } = item;
        try {
          const [providersData, detail] = await Promise.all([
            tmdbFetch<TMDBWatchProvidersResponse>(
              `/${media_type}/${id}/watch/providers`,
              { next: { revalidate: 86400 } },
            ),
            tmdbFetch<TMDBDetailResponse>(
              `/${media_type}/${id}?append_to_response=credits`,
              { next: { revalidate: 86400 } },
            ),
          ]);

          return {
            ...item,
            ...detail,
            watch_providers: providersData?.results?.US ?? null,
            runtime:
              media_type === "movie"
                ? (detail.runtime ?? null)
                : (detail.episode_run_time?.[0] ?? null),
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

    cache.set(CACHE_KEY, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("API route error", error);
    return NextResponse.json(
      { message: "Error fetching streaming content", error: String(error) },
      { status: 500 },
    );
  }
}
