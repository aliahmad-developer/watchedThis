export interface Credit {
  id: number;
  title: string;
  character?: string;
  job?: string;
  poster_path: string | null;
  media_type: string;
  release_date: string | null;
  vote_average?: number | null;
  overview?: string | null;
  runtime?: number | null;
  episode_run_time?: number[] | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  vote_count?: number | null;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface PersonData {
  details: PersonDetails;
  credits: { cast: Credit[]; crew: Credit[] } | null;
  images: {
    profiles: Array<{ file_path: string; width: number; height: number }>;
  } | null;
}