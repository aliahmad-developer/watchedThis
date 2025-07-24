// app/genre/[genreId]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { GenreHeader } from "../../components/Genre/GenreHeader";
import { GenreMediaGrid } from "../../components/Genre/GenreMediaGrid";
import { GenreLoadingSkeleton } from "../../components/Genre/GenreLoadingSkeleton";
import { useGenreMappings } from "../../components/hooks/Genre/useGenreMapping";
import { useGenreData } from "../../components/hooks/Genre/useGenreData";
import { useMediaType } from "../../components/hooks/Genre/useMediaType";
import { useGenreNavigation } from "../../components/hooks/Genre/useGenreNavigation";

export default function GenrePage() {
  const params = useParams();
  const genreSlug = params?.genreId as string;

  const { mediaType, setMediaType } = useMediaType();
  const {
    genreMappings,
    loading: mappingsLoading,
    createSlug,
  } = useGenreMappings();

  const {
    mediaItems,
    loading: dataLoading,
    error,
    genreName,
    normalizeSlug,
    findBestMatchingGenre,
  } = useGenreData({
    genreSlug,
    mediaType,
    genreMappings,
    createSlug,
  });

  const { handleMediaTypeChange } = useGenreNavigation({
    genreSlug,
    mediaType,
    setMediaType,
    genreMappings,
    normalizeSlug,
    findBestMatchingGenre,
    setGenreName: (name) => {}, // This would need to be connected
  });

  if (Object.keys(genreMappings).length === 0 && mappingsLoading) {
    return <GenreLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GenreHeader
        genreName={genreName}
        mediaType={mediaType}
        onMediaTypeChange={handleMediaTypeChange}
      />

      <GenreMediaGrid
        mediaItems={mediaItems}
        mediaType={mediaType}
        loading={dataLoading}
        error={error}
        genreName={genreName}
      />
    </div>
  );
}
