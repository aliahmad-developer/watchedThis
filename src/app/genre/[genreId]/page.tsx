"use client";

import { useParams } from "next/navigation";
import { GenreHeader } from "../../components/Genre/GenreHeader";
import { GenreMediaGrid } from "../../components/Genre/GenreMediaGrid";
import { GenreLoadingSkeleton } from "../../components/Genre/GenreLoadingSkeleton";
import { useGenreMappings } from "../../components/hooks/Genre/useGenreMapping";
import { useGenreData } from "../../components/hooks/Genre/useGenreData";
import { useMediaType } from "../../components/hooks/Genre/useMediaType";
import { useGenreNavigation } from "../../components/hooks/Genre/useGenreNavigation";
import { MediaItem } from "../../components/Genre/types";

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
    fetchMore,
    hasMore,
    normalizeSlug,
    findBestMatchingGenre,
    isInitialLoad,
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
    setGenreName: (name) => {},
  });

  if (Object.keys(genreMappings).length === 0 && mappingsLoading) {
    return <GenreLoadingSkeleton />;
  }

  const processedMediaItems: MediaItem[] = mediaItems.map((item: MediaItem) => ({
    ...item,
    duration: mediaType === 'movie' 
      ? item.runtime 
      : item.episode_run_time?.[0] || item.runtime
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <GenreHeader
        genreName={genreName}
        mediaType={mediaType}
        onMediaTypeChange={handleMediaTypeChange}
      />

      <GenreMediaGrid
        mediaItems={processedMediaItems}
        mediaType={mediaType}
        loading={dataLoading && isInitialLoad}
        error={error}
        genreName={genreName}
        fetchMore={fetchMore}
        hasMore={hasMore}
      />
    </div>
  );
}