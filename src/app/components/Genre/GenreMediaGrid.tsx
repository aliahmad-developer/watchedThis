"use client";

import { useRouter } from "next/navigation";
import slugify from "slugify";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { MediaItem } from "./types";

interface GenreMediaGridProps {
  mediaItems: MediaItem[];
  mediaType: "movie" | "tv";
  loading: boolean;
  error: string | null;
  genreName: string;
}

export function GenreMediaGrid({
  mediaItems,
  mediaType,
  loading,
  error,
  genreName,
}: GenreMediaGridProps) {
  const router = useRouter();

  // Fallback UI while loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded relative mx-4 my-6">
        <strong className="font-semibold">Error:</strong> {error}
        <div className="mt-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
            aria-label="Retry loading content"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state UI
  if (mediaItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">🤷‍♀️</div>
        <p>
          No {mediaType === "movie" ? "movies" : "TV shows"} found in the{" "}
          <span className="font-semibold">{genreName}</span> genre.
        </p>
        <p className="mt-2 text-sm">Try switching between movies and TV shows.</p>
      </div>
    );
  }

  // Render grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
      {mediaItems.map((item) => {
        const title = mediaType === "movie" ? item.title ?? "" : item.name ?? "";
        const slug = slugify(title, { lower: true, strict: true });

        return (
          <MediaCard
            key={`${mediaType}-${item.id}`}
            item={{
              ...item,
              media_type: mediaType,
              title,
              poster_path: item.poster_path || "/fallback-poster.png", // fallback image
            }}
            onClick={() => router.push(`/${mediaType}/${slug}/${item.id}`)}
          />
        );
      })}
    </div>
  );
}
