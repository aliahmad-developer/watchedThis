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
  // Add other properties as needed
}