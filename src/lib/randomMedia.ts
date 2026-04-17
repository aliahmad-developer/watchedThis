import { MediaItem } from './dailyMedia';

const TMDB_API_KEY = process.env.TMDB_API_KEY!;

interface DiscoverResponse {
  results?: MediaItem[];
  total_pages?: number;
}

const MOVIE_ERAS = [
  { min: 2020, max: new Date().getFullYear(), weight: 15, minVotes: 80,  dateParam: "primary_release_year" as const },
  { min: 2010, max: 2019, weight: 20, minVotes: 100, dateParam: "primary_release_year" as const },
  { min: 2000, max: 2009, weight: 18, minVotes: 80,  dateParam: "primary_release_year" as const },
  { min: 1990, max: 1999, weight: 15, minVotes: 60,  dateParam: "primary_release_year" as const },
  { min: 1980, max: 1989, weight: 12, minVotes: 40,  dateParam: "primary_release_year" as const },
  { min: 1960, max: 1979, weight: 10, minVotes: 25,  dateParam: "primary_release_year" as const },
  { min: 1920, max: 1959, weight: 10, minVotes: 10,  dateParam: "primary_release_year" as const },
];

const TV_ERAS = [
  { min: 2020, max: new Date().getFullYear(), weight: 20, minVotes: 50,  dateParam: "first_air_date_year" as const },
  { min: 2010, max: 2019, weight: 25, minVotes: 60, dateParam: "first_air_date_year" as const },
  { min: 2000, max: 2009, weight: 20, minVotes: 40, dateParam: "first_air_date_year" as const },
  { min: 1990, max: 1999, weight: 15, minVotes: 20, dateParam: "first_air_date_year" as const },
  { min: 1980, max: 1989, weight: 10, minVotes: 10, dateParam: "first_air_date_year" as const },
  { min: 1960, max: 1979, weight: 10, minVotes: 5,   dateParam: "first_air_date_year" as const },
];

type Era = {
  min: number;
  max: number;
  weight: number;
  minVotes: number;
  dateParam: "primary_release_year" | "first_air_date_year";
};

const pickWeightedEra = (eras: Era[]): Era => {
  const total = eras.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const era of eras) {
    r -= era.weight;
    if (r <= 0) return era;
  }
  return eras[eras.length - 1];
};

const randomYearInEra = (era: Era): number => Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;

const MOVIE_GENRES = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37];
const TV_GENRES = [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766, 10767, 10768];

const pickRandomGenre = (genres: number[]): number => genres[Math.floor(Math.random() * genres.length)];

const SORT_ORDERS = ["popularity.desc", "vote_average.desc", "vote_count.desc", "revenue.desc", "primary_release_date.desc"];

const pickRandomSort = (): string => SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)];

async function fetchWithRetry(url: string, retries = 3, delayMs = 400): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * 2 ** i));
    }
  }
  throw new Error("Unreachable");
}

export async function getRandomMedia(seenIds = new Set<number>(), count = 1): Promise<MediaItem[]> {
  const results: MediaItem[] = [];
  
  for (let i = 0; i < count * 3; i++) {  // extra attempts for dups/fails
    const media_type = Math.random() < 0.55 ? "movie" : "tv";
    const eras = media_type === "movie" ? MOVIE_ERAS : TV_ERAS;
    const era = pickWeightedEra(eras);
    const year = randomYearInEra(era);
    const genre = pickRandomGenre(media_type === "movie" ? MOVIE_GENRES : TV_GENRES);
    const sort = pickRandomSort();

    try {
      // Probe for pages
      const probeUrl = `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=${sort}&${era.dateParam}=${year}&with_genres=${genre}&vote_count.gte=${era.minVotes}&page=1`;
      const probeRes =await fetchWithRetry(probeUrl);
      if (!probeRes.ok) continue;
      
      const probeData: DiscoverResponse = await probeRes.json();
      const availablePages = Math.min(probeData.total_pages ?? 1, 500);
      const page = Math.floor(Math.random() * availablePages) + 1;

      const pageData: DiscoverResponse = page === 1 ? probeData : await fetchWithRetry(probeUrl.replace('&page=1', `&page=${page}`)).then(r => r.ok ? r.json() as Promise<DiscoverResponse> : { results: [] });

      const validItems = (pageData.results ?? []).filter(item => 
        item.poster_path && (item.vote_average ?? 0) > 5 && !seenIds.has(item.id)
      );

      if (validItems.length > 0) {
        const item = validItems[Math.floor(Math.random() * validItems.length)];
        seenIds.add(item.id);
        results.push({
          media_type,
          id: item.id,
        title: item.title || item.name || 'Unknown',
          overview: item.overview || '',
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          release_date: item.release_date || item.first_air_date || '',
        });
        if (results.length === count) break;
      }
    } catch {
      // Fallback random ID logic omitted for brevity - use trending if needed
    }
  }

  return results.slice(0, count);
}
