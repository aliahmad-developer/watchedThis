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
        overview: item.overview,
        originalName: item.original_name,
        link: `/${item.media_type}/${slug}/${item.id}`,
      };
    });
  }, [limitedResults]);

  return (
    <div className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-lg overflow-hidden">
      {/* Scrollable results list */}
      <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-light-secondary-text dark:text-dark-secondary-text text-sm">
            Searching...
          </div>
        ) : formattedResults.length > 0 ? (
          formattedResults.map((item, index) => (
            <div key={item.id}>
              <Link
                href={item.link}
                onClick={onClose}
                className="block hover:bg-light-card dark:hover:bg-dark-card transition-colors"
              >
                <div className="flex items-start gap-2.5 px-3 sm:px-4 py-2">
                  {/* Poster — slightly smaller */}
                  {item.poster ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${item.poster}`}
                      alt={item.title}
                      width={36}
                      height={50}
                      className="w-8 h-[46px] sm:w-9 sm:h-[52px] rounded object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-[46px] sm:w-9 sm:h-[52px] bg-light-disabled dark:bg-dark-disabled rounded shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:gap-3">
                    {/* Left — title + meta */}
                    <div className="sm:w-44 sm:shrink-0 min-w-0">
                      <div className="text-light-body-text dark:text-dark-body-text text-sm font-semibold line-clamp-1 leading-tight">
                        {item.title}
                      </div>
                      {item.originalName &&
                        item.originalName !== item.title && (
                          <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text line-clamp-1">
                            {item.originalName}
                          </div>
                        )}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-xs px-1.5 py-0 rounded bg-light-card dark:bg-dark-card text-light-secondary-text dark:text-dark-secondary-text font-medium">
                          {formatMediaType(item.mediaType)}
                        </span>
                        <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                          {item.year}
                        </span>
                        {item.runtime && (
                          <>
                            <span className="text-light-disabled dark:text-dark-disabled text-xs">
                              •
                            </span>
                            <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                              {item.runtime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Overview */}
                    {item.overview && (
                      <div className="flex-1 min-w-0 mt-1 sm:mt-0 sm:border-l sm:border-light-border sm:dark:border-dark-border sm:pl-3">
                        <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text line-clamp-2 sm:line-clamp-3 leading-relaxed">
                          {item.overview}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              {index < formattedResults.length - 1 && (
                <div className="border-t border-light-border dark:border-dark-border mx-3 sm:mx-4" />
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-light-secondary-text dark:text-dark-secondary-text text-sm">
            No results found
          </div>
        )}
      </div>

      {/* Button lives OUTSIDE the scroll container — always visible */}
      {results.length > 0 && (
        <Link
          href={`/search?q=${encodeURIComponent(searchQuery)}`}
          onClick={onClose}
          className="block text-center px-4 py-3 border-t border-light-border dark:border-dark-border bg-light-btn-bg text-light-btn-text font-medium hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text transition-colors text-sm"
        >
          View all results
        </Link>
      )}
    </div>
  );
}

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
