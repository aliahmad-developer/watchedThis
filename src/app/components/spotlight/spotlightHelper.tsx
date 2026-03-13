// lib/spotlight.ts
export async function getSpotlightData() {
  const API_KEY = process.env.TMDB_API_KEY;
  const STREAMING_PROVIDERS = [8, 9, 15, 337, 384]; 

  const [movieRes, tvRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`),
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&with_watch_providers=${STREAMING_PROVIDERS.join('|')}&watch_region=US`)
  ]);

  const movieData = await movieRes.json();
  const tvData = await tvRes.json();

  const combined = [
    ...movieData.results.filter((item: any) => item.backdrop_path)
      .map((item: any) => ({ ...item, media_type: "movie", first_air_date: item.release_date })),
    ...tvData.results.filter((item: any) => item.backdrop_path)
      .map((item: any) => ({ ...item, media_type: "tv", title: item.name }))
  ];

  const sortedByPopularity = combined.sort((a, b) => b.popularity - a.popularity).slice(0, 12);

  const enriched = await Promise.all(sortedByPopularity.map(async (item) => {
    const { id, media_type } = item;
    try {
      const providersRes = await fetch(
        `https://api.themoviedb.org/3/${media_type}/${id}/watch/providers?api_key=${API_KEY}`
      );
      const providersData = providersRes.ok ? await providersRes.json() : {};
      const usProviders = providersData.results?.US;

      const detailRes = await fetch(
        `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${API_KEY}&append_to_response=credits`
      );
      const detail = detailRes.ok ? await detailRes.json() : {};

      return { ...item, ...detail, watch_providers: usProviders, runtime: media_type === "movie" ? detail.runtime : detail.episode_run_time?.[0] || null };
    } catch {
      return item;
    }
  }));

  return enriched;
}