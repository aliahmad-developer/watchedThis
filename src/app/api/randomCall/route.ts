import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface Era {
  min: number;
  max: number;
}

interface DiscoverResponse {
  results?: MediaItem[];
}

const getRandomEra = (): number => {
  const eras: Era[] = [
    { min: 2020, max: new Date().getFullYear() },
    { min: 2000, max: 2019 },
    { min: 1980, max: 1999 },
    { min: 1960, max: 1979 },
    { min: 1920, max: 1959 },
  ];
  const era = eras[Math.floor(Math.random() * eras.length)];
  return Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;
};

async function fetchWithRetry(
  url: string,
  retries = 3,
  delayMs = 500
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000), // per-attempt timeout, shorter than TMDB default
      });
      return res;
    } catch (err: any) {
      const isLast = i === retries - 1;
      if (isLast) throw err;
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await new Promise((r) => setTimeout(r, delayMs * 2 ** i));
    }
  }
  throw new Error("Unreachable");
}

export async function GET() {
  try {
    const mediaTypes = ["movie", "tv"];
    const media_type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    const randomYear = getRandomEra();

    // 1. Try discover endpoint
    try {
      const discoverUrl =
        `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
        `&language=en-US&sort_by=popularity.desc` +
        `&primary_release_year=${randomYear}` +
        `&vote_count.gte=100` +
        `&page=${Math.floor(Math.random() * 10) + 1}`;

      const discoverRes = await fetchWithRetry(discoverUrl);

      if (discoverRes.ok) {
        const discoverData: DiscoverResponse = await discoverRes.json();
        const validItems = (discoverData.results || []).filter(
          (item: MediaItem) =>
            item.poster_path && (item.vote_average || 0) > 5
        );

        if (validItems.length > 0) {
          const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
          return NextResponse.json({
            media_type,
            id: randomItem.id,
            title: randomItem.title || randomItem.name,
            overview: randomItem.overview,
            poster_path: randomItem.poster_path,
            vote_average: randomItem.vote_average,
            release_date: randomItem.release_date || randomItem.first_air_date,
            year: randomYear,
            source: "discover",
          });
        }
      }
    } catch (err) {
      console.error("Discover fetch failed, falling back to random IDs:", err);
    }

    // 2. Fallback: random ID attempts
    const maxAttempts = 5;
    const maxId = 1000000;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const randomId = Math.floor(Math.random() * maxId) + 1;
      const url = `https://api.themoviedb.org/3/${media_type}/${randomId}?api_key=${TMDB_API_KEY}&language=en-US`;

      try {
        const res = await fetchWithRetry(url, 2, 300); // fewer retries for individual ID lookups
        if (res.ok) {
          const json: MediaItem = await res.json();
          const hasTitle =
            (media_type === "movie" && json.title) ||
            (media_type === "tv" && json.name);
          const hasPoster = json.poster_path;
          const hasRating = (json.vote_average || 0) > 5;

          if (hasTitle && hasPoster && hasRating) {
            return NextResponse.json({
              media_type,
              id: randomId,
              title: json.title || json.name,
              overview: json.overview,
              poster_path: json.poster_path,
              vote_average: json.vote_average,
              release_date: json.release_date || json.first_air_date,
              year: json.release_date
                ? new Date(json.release_date).getFullYear()
                : json.first_air_date
                ? new Date(json.first_air_date).getFullYear()
                : null,
              source: "random",
            });
          }
        }
      } catch (err) {
        console.error(`Random ID attempt ${attempts + 1} failed:`, err);
      }
    }

    // 3. Final fallback: trending
    try {
      const trendingUrl = `https://api.themoviedb.org/3/trending/${media_type}/week?api_key=${TMDB_API_KEY}`;
      const trendingRes = await fetchWithRetry(trendingUrl);

      if (trendingRes.ok) {
        const trendingData: DiscoverResponse = await trendingRes.json();
        const trendingItems = trendingData.results || [];

        if (trendingItems.length > 0) {
          const randomItem =
            trendingItems[Math.floor(Math.random() * trendingItems.length)];
          return NextResponse.json({
            media_type,
            id: randomItem.id,
            title: randomItem.title || randomItem.name,
            overview: randomItem.overview,
            poster_path: randomItem.poster_path,
            vote_average: randomItem.vote_average,
            release_date: randomItem.release_date || randomItem.first_air_date,
            year: randomItem.release_date
              ? new Date(randomItem.release_date).getFullYear()
              : randomItem.first_air_date
              ? new Date(randomItem.first_air_date).getFullYear()
              : null,
            source: "trending",
          });
        }
      }
    } catch (err) {
      console.error("Trending fallback failed:", err);
    }

    return NextResponse.json(
      { error: "Could not find valid random media. Please try again." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Error in random media endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}