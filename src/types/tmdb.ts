export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

export interface TMDBPersonCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  poster_path?: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number;
  episode_run_time?: number[];
}

export interface TMDBPersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  profile_path?: string;
  known_for_department: string;
  popularity: number;
}
