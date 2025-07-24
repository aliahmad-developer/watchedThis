// hooks/useGenreMappings.ts
import { useState, useEffect, useCallback } from "react";
import { GENRE_IDS, GenreInfo } from "../../Genre/types";
import slugify from "slugify";

// Define genre aliases for better cross-media matching
const GENRE_ALIASES: Record<string, string[]> = {
  horror: ["sci-fi & fantasy"],
  "sci-fi & fantasy": ["fantasy", "science fiction", "horror"],
  thriller: ["action", "crime"],
  soap: ["drama"],
  "tv movie": ["drama"],
};

export function useGenreMappings() {
  const [genreMappings, setGenreMappings] = useState<Record<string, GenreInfo>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const createSlug = useCallback((name: string, id?: number) => {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    return id ? `${id}-${baseSlug}` : baseSlug;
  }, []);

  const findAliases = useCallback((genreName: string): string[] => {
    const lowerName = genreName.toLowerCase();
    return (
      GENRE_ALIASES[lowerName] || 
      Object.entries(GENRE_ALIASES)
        .filter(([_, aliases]) => aliases.includes(lowerName))
        .map(([primary]) => primary)
    );
  }, []);

  useEffect(() => {
    const initializeGenreMappings = () => {
      const mappings: Record<string, GenreInfo> = {};

      // Process movie genres
      Object.entries(GENRE_IDS.movie).forEach(([name, id]) => {
        const slug = slugify(name, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });

        if (!mappings[slug]) {
          mappings[slug] = {
            name,
            movieSlug: createSlug(name, id),
            tvSlug: undefined,
            aliases: findAliases(name),
          };
        }
        mappings[slug].movieId = id;
      });

      // Process TV genres
      Object.entries(GENRE_IDS.tv).forEach(([name, id]) => {
        const slug = slugify(name, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });

        if (!mappings[slug]) {
          mappings[slug] = {
            name,
            movieSlug: undefined,
            tvSlug: createSlug(name, id),
            aliases: findAliases(name),
          };
        }
        mappings[slug].tvId = id;

        // Link to similar movie genres
        const aliases = findAliases(name);
        aliases.forEach((alias) => {
          const aliasSlug = slugify(alias, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          });
          if (mappings[aliasSlug]) {
            mappings[aliasSlug].tvId = mappings[aliasSlug].tvId || id;
            mappings[aliasSlug].tvSlug = mappings[aliasSlug].tvSlug || createSlug(name, id);
          }
        });
      });

      setGenreMappings(mappings);
      setLoading(false);
    };

    initializeGenreMappings();
  }, [createSlug, findAliases]);

  return { 
    genreMappings, 
    loading, 
    createSlug,
    findBestMatch: (name: string, targetType: "movie" | "tv") => {
      const slug = slugify(name, { lower: true, strict: true });
      const exactMatch = genreMappings[slug]?.[`${targetType}Id`] 
        ? genreMappings[slug]
        : undefined;

      if (exactMatch) return exactMatch;

      // Search by aliases
      for (const genre of Object.values(genreMappings)) {
        if (genre.aliases?.includes(name.toLowerCase()) && genre[`${targetType}Id`]) {
          return genre;
        }
      }

      // Fallback to first available genre
      return Object.values(genreMappings).find(g => g[`${targetType}Id`]);
    }
  };
}