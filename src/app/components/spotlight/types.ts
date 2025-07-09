// types.ts
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  media_type: string;
  backdrop_path: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
}
