"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import MediaCard from "../components/mediaCard/mediaCard";
import {
  smartSearch,
  MediaResult,
} from "../components/utilities/search/searchFuse";

function SkeletonCard() {
  return (
    <div className="p-2 animate-pulse">
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-light-border dark:bg-dark-border" />
      <div className="mt-2 h-4 bg-light-border dark:bg-dark-border rounded w-4/5 mx-auto" />
      <div className="mt-1 h-3.5 bg-light-border dark:bg-dark-border rounded w-2/5 mx-auto" />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const fetchId = useRef(0);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        hasMoreRef.current &&
        !loadingRef.current &&
        !loadingMoreRef.current
      ) {
        setPage((prev) => prev + 1);
      }
    });
    observer.current.observe(node);
  }, []);

  useEffect(() => {
    fetchId.current += 1;
    setPage(1);
    setResults([]);
    setHasMore(true);
    hasMoreRef.current = true;
  }, [query]);

  useEffect(() => {
    if (!query) return;
    const id = fetchId.current;

    const fetchResults = async () => {
      try {
        if (page === 1) {
          setLoading(true);
          loadingRef.current = true;
        } else {
          setLoadingMore(true);
          loadingMoreRef.current = true;
        }
        const data = await smartSearch(query, page);
        if (id !== fetchId.current) return;
        setResults((prev) =>
          page === 1 ? data.results : [...prev, ...data.results],
        );
        setHasMore(data.has_more);
        hasMoreRef.current = data.has_more;
      } catch (err) {
        if (id !== fetchId.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (id !== fetchId.current) return;
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
        loadingMoreRef.current = false;
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, page]);

  useEffect(() => () => observer.current?.disconnect(), []);

  if (!query) return <p className="text-center mt-8">No query provided.</p>;
  if (error)
    return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 min-h-180">
      <h1 className="text-center text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

      {loading ? (
        <SearchSkeleton />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2">
          {results.map((item, i) => {
            const isLast = i === results.length - 1;
            return (
              <div
                key={`${item.id}-${i}`}
                ref={isLast ? lastItemRef : null}
                className="transition-opacity duration-300"
              >
                <MediaCard item={item} />
              </div>
            );
          })}

          {loadingMore &&
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={`more-${i}`} />
            ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-lg text-gray-500">
            No results found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchClientPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
