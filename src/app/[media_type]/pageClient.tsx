"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import MediaCard from "../components/mediaCard/mediaCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faLayerGroup } from "@fortawesome/free-solid-svg-icons";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type: "movie" | "tv";
  runtime?: number;
}

function SkeletonCard() {
  return (
    <div className="p-2 animate-pulse">
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-light-border dark:bg-dark-border" />
      <div className="mt-2 h-4 bg-light-border dark:bg-dark-border rounded w-4/5 mx-auto" />
      <div className="mt-1 h-3.5 bg-light-border dark:bg-dark-border rounded w-2/5 mx-auto" />
    </div>
  );
}

function MediaTypeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Title skeleton — matches h1 size/margin */}
      <div className="flex justify-center mb-8">
        <div className="h-9 md:h-10 lg:h-11 w-64 rounded-lg bg-light-border dark:bg-dark-border animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 m-2 md:m-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function MediaTypeContent() {
  const params = useParams();
  const mediaType = params.media_type as "movie" | "tv";

  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const title = mediaType === "movie" ? "Popular Movies" : "Popular TV Shows";

  const fetchData = useCallback(
    async (pageNum: number) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await fetch(
          `/api/discover?mediaType=${mediaType}&page=${pageNum}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        setResults((prev) =>
          pageNum === 1
            ? data.results.map((item: MediaItem) => ({
                ...item,
                media_type: mediaType,
              }))
            : [
                ...prev,
                ...data.results.map((item: MediaItem) => ({
                  ...item,
                  media_type: mediaType,
                })),
              ],
        );
        setHasMore(data.total_pages > pageNum);
        setError(null);
      } catch {
        setError("Failed to load content");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mediaType],
  );

  useEffect(() => {
    setPage(1);
    setResults([]);
    fetchData(1);
  }, [mediaType, fetchData]);

  useEffect(() => {
    if (page === 1) return;
    fetchData(page);
  }, [page, fetchData]);

  const loadMore = () => {
    if (hasMore && !loadingMore) setPage((p) => p + 1);
  };

  if (loading) return <MediaTypeSkeleton />;
  if (error)
    return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold mb-8 bg-gradient-to-r from-light-accent to-dark-accent bg-clip-text text-transparent pb-2">
        {title}
      </h1>
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p className="text-xl font-medium mb-2">No content available</p>
          <p className="text-gray-500">Try searching or check back later.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
            {" "}
            {results.map((item, i) => (
              <MediaCard
                key={`${item.media_type || mediaType}-${item.id}`}
                item={item}
                index={i}
                hideMetaData
              />
            ))}
            {loadingMore &&
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
          </div>
          {hasMore && !loadingMore && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text text-sm font-medium hover:border-color-accent hover:text-color-accent hover:bg-light-bg dark:hover:bg-dark-bg hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loadingMore ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="w-3.5 h-3.5 animate-spin"
                    />
                    Loading…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faLayerGroup}
                      className="w-3.5 h-3.5"
                    />
                    Load more
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MediaTypePageClient() {
  return <MediaTypeContent />;
}
