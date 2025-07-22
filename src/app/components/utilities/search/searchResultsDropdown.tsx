"use client";

import Link from "next/link";
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
  const formatMediaType = (type: string) => {
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
  };

  const createSlug = (str?: string) => {
    return (str || "untitled")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
  };

  return (
    <div className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-lg overflow-hidden">
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-3 text-center text-light-secondary-text dark:text-dark-secondary-text">
            Loading...
          </div>
        ) : results.length > 0 ? (
          results.map((item, index) => {
            const title = item.title || item.name || "Untitled";
            const year = item.release_date?.slice(0, 4) ?? "—";
            const slug = createSlug(title);
            const link = `/random/${item.media_type}/${slug}/${item.id}`;

            const runtime =
              item.runtime && item.runtime > 0
                ? formatRuntime(item.runtime)
                : item.media_type === "tv"
                ? "23m per ep"
                : item.media_type === "ona"
                ? "9m"
                : "";

            return (
              <div key={item.id}>
                <Link
                  href={link}
                  onClick={onClose}
                  className="block hover:bg-light-card dark:hover:bg-dark-card transition-colors"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={title}
                        className="w-10 h-14 rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-light-disabled dark:bg-dark-disabled rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-light-body-text dark:text-dark-body-text text-sm font-medium line-clamp-1">
                        {title}
                      </div>
                      {item.original_name && (
                        <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text line-clamp-1">
                          {item.original_name}
                        </div>
                      )}
                      <div className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1">
                        {year} • {formatMediaType(item.media_type)}
                        {runtime && ` • ${runtime}`}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Separator line except after the last item */}
                {index < results.length - 1 && (
                  <div className="border-t border-light-border dark:border-dark-border mx-4" />
                )}
              </div>
            );
          })
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

function formatRuntime(runtime: number): string {
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return [hours > 0 ? `${hours}h` : "", minutes > 0 ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}
