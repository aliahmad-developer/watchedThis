'use client'
import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSlug } from "../components/utilities/createSlug";
import MediaCard from "../components/mediaCard/mediaCard";
import Link from "next/link";
import { smartSearch, MediaResult } from "../components/utilities/search/searchFuse";

// ── Skeleton ──────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-2/3 w-full mb-2" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Search content ────────────────────────────────────────────

function SearchContent() {
  const searchParams  = useSearchParams();
  const query         = searchParams.get("q") || "";

  const [results,     setResults]     = useState<MediaResult[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore],
  );

  // Reset to page 1 when query changes
  useEffect(() => {
    setPage(1);
    setResults([]);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        if (page === 1) {
          setLoading(true);
          setResults([]);
        } else {
          setLoadingMore(true);
        }

        const data = await smartSearch(query, page);

        setResults((prev) =>
          page === 1 ? data.results : [...prev, ...data.results],
        );
        setHasMore(data.has_more);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, page]);

  useEffect(() => {
    return () => { observer.current?.disconnect(); };
  }, []);

  if (!query) return <p className="text-center mt-8">No query provided.</p>;
  if (error)  return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 min-h-180">
      <h1 className="text-center text-2xl font-bold mb-6">Search Results for "{query}"</h1>

      {loading ? (
        <SearchSkeleton />
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
            {results.map((item, i) => {
              const isLast = i === results.length - 1;
              return (
                <div
                  key={`${item.id}-${i}`}
                  ref={isLast ? lastItemRef : null}
                  draggable={false}
                  className="transition-opacity duration-300"
                >
                  <Link
                    href={`/${item.media_type}/${createSlug(item.title || item.name || "")}/${item.id}`}
                    passHref
                  >
                    <MediaCard item={item} />
                  </Link>
                </div>
              );
            })}
          </div>

          {loadingMore && (
            <div className="w-full flex justify-center py-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2 w-full">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`loading-${i}`} className="animate-pulse">
                    <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-2/3 w-full mb-2" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────

export default function SearchClientPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}