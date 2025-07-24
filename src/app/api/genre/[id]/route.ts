import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Local genre mappings to avoid extra API calls
const GENRE_IDS = {
  movie: {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    "Science Fiction": 878,
    "TV Movie": 10770,
    Thriller: 53,
    War: 10752,
    Western: 37,
  },
  tv: {
    Action: 10759,
    Adventure: 10759,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Kids: 10762,
    Mystery: 9648,
    News: 10763,
    Reality: 10764,
    Romance: 10749,
    "Sci-Fi & Fantasy": 10765,
    Soap: 10766,
    Talk: 10767,
    War: 10768,
    Western: 37,
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaType = req.nextUrl.searchParams.get('media_type') as 'movie' | 'tv';
    const genreId = parseInt(params.id);

    if (!API_KEY) {
      return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    // Get genre name from our local mapping
    const genreName = mediaType === 'movie' 
      ? Object.entries(GENRE_IDS.movie).find(([_, id]) => id === genreId)?.[0]
      : Object.entries(GENRE_IDS.tv).find(([_, id]) => id === genreId)?.[0];

    if (!genreName) {
      return NextResponse.json({
        results: [],
        genreName: 'Unknown Genre',
        empty: true,
      });
    }

    // Fetch discover results with strict filtering
    const allResults = [];
    const maxPages = 3; // Gets ~60 results
    
    for (let page = 1; page <= maxPages; page++) {
      const discoverUrl = new URL(`${BASE_URL}/discover/${mediaType}`);
      
      // Set all search parameters
      discoverUrl.searchParams.set('api_key', API_KEY);
      discoverUrl.searchParams.set('with_genres', genreId.toString());
      discoverUrl.searchParams.set('sort_by', 'popularity.desc');
      discoverUrl.searchParams.set('page', page.toString());
      
      // Additional strict filtering
      discoverUrl.searchParams.set('with_watch_monetization_types', 'flatrate');

      const response = await fetch(discoverUrl.toString());
      
      if (!response.ok) {
        console.error('TMDB API Error:', await response.text());
        break;
      }
      
      const pageData = await response.json();
      
      // Client-side verification of genre IDs
      const verifiedResults = pageData.results.filter((item: any) => 
        item.genre_ids?.includes(genreId)
      );
      
      allResults.push(...verifiedResults);
    }

    return NextResponse.json({
      results: allResults,
      genreName,
    });
  } catch (error) {
    console.error('Genre API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genre content' },
      { status: 500 }
    );
  }
}