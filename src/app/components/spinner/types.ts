export interface SpinnerItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  name?:string;
}