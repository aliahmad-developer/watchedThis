export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string;
  release_date: string;
  popularity: number;
  runtime?: number;
  credits?: unknown;
}

export interface TMDBTV {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string;
  first_air_date: string;
  popularity: number;
  episode_run_time?: number[];
  credits?: unknown;
}

export interface TMDBProvidersResponse {
  results?: {
    US?: unknown;
  };
}

export interface TMDBDiscoverResponse<T> {
  results: T[];
}
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  media_type: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
}