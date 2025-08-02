// hooks/useGenreData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MediaItem, GenreInfo } from "../../Genre/types";

interface UseGenreDataProps {
  genreSlug: string;
  mediaType: "movie" | "tv";
  genreMappings: Record<string, GenreInfo>;
  createSlug: (name: string, id?: number) => string;
  page?: number;
}

export function useGenreData({
  genreSlug,
  mediaType,
  genreMappings,
  createSlug,
  page = 1,
}: UseGenreDataProps) {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreName, setGenreName] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(page);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const normalizeSlug = useCallback((slug: string) => {
    const parts = slug.split("-");
    if (!isNaN(Number(parts[0]))) {
      return parts.slice(1).join("-");
    }
    return slug;
  }, []);

  const findBestMatchingGenre = useCallback(
    (name: string, targetType: "movie" | "tv"): GenreInfo | undefined => {
      const exactMatch = Object.values(genreMappings).find(
        (g) =>
          g.name.toLowerCase() === name.toLowerCase() && g[`${targetType}Id`]
      );
      if (exactMatch) return exactMatch;

      const partialMatch = Object.values(genreMappings).find(
        (g) =>
          (g.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(g.name.toLowerCase())) &&
          g[`${targetType}Id`]
      );
      if (partialMatch) return partialMatch;

      return (
        Object.values(genreMappings).find((g) => g[`${targetType}Id`]) ||
        undefined
      );
    },
    [genreMappings]
  );

  const currentGenreId = useMemo(() => {
    if (!genreSlug) return null;

    const genreIdFromSlug = parseInt(genreSlug.split("-")[0], 10);
    const currentSlugPart = normalizeSlug(genreSlug);

    const genreInfo =
      genreMappings[currentSlugPart] ||
      Object.values(genreMappings).find(
        (g) => (mediaType === "movie" ? g.movieId : g.tvId) === genreIdFromSlug
      );

    return genreInfo
      ? mediaType === "movie"
        ? genreInfo.movieId
        : genreInfo.tvId
      : null;
  }, [genreSlug, genreMappings, mediaType, normalizeSlug]);

  const fetchMediaByGenre = useCallback(
    async (pageNum: number, isInitial: boolean = false) => {
      if (!genreSlug || Object.keys(genreMappings).length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const currentSlugPart = normalizeSlug(genreSlug);
        let genreInfo: GenreInfo | undefined = genreMappings[currentSlugPart];

        if (!genreInfo) {
          const genreIdFromSlug = parseInt(genreSlug.split("-")[0], 10);
          genreInfo = Object.values(genreMappings).find(
            (g) => g.movieId === genreIdFromSlug || g.tvId === genreIdFromSlug
          );
        }

        if (!genreInfo) {
          throw new Error(
            `Genre "${currentSlugPart.replace(/-/g, " ")}" not found`
          );
        }

        let genreId =
          mediaType === "movie" ? genreInfo.movieId : genreInfo.tvId;

        if (!genreId) {
          const bestMatch = findBestMatchingGenre(genreInfo.name, mediaType);
          if (bestMatch) {
            genreInfo = bestMatch;
            genreId =
              mediaType === "movie" ? bestMatch.movieId : bestMatch.tvId;

            const correctSlug =
              mediaType === "movie" ? bestMatch.movieSlug : bestMatch.tvSlug;
            if (correctSlug) {
              router.replace(`/genre/${correctSlug}?media_type=${mediaType}`, {
                scroll: false,
              });
            }
          }
        }

        if (!genreId) {
          throw new Error(
            `No ${mediaType} content available for ${genreInfo.name} genre`
          );
        }

        const response = await fetch(
          `/api/genre/${genreId}?media_type=${mediaType}&page=${pageNum}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${mediaType} data`);
        }

        const data = await response.json();

        const newItems = data.results
          ?.filter((item: MediaItem) => item.poster_path)
          ?.reduce((acc: MediaItem[], item: MediaItem) => {
            const key = `${mediaType}-${item.id}`;
            if (!acc.some((i) => `${i.media_type}-${i.id}` === key)) {
              acc.push({ ...item, media_type: mediaType });
            }
            return acc;
          }, []);

        if (isInitial) {
          setMediaItems(newItems || []);
        } else {
          setMediaItems((prev) => [...prev, ...(newItems || [])]);
        }

        setHasMore(data.results?.length > 0);
        setGenreName(genreInfo.name);
        setCurrentPage(pageNum);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
        if (isInitial) {
          setIsInitialLoad(false);
        }
      }
    },
    [
      genreSlug,
      mediaType,
      genreMappings,
      normalizeSlug,
      findBestMatchingGenre,
      router,
    ]
  );

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMediaByGenre(currentPage + 1, false);
  }, [currentPage, fetchMediaByGenre, hasMore, loading]);

  useEffect(() => {
    setIsInitialLoad(true);
    setMediaItems([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchMediaByGenre(1, true);
  }, [genreSlug, mediaType, fetchMediaByGenre]);

  return {
    mediaItems,
    loading,
    error,
    genreName,
    currentGenreId,
    normalizeSlug,
    findBestMatchingGenre,
    fetchMore,
    hasMore,
    isInitialLoad,
  };
}