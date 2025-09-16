"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import slugify from "slugify";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import Loading from "../utilities/loading";
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
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll observer
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
            className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-8">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
          const slug = slugify(title || "", { lower: true, strict: true });

          return (
            <Link
              key={`${mediaType}-${item.id}`}
              href={`/${mediaType}/${slug}/${item.id}`}
              passHref
            >
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
            </Link>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="w-full flex justify-center mt-6">
        {hasMore && <Loading size="sm" hideText />}
      </div>
    </div>
  );
}
