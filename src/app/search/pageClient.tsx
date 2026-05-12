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

// ─── Module-level cache (survives navigation within session) ──────────────────

interface CacheEntry {
  results: MediaResult[];
  page: number;
  hasMore: boolean;
}

const searchCache = new Map<string, CacheEntry>();

// ─── Skeletons ────────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const keyword = searchParams.get("keyword") || "";
  const activeTerm = query || keyword;

  // Seed state from cache if available
  const cached = activeTerm ? searchCache.get(activeTerm) : undefined;

  const [results, setResults] = useState<MediaResult[]>(cached?.results ?? []);
  const [loading, setLoading] = useState(!cached);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(cached?.page ?? 1);
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true);

  const hasMoreRef = useRef(cached?.hasMore ?? true);
  const loadingRef = useRef(!cached);
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

  // Reset on term change
  useEffect(() => {
    const nextCached = activeTerm ? searchCache.get(activeTerm) : undefined;

    fetchId.current += 1;
    setResults(nextCached?.results ?? []);
    setPage(nextCached?.page ?? 1);
    setHasMore(nextCached?.hasMore ?? true);
    hasMoreRef.current = nextCached?.hasMore ?? true;
    setLoading(!nextCached);
    loadingRef.current = !nextCached;
    setError(null);
  }, [activeTerm]);

  // Fetch — skip if this page is already in cache
  useEffect(() => {
    if (!activeTerm) return;

    const cached = searchCache.get(activeTerm);
    // If cache covers this page already, don't refetch
    if (cached && page <= cached.page) return;

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

        const data = keyword
          ? await smartSearch("", page, keyword)
          : await smartSearch(query, page);

        if (id !== fetchId.current) return;

        setResults((prev) => {
          const next = page === 1 ? data.results : [...prev, ...data.results];
          // Write to cache
          searchCache.set(activeTerm, {
            results: next,
            page,
            hasMore: data.has_more,
          });
          return next;
        });

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

    const timer = setTimeout(fetchResults, page === 1 ? 0 : 300);
    return () => clearTimeout(timer);
  }, [activeTerm, page]);

  useEffect(() => () => observer.current?.disconnect(), []);

  if (!activeTerm)
    return <p className="text-center mt-8">No query provided.</p>;
  if (error)
    return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 min-h-180">
      <h1 className="text-center text-2xl font-bold mb-6">
        {keyword ? `#${keyword}` : `Search Results for "${query}"`}
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
            {keyword
              ? `No results found for #${keyword}`
              : `No results found for "${query}"`}
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
