// hooks/useGenreNavigation.ts
import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GenreInfo } from "../../Genre/types";

interface UseGenreNavigationProps {
  genreSlug: string;
  mediaType: "movie" | "tv";
  setMediaType: (type: "movie" | "tv") => void;
  genreMappings: Record<string, GenreInfo>;
  normalizeSlug: (slug: string) => string;
  findBestMatchingGenre: (
    name: string,
    targetType: "movie" | "tv"
  ) => GenreInfo | undefined;
  setGenreName: (name: string) => void;
}

export function useGenreNavigation({
  genreSlug,
  mediaType,
  setMediaType,
  genreMappings,
  normalizeSlug,
  findBestMatchingGenre,
  setGenreName,
}: UseGenreNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleMediaTypeChange = useCallback(
    (type: "movie" | "tv") => {
      if (mediaType === type) return;

      if (!genreSlug || Object.keys(genreMappings).length === 0) {
        setMediaType(type);
        return;
      }

      const currentSlugPart = normalizeSlug(genreSlug);
      const currentGenreInfo = genreMappings[currentSlugPart];

      if (currentGenreInfo?.[`${type}Id`]) {
        const newSlug =
          type === "movie"
            ? currentGenreInfo.movieSlug
            : currentGenreInfo.tvSlug;
        if (newSlug) {
          router.push(`${pathname}?media_type=${type}`, {
            scroll: false,
          });
          setMediaType(type);
          return;
        }
      }

      const bestMatch = findBestMatchingGenre(
        currentGenreInfo?.name || currentSlugPart.replace(/-/g, " "),
        type
      );

      if (bestMatch) {
        const newSlug =
          type === "movie" ? bestMatch.movieSlug : bestMatch.tvSlug;
        if (newSlug) {
          router.push(`/genre/${newSlug}?media_type=${type}`, {
            scroll: false,
          });
          setMediaType(type);
          setGenreName(bestMatch.name);
          return;
        }
      }

      setMediaType(type);
    },
    [
      genreSlug,
      genreMappings,
      mediaType,
      normalizeSlug,
      findBestMatchingGenre,
      router,
      pathname,
      setMediaType,
      setGenreName,
    ]
  );

  return { handleMediaTypeChange };
}
