"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "../components/utilities/loading";
import MediaCard from "../components/mediaCard/mediaCard";
import Link from "next/link";

export default function SearchClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
    [loading, loadingMore, hasMore]
  );

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        if (page === 1) {
          setLoading(true);
          setResults([]);
          setSuggestions([]);
        } else {
          setLoadingMore(true);
        }

        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query)}&page=${page}`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();

        setResults((prev) =>
          page === 1 ? data.results : [...prev, ...data.results]
        );
        setHasMore(data.has_more);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, page]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  if (!query) return <p className="text-center mt-8">No query provided.</p>;
  if (error)
    return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>

      {suggestions.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Did you mean:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  setSuggestions([]);
                  router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-[50vh] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loading fullScreen={false} centerInParent={true} />
          </div>
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
                      href={`/${item.media_type}/${createSlug(
                        item.title || item.name
                      )}/${item.id}`}
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
                <Loading size="md" fullScreen={false} text="Loading more..." />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-lg text-gray-500">
              No results found for "{query}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function createSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}