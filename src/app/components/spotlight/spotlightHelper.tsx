import { unstable_cache } from "next/cache";
import { TMDBDiscoverResponse, TMDBMovie, TMDBTV, TMDBProvidersResponse } from "./types";
const API_KEY = process.env.TMDB_API_KEY;
const STREAMING_PROVIDERS = [8, 9, 15, 337, 384];

export const getSpotlightData = unstable_cache(
  async () => {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`),
      fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`)
    ]);

  const [movieData, tvData] = await Promise.all([
  movieRes.json() as Promise<TMDBDiscoverResponse<TMDBMovie>>,
  tvRes.json() as Promise<TMDBDiscoverResponse<TMDBTV>>
]);
    const combined = [
      ...movieData.results.filter((item: any) => item.backdrop_path)
        .map((item: any) => ({ ...item, media_type: "movie", first_air_date: item.release_date })),
      ...tvData.results.filter((item: any) => item.backdrop_path)
        .map((item: any) => ({ ...item, media_type: "tv", title: item.name }))
    ];

    const sortedByPopularity = combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    const enriched = await Promise.all(
      sortedByPopularity.map(async (item) => {
        const { id, media_type } = item;
        try {
          // Batch both calls per item in parallel
          const [providersRes, detailRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/${media_type}/${id}/watch/providers?api_key=${API_KEY}`),
            fetch(`https://api.themoviedb.org/3/${media_type}/${id}?api_key=${API_KEY}&append_to_response=credits`)
          ]);

        const [providersData, detail] = await Promise.all([
  providersRes.ok ? (providersRes.json() as Promise<TMDBProvidersResponse>) : Promise.resolve({} as TMDBProvidersResponse),
  detailRes.ok ? (detailRes.json() as Promise<TMDBMovie & TMDBTV>) : Promise.resolve({} as TMDBMovie & TMDBTV)
]);

          return {
            ...item,
            ...detail,
            watch_providers: providersData.results?.US,
            runtime: media_type === "movie"
              ? detail.runtime
              : detail.episode_run_time?.[0] || null
          };
        } catch {
          return item;
        }
      })
    );

    return enriched;
  },
  ["spotlight-data"],
  { revalidate: 3600 }
);