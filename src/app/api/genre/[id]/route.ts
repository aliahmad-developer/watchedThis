import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

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

    // Validate genre ID
    const genreListUrl = `${BASE_URL}/genre/${mediaType}/list?api_key=${API_KEY}`;
    const genreListResponse = await fetch(genreListUrl);
    const genreList = await genreListResponse.json();

    const genre = genreList.genres.find((g: any) => g.id === genreId);

    if (!genre) {
      return NextResponse.json({
        results: [],
        genreName: 'Unknown Genre',
        empty: true,
      });
    }

    // Fetch first 3 pages of results to increase item count
    const allResults = [];
    const maxPages = 3; // adjust as needed for more data
    for (let page = 1; page <= maxPages; page++) {
      const discoverUrl = new URL(`${BASE_URL}/discover/${mediaType}`);
      discoverUrl.searchParams.set('api_key', API_KEY);
      discoverUrl.searchParams.set('with_genres', genreId.toString());
      discoverUrl.searchParams.set('sort_by', 'popularity.desc');
      discoverUrl.searchParams.set('include_adult', 'false');
      discoverUrl.searchParams.set('language', 'en-US');
      discoverUrl.searchParams.set('page', page.toString());

      const response = await fetch(discoverUrl.toString());
      if (!response.ok) break;
      const pageData = await response.json();
      allResults.push(...pageData.results);
    }

    return NextResponse.json({
      results: allResults,
      genreName: genre.name,
    });
  } catch (error) {
    console.error('Genre API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
