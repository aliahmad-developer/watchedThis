// app/production/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";

import Loading from "@/app/components/utilities/loading";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import Image from "next/image";
import Link from "next/link";
import { createSlug } from "@/app/components/utilities/createSlug";

export default function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [company, setCompany] = useState<any>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(
    async (pageNum: number, type: string) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(
        `/api/company/${id}?mediaType=${type}&page=${pageNum}`
      );
      const data = await res.json();

      if (pageNum === 1) {
        setCompany(data.company || null);
        setItems(data.results || []);
      } else {
        setItems((prev) => [...prev, ...(data.results || [])]);
      }

      setTotalPages(data.total_pages || 1);
      setLoading(false);
      setLoadingMore(false);
    },
    [id]
  );

  // First load & when media type changes
  useEffect(() => {
    setPage(1);
    fetchData(1, mediaType);
  }, [mediaType, fetchData]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          page < totalPages
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  useEffect(() => {
    if (page > 1) {
      fetchData(page, mediaType);
    }
  }, [page, mediaType, fetchData]);

  if (loading) {
    return (
      <div className="min-h-[100vh] flex items-center justify-center">
        <Loading fullScreen />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[100vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-light-secondary-text dark:text-dark-secondary-text">
            Company not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-[100vh]">
      {/* Company Banner */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-md border border-light-border dark:border-dark-border">
        {company.logo_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${company.logo_path}`}
            alt={company.name}
            width={150}
            height={150}
            className="object-contain bg-white p-2 rounded-lg shadow-sm"
          />
        ) : (
          <div className="w-[150px] h-[150px] flex items-center justify-center rounded-lg bg-light-disabled dark:bg-dark-disabled text-light-secondary-text dark:text-dark-secondary-text">
            No Logo
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-light-header dark:text-dark-body-text">
            {company.name}
          </h1>
          <p className="text-sm mb-1 text-light-secondary-text dark:text-dark-secondary-text">
            Origin Country: {company.origin_country || "Unknown"}
          </p>
          {company.headquarters && (
            <p className="text-sm mb-1 text-light-body-text dark:text-dark-body-text">
              HQ: {company.headquarters}
            </p>
          )}
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setMediaType("movie")}
          className={`px-6 py-2 rounded-full ${
            mediaType === "movie"
              ? "bg-light-accent text-white"
              : "bg-light-card dark:bg-dark-card"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => setMediaType("tv")}
          className={`px-6 py-2 rounded-full ${
            mediaType === "tv"
              ? "bg-light-accent text-white"
              : "bg-light-card dark:bg-dark-card"
          }`}
        >
          TV Shows
        </button>
      </div>

      {/* Media Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <Link
              key={`${mediaType}-${item.id}-${index}`}
              href={`/${mediaType}/${createSlug(
                item.title || item.name || "untitled"
              )}/${item.id}`}
            >
              <MediaCard item={{ ...item, media_type: mediaType }} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-light-secondary-text dark:text-dark-secondary-text">
            No {mediaType === "movie" ? "movies" : "TV shows"} found for this
            company.
          </p>
        </div>
      )}

      {/* Loader for infinite scroll */}
      <div ref={loaderRef} className="h-20 flex justify-center items-center">
        {loadingMore && (
          <div className="w-full flex justify-center py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 m-2 w-full">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`loading-${index}`} className="animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3] w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* End of results message */}
      {!loadingMore && page >= totalPages && items.length > 0 && (
        <div className="text-center py-6">
          <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
            You've reached the end of the results.
          </p>
        </div>
      )}
    </div>
  );
}
