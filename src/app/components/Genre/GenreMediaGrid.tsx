"use client";

import { useEffect, useRef } from "react";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { MediaItem } from "./types";

interface GenreMediaGridProps {
  mediaItems: MediaItem[];
  mediaType: "movie" | "tv";
  loading: boolean;
  error: string | null;
  genreName: string;
  fetchMore: () => void;
  hasMore: boolean;
}

export function GenreMediaGrid({
  mediaItems,
  mediaType,
  loading,
  error,
  genreName,
  fetchMore,
  hasMore,
}: GenreMediaGridProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMore();
        }
      },
      {
        rootMargin: "100px",
      }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchMore]);

  if (loading && mediaItems.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 m-2">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full aspect-2/3 bg-light-border dark:bg-dark-border animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-light-body-text dark:text-dark-body-text text-center mt-8 flex flex-col items-center gap-4">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <p className="text-center py-8">
        No {mediaType === "movie" ? "movies" : "TV shows"} found for "
        {genreName}"
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid layout matching search page */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
        {mediaItems.map((item) => {
          const title = mediaType === "movie" ? item.title : item.name;

          return (
           
              <MediaCard
                key={`${mediaType}-${item.id}`}
                item={{
                  ...item,
                  media_type: mediaType,
                  runtime: item.runtime,
                  episode_run_time: item.episode_run_time,
                  title: title || "",
                  poster_path: item.poster_path || "/fallback-poster.png",
                }}
              />
          );
        })}
      </div>

      <div ref={loadMoreRef} className="w-full flex justify-center mt-6">
        {hasMore && (
          <div className="w-full flex justify-center py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2 w-full">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`loading-${index}`} className="animate-pulse">
                  <div className="bg-light-border dark:bg-dark-border rounded-lg aspect-2/3 w-full mb-2"></div>
                  <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-light-border dark:bg-dark-border rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
