"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import slugify from "slugify";
import MediaCard from "@/app/components/mediaCard/mediaCard";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average: number;
  genre_ids?: number[];
  media_type?: "movie" | "tv";
}

export default function GenrePage() {
  const router = useRouter();
  const params = useParams();
  const genreId = params?.genreId as string;

  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreName, setGenreName] = useState("");

  // Extract numeric ID from slug
  const numericId = parseInt(genreId.split("-")[0]);

  useEffect(() => {
    if (!genreId) return;

    const fetchMediaByGenre = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/genre/${numericId}?media_type=${mediaType}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Deduplicate items using a Map
        const uniqueItemsMap = new Map<string, MediaItem>();
        for (const item of data.results || []) {
          const key = `${mediaType}-${item.id}`;
          if (!uniqueItemsMap.has(key)) {
            uniqueItemsMap.set(key, item);
          }
        }

        setMediaItems(Array.from(uniqueItemsMap.values()));

        if (data.genreName) {
          setGenreName(data.genreName);
        } else {
          const nameFromSlug = genreId.split("-").slice(1).join("-");
          setGenreName(
            nameFromSlug
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          );
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMediaByGenre();
  }, [genreId, mediaType]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        {genreName
          ? `${genreName} ${mediaType === "movie" ? "Movies" : "TV Shows"}`
          : "Browse by Genre"}
      </h1>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setMediaType("movie")}
          className={`px-6 py-2 rounded-full transition-colors ${
            mediaType === "movie"
              ? "bg-light-accent text-white dark:bg-dark-accent dark:text-dark-btn-text"
              : "bg-light-card hover:bg-light-disabled dark:bg-dark-card dark:hover:bg-dark-border text-black dark:text-white"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => setMediaType("tv")}
          className={`px-6 py-2 rounded-full transition-colors ${
            mediaType === "tv"
              ? "bg-light-accent text-white dark:bg-dark-accent dark:text-dark-btn-text"
              : "bg-light-card hover:bg-light-disabled dark:bg-dark-card dark:hover:bg-dark-border text-black dark:text-white"
          }`}
        >
          TV Shows
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
        {mediaItems.map((item) => {
          const title =
            mediaType === "movie" ? item.title ?? "" : item.name ?? "";
          const slug = slugify(title, { lower: true, strict: true });

          return (
            <MediaCard
              key={`${mediaType}-${item.id}`}
              item={{
                ...item,
                media_type: mediaType,
                title,
              }}
              onClick={() => router.push(`/${mediaType}/${slug}/${item.id}`)}
            />
          );
        })}
      </div>

      {mediaItems.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No {mediaType === "movie" ? "movies" : "TV shows"} found in the{" "}
          {genreName} genre.
          <p className="mt-2 text-sm">
            Try switching between movies and TV shows.
          </p>
        </div>
      )}
    </div>
  );
}
