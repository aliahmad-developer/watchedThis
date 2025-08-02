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

// Helper function to get random year from different eras
const getRandomEra = (): number => {
  const eras: Era[] = [
    { min: 2020, max: new Date().getFullYear() }, // Current
    { min: 2000, max: 2019 }, // 21st century
    { min: 1980, max: 1999 }, // 80s-90s
    { min: 1960, max: 1979 }, // 60s-70s
    { min: 1920, max: 1959 }  // Classic
  ];
  const era = eras[Math.floor(Math.random() * eras.length)];
  return Math.floor(Math.random() * (era.max - era.min + 1)) + era.min;
};

export async function GET() {
  try {
    const mediaTypes = ["movie", "tv"];
    const media_type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    const randomYear = getRandomEra();

    // First try to get a random popular item from a random era
    const discoverUrl = `https://api.themoviedb.org/3/discover/${media_type}?api_key=${TMDB_API_KEY}` +
      `&language=en-US&sort_by=popularity.desc` +
      `&primary_release_year=${randomYear}` +
      `&vote_count.gte=100` + // Ensure some popularity
      `&page=${Math.floor(Math.random() * 10) + 1}`; // Random page 1-10

    const discoverRes = await fetch(discoverUrl);
    
    if (discoverRes.ok) {
      const discoverData: DiscoverResponse = await discoverRes.json();
      const validItems = (discoverData.results || []).filter((item: MediaItem) => 
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
          source: "discover"
        });
      }
    }

    // Fallback to pure randomness if discover fails
    let attempts = 0;
    const maxAttempts = 5;
    const minId = 1;
    const maxId = 1000000; // TMDB has IDs up to this range

    while (attempts < maxAttempts) {
      const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      const url = `https://api.themoviedb.org/3/${media_type}/${randomId}?api_key=${TMDB_API_KEY}&language=en-US`;
      
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json: MediaItem = await res.json();
          const hasTitle = (media_type === "movie" && json.title) || (media_type === "tv" && json.name);
          const hasPoster = json.poster_path;
          const hasRating = (json.vote_average || 0) > 5; // Minimum quality filter
          
          if (hasTitle && hasPoster && hasRating) {
            return NextResponse.json({
              media_type,
              id: randomId,
              title: json.title || json.name,
              overview: json.overview,
              poster_path: json.poster_path,
              vote_average: json.vote_average,
              release_date: json.release_date || json.first_air_date,
              year: json.release_date ? new Date(json.release_date).getFullYear() : 
                   json.first_air_date ? new Date(json.first_air_date).getFullYear() : null,
              source: "random"
            });
          }
        }
      } catch (err) {
        console.error(`Random attempt ${attempts + 1} failed:`, err);
      }
      
      attempts++;
    }

    // Final fallback to trending if all else fails
    const trendingUrl = `https://api.themoviedb.org/3/trending/${media_type}/week?api_key=${TMDB_API_KEY}`;
    const trendingRes = await fetch(trendingUrl);
    
    if (trendingRes.ok) {
      const trendingData: DiscoverResponse = await trendingRes.json();
      const trendingItems = trendingData.results || [];
      if (trendingItems.length > 0) {
        const randomItem = trendingItems[Math.floor(Math.random() * trendingItems.length)];
        return NextResponse.json({
          media_type,
          id: randomItem.id,
          title: randomItem.title || randomItem.name,
          overview: randomItem.overview,
          poster_path: randomItem.poster_path,
          vote_average: randomItem.vote_average,
          release_date: randomItem.release_date || randomItem.first_air_date,
          year: randomItem.release_date ? new Date(randomItem.release_date).getFullYear() : 
               randomItem.first_air_date ? new Date(randomItem.first_air_date).getFullYear() : null,
          source: "trending"
        });
      }
    }

    return NextResponse.json(
      { error: "Could not find valid random media" },
      { status: 500 }
    );
    
  } catch (error) {
    console.error("Error in random media endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}