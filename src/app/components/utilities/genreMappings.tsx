import { MovieGenre, TVGenre } from './types';

let movieGenres: MovieGenre[] = [];
let tvGenres: TVGenre[] = [];

export async function initializeGenres() {
  if (movieGenres.length > 0 && tvGenres.length > 0) return;
  
  const API_KEY = process.env.TMDB_API_KEY;
  const options = { next: { revalidate: 60 * 60 * 24 } }; // Cache for 24 hours

  const [moviesRes, tvRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`, options),
    fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${API_KEY}`, options)
  ]);

  movieGenres = (await moviesRes.json()).genres;
  tvGenres = (await tvRes.json()).genres;
}

export function getGenreSlug(genreId: number, mediaType: 'movie' | 'tv'): string {
  const genre = mediaType === 'movie'
    ? movieGenres.find(g => g.id === genreId)
    : tvGenres.find(g => g.id === genreId);

  if (!genre) return `${genreId}-unknown`;

  // Convert to slug-friendly format: "Sci-Fi & Fantasy" -> "sci-fi-fantasy"
  return `${genreId}-${genre.name.toLowerCase()
    .replace(/ & /g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')}`;
}

export function getGenreName(genreId: number, mediaType: 'movie' | 'tv'): string {
  const genre = mediaType === 'movie'
    ? movieGenres.find(g => g.id === genreId)
    : tvGenres.find(g => g.id === genreId);
  
  return genre?.name || 'Unknown Genre';
}

export function findGenreIdByName(name: string, mediaType: 'movie' | 'tv'): number | null {
  const genres = mediaType === 'movie' ? movieGenres : tvGenres;
  const genre = genres.find(g => 
    g.name.toLowerCase() === name.toLowerCase()
  );
  return genre?.id || null;
}