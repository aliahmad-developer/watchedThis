import { unstable_cache } from "next/cache";
import {
  TMDBDiscoverResponse,
  TMDBMovie,
  TMDBTV,
  TMDBProvidersResponse,
} from "./types";
const API_KEY = process.env.TMDB_ACCESS_TOKEN;
const STREAMING_PROVIDERS = [8, 9, 15, 337, 384];

export const getSpotlightData = unstable_cache(
  async () => {
    const tmdbFetch = (path: string) =>
      fetch(`https://api.themoviedb.org/3${path}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

    const providers = STREAMING_PROVIDERS.join("|");

    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch(
        `/discover/movie?sort_by=popularity.desc&with_watch_providers=${providers}&watch_region=US`,
      ),
      tmdbFetch(
        `/discover/tv?sort_by=popularity.desc&with_watch_providers=${providers}&watch_region=US`,
      ),
    ]);

    if (!movieRes.ok || !tvRes.ok) {
      throw new Error(
        `TMDB discover failed: ${movieRes.status} / ${tvRes.status}`,
      );
    }

    const [movieData, tvData] = await Promise.all([
      movieRes.json() as Promise<TMDBDiscoverResponse<TMDBMovie>>,
      tvRes.json() as Promise<TMDBDiscoverResponse<TMDBTV>>,
    ]);

    const combined = [
      ...(movieData.results ?? [])
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({
          ...item,
          media_type: "movie",
          first_air_date: item.release_date,
        })),
      ...(tvData.results ?? [])
        .filter((item: any) => item.backdrop_path)
        .map((item: any) => ({ ...item, media_type: "tv", title: item.name })),
    ];

    const sortedByPopularity = combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    const enriched = await Promise.all(
      sortedByPopularity.map(async (item) => {
        const { id, media_type } = item;
        try {
          const [providersRes, detailRes] = await Promise.all([
            tmdbFetch(`/${media_type}/${id}/watch/providers`),
            tmdbFetch(`/${media_type}/${id}?append_to_response=credits`),
          ]);

          const [providersData, detail] = await Promise.all([
            providersRes.ok
              ? (providersRes.json() as Promise<TMDBProvidersResponse>)
              : Promise.resolve({} as TMDBProvidersResponse),
            detailRes.ok
              ? (detailRes.json() as Promise<TMDBMovie & TMDBTV>)
              : Promise.resolve({} as TMDBMovie & TMDBTV),
          ]);

          return {
            ...item,
            ...detail,
            watch_providers: providersData.results?.US,
            runtime:
              media_type === "movie"
                ? detail.runtime
                : detail.episode_run_time?.[0] || null,
          };
        } catch {
          return item;
        }
      }),
    );

    return enriched;
  },
  ["spotlight-data"],
  { revalidate: 3600 },
);
