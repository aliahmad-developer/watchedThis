import Link from "next/link";
import { useState } from "react";
import { GENRE_IDS } from "../../../components/Genre/types";
import { AmbientTextColors } from "../detailsPage";

interface GenreTagsProps {
  genres?: { id: number; name: string }[];
  mediaType?: "movie" | "tv";
  ambientText?: AmbientTextColors;
}

function GenreTag({
  genre,
  resolvedMediaType,
  createGenreSlug,
  ambientText,
}: {
  genre: { id: number; name: string };
  resolvedMediaType: "movie" | "tv";
  createGenreSlug: (g: { id: number; name: string }) => string;
  ambientText?: AmbientTextColors;
}) {
  const [hovered, setHovered] = useState(false);

  // Parse out the raw rgb values from ambientText.secondary so we can
  // use them for the background at low opacity, and brighten on hover
  const secondary = ambientText?.secondary; // e.g. "rgba(180,120,90,0.85)"
  const primary = ambientText?.primary;

  return (
    <Link
      key={`${resolvedMediaType}-${genre.id}`}
      href={{
        pathname: `/genre/${createGenreSlug(genre)}`,
        query: { media_type: resolvedMediaType },
      }}
      scroll={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="m-1 px-3 py-1 rounded-full text-sm border cursor-pointer transition-all duration-200"
      style={{
        color: hovered ? primary : secondary,
        borderColor: hovered ? secondary : `${secondary?.replace(/,[^,]+\)$/, ",0.25)")}`,
        backgroundColor: hovered
          ? secondary?.replace(/,[^,]+\)$/, ",0.18)")
          : secondary?.replace(/,[^,]+\)$/, ",0.08)"),
      }}
    >
      {genre.name}
    </Link>
  );
}

export default function GenreTags({ genres, mediaType, ambientText }: GenreTagsProps) {
  if (!genres?.length) return <span>N/A</span>;

  const detectMediaType = (genreId: number): "movie" | "tv" => {
    const movieMatch = Object.values(GENRE_IDS.movie).includes(genreId);
    const tvMatch = Object.values(GENRE_IDS.tv).includes(genreId);
    if (movieMatch && !tvMatch) return "movie";
    if (tvMatch && !movieMatch) return "tv";
    return "tv";
  };

  const createGenreSlug = (genre: { id: number; name: string }) =>
    `${genre.id}-${genre.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-wrap mt-1 mb-1">
      {genres.map((genre) => {
        const resolvedMediaType = mediaType ?? detectMediaType(genre.id);
        return (
          <GenreTag
            key={`${resolvedMediaType}-${genre.id}`}
            genre={genre}
            resolvedMediaType={resolvedMediaType}
            createGenreSlug={createGenreSlug}
            ambientText={ambientText}
          />
        );
      })}
    </div>
  );
}