// components/genre/types.ts

// 🎭 TMDB genre ID map for movie and TV
export const GENRE_IDS: Record<"movie" | "tv", Record<string, number>> = {
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
    Action: 10759,              // Often grouped with Adventure/Thriller
    Adventure: 10759,           // Uses same ID as Action
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 10765,             // Part of Sci-Fi & Fantasy
    Horror: 10765,              // Part of Sci-Fi & Fantasy
    Kids: 10762,
    Mystery: 9648,
    News: 10763,
    Reality: 10764,
    Romance: 10749,
    "Sci-Fi & Fantasy": 10765,  // Master genre for TV Sci-Fi/Fantasy/Horror
    Science: 10765,             // Aliased into Sci-Fi & Fantasy
    Soap: 10766,
    Talk: 10767,
    Thriller: 10759,            // Aliased to Action
    War: 10768,
    Western: 37,
  },
} as const;

// 🧩 Minimal item used across genre/tmdb
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average: number;
  genre_ids?: number[];
  media_type?: "movie" | "tv";
}

// 🗂 Optional unified genre metadata structure
export interface GenreInfo {
  name: string;
  movieId?: number;              // TMDB genre ID for movies
  tvId?: number;                 // TMDB genre ID for TV
  movieSlug?: string;           // Slug used in movie routes
  tvSlug?: string;              // Slug used in TV routes
  aliases?: string[];           // Optional: alternate names
}
