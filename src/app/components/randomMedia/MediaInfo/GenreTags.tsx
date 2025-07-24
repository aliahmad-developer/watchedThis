import Link from "next/link";
import { GENRE_IDS } from "../../../components/Genre/types"; // adjust the import path as needed

interface GenreTagsProps {
  genres?: { id: number; name: string }[];
  mediaType?: "movie" | "tv"; // optional override
}

export default function GenreTags({ genres, mediaType }: GenreTagsProps) {
  if (!genres?.length) return <span>N/A</span>;

  // Helper to determine media type if not passed
  const detectMediaType = (genreId: number): "movie" | "tv" => {
    const movieMatch = Object.values(GENRE_IDS.movie).includes(genreId);
    const tvMatch = Object.values(GENRE_IDS.tv).includes(genreId);

    if (movieMatch && !tvMatch) return "movie";
    if (tvMatch && !movieMatch) return "tv";
    return "tv"; // default fallback if ambiguous or both match
  };

  const createGenreSlug = (genre: { id: number; name: string }) => {
    return `${genre.id}-${genre.name.toLowerCase().replace(/\s+/g, "-")}`;
  };

  return (
    <div className="flex flex-wrap mt-1 mb-1">
      {genres.map((genre) => {
        const resolvedMediaType = mediaType ?? detectMediaType(genre.id);

        return (
          <Link
            key={`${resolvedMediaType}-${genre.id}`}
            href={{
              pathname: `/genre/${createGenreSlug(genre)}`,
              query: { media_type: resolvedMediaType },
            }}
            scroll={false}
            className="m-1 mr-1 text-light-accent dark:text-dark-accent bg-light-card dark:bg-dark-card px-3 py-1 rounded-full text-sm border border-light-border dark:border-dark-border hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text cursor-pointer transition-colors"
          >
            {genre.name}
          </Link>
        );
      })}
    </div>
  );
}
