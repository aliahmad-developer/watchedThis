"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { MediaResult } from "./searchInput";

interface SearchResultsDropdownProps {
  results: MediaResult[];
  searchQuery: string;
  isLoading: boolean;
  onClose: () => void;
}

export default function SearchResultsDropdown({
  results,
  searchQuery,
  isLoading,
  onClose,
}: SearchResultsDropdownProps) {
  const limitedResults = useMemo(() => results.slice(0, 10), [results]);

  const formattedResults = useMemo(() => {
    return limitedResults.map((item) => {
      const title = item.title || item.name || "Untitled";
      const slug = createSlug(title);
      const year = item.release_date?.slice(0, 4) ?? "—";

      const runtime =
        item.runtime && item.runtime > 0
          ? formatRuntime(item.runtime)
          : item.media_type === "tv"
          ? "23m per ep"
          : item.media_type === "ona"
          ? "9m"
          : "";

      return {
        id: item.id,
        title,
        slug,
        year,
        runtime,
        mediaType: item.media_type,
        poster: item.poster_path,
        originalName: item.original_name,
        link: `/random/${item.media_type}/${slug}/${item.id}`,
      };
    });
  }, [limitedResults]);

  return (
    <div className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-lg overflow-hidden">
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-3 text-center text-light-secondary-text dark:text-dark-secondary-text">
            Loading...
          </div>
        ) : formattedResults.length > 0 ? (
          formattedResults.map((item, index) => (
            <div key={item.id}>
              <Link
                href={item.link}
                onClick={onClose}
                className="block hover:bg-light-card dark:hover:bg-dark-card transition-colors"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {item.poster ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${item.poster}`}
                      alt={item.title}
                      width={40}
                      height={56}
                      className="w-10 h-14 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-light-disabled dark:bg-dark-disabled rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-light-body-text dark:text-dark-body-text text-sm font-medium line-clamp-1">
                      {item.title}
                    </div>
                    {item.originalName && (
                      <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text line-clamp-1">
                        {item.originalName}
                      </div>
                    )}
                    <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1">
                      {item.year} • {formatMediaType(item.mediaType)}
                      {item.runtime && ` • ${item.runtime}`}
                    </div>
                  </div>
                </div>
              </Link>

              {index < formattedResults.length - 1 && (
                <div className="border-t border-light-border dark:border-dark-border mx-4" />
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-center text-light-secondary-text dark:text-dark-secondary-text">
            No results found
          </div>
        )}

        {results.length > 0 && (
          <Link
            href={`/search?q=${encodeURIComponent(searchQuery)}`}
            onClick={onClose}
            className="block text-center px-4 py-3 bg-light-btn-bg text-light-btn-text font-medium hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text transition-colors"
          >
            View all results
          </Link>
        )}
      </div>
    </div>
  );
}

// Utility functions
function formatMediaType(type: string) {
  switch (type) {
    case "tv":
      return "TV";
    case "movie":
      return "Movie";
    case "ona":
      return "ONA";
    default:
      return type.toUpperCase();
  }
}

function createSlug(str?: string) {
  return (str || "untitled")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

function formatRuntime(runtime: number): string {
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return [hours > 0 ? `${hours}h` : "", minutes > 0 ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}
