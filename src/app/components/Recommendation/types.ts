export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: "movie" | "tv";
  runtime?: number;
  episode_run_time?: number[];
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;

  tags?: string[];
}
export interface FindFilterSnapshot {
  mediaType: "movie" | "tv" | "both";
  genres: number[];
  excludeGenres: number[];
  keywords: string[];
  excludeKeywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  ts: number;
}

export interface UserBehaviour {
  clickLog: Array<{ id: number; media_type: "movie" | "tv" }>;

  searchHistory: string[];
  findFilters?: FindFilterSnapshot[];
  updatedAt?: number;
}

export interface RecommendationProfile {
  allMedia: MediaItem[];
  favouriteIds: number[];
  libraryIds: number[];
  watchedIds: number[];
  clickLog: Array<{ id: number; media_type: "movie" | "tv" }>;
  searchHistory: string[];
  ratings: Record<number, number>;
  findFilters?: FindFilterSnapshot[];
}

export interface ScoredItem extends MediaItem {
  score: number;
  breakdown: Record<string, number>;
  reason: ReasonTag;
}

export interface ReasonTag {
  label: string;
  type: "favourite" | "genre" | "search" | "library" | "click" | "algo";
}

export interface TasteProfile {
  topGenres: Array<{ genre: string; score: number }>;
  totalFavourites: number;
  totalLibrary: number;
  totalClicks: number;
  activityScore: number;
}

export const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV genres
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};
