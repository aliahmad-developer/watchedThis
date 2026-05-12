"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import Image from "next/image";
import { tmdbImage } from "@/lib/imageTmdb";

// ── In-memory cache (lives for the lifetime of the browser tab) ───────────────
// Keyed by `${id}-${type}-${page}` → { company, results, total_pages }
const pageCache = new Map<string, any>();

function SkeletonCard() {
  return (
    <div className="p-2 animate-pulse">
      <div className="aspect-2/3 w-full rounded-xl bg-light-border dark:bg-dark-border" />
      <div className="mt-2 h-4 bg-light-border dark:bg-dark-border rounded w-4/5 mx-auto" />
      <div className="mt-1 h-3.5 bg-light-border dark:bg-dark-border rounded w-2/5 mx-auto" />
    </div>
  );
}

const ProductionPageSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen animate-pulse">
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-light-card dark:bg-dark-card p-6 rounded-2xl border border-light-border dark:border-dark-border shadow-md">
      <div className="w-35 h-35 rounded-xl bg-light-border dark:bg-dark-border shrink-0" />
      <div className="flex-1 space-y-3 w-full">
        <div className="h-8 bg-light-border dark:bg-dark-border rounded w-1/2" />
        <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/3" />
        <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/4" />
        <div className="flex gap-3 pt-1">
          <div className="h-6 w-20 bg-light-border dark:bg-dark-border rounded-full" />
          <div className="h-6 w-16 bg-light-border dark:bg-dark-border rounded-full" />
        </div>
      </div>
    </div>
    <div className="flex gap-3">
      <div className="h-10 w-28 bg-light-border dark:bg-dark-border rounded-full" />
      <div className="h-10 w-28 bg-light-border dark:bg-dark-border rounded-full" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export default function ProductionPageClient({ id }: { id: string }) {
  const [company, setCompany] = useState<any>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoad, setInitialLoad] = useState(true); // true only on the very first fetch
  const [switching, setSwitching] = useState(false); // true when toggling movie/tv
  const [loadingMore, setLoadingMore] = useState(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(
    async (pageNum: number, type: string, isSwitch = false) => {
      const cacheKey = `${id}-${type}-${pageNum}`;
      const cached = pageCache.get(cacheKey);

      if (cached) {
        // Instant restore from cache — no loading state needed
        if (pageNum === 1) {
          setCompany(cached.company || null);
          setItems(cached.results || []);
        } else {
          setItems((prev) => [...prev, ...(cached.results || [])]);
        }
        setTotalPages(cached.total_pages || 1);
        setInitialLoad(false);
        setSwitching(false);
        setLoadingMore(false);
        return;
      }

      // Cache miss — show appropriate loading state then fetch
      if (pageNum === 1) {
        isSwitch ? setSwitching(true) : setInitialLoad(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(
        `/api/production/${id}?mediaType=${type}&page=${pageNum}`,
      );
      const data = await res.json();

      // Store in cache before updating state
      pageCache.set(cacheKey, {
        company: data.company,
        results: data.results,
        total_pages: data.total_pages,
      });

      if (pageNum === 1) {
        setCompany(data.company || null);
        setItems(data.results || []);
      } else {
        setItems((prev) => [...prev, ...(data.results || [])]);
      }

      setTotalPages(data.total_pages || 1);
      setInitialLoad(false);
      setSwitching(false);
      setLoadingMore(false);
    },
    [id],
  );

  // On first mount: initial load
  useEffect(() => {
    fetchData(1, mediaType, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On media type change (skip the very first render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    fetchData(1, mediaType, true);
  }, [mediaType, fetchData]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !initialLoad &&
          !switching &&
          !loadingMore &&
          page < totalPages
        )
          setPage((prev) => prev + 1);
      },
      { rootMargin: "200px" },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [initialLoad, switching, loadingMore, page, totalPages]);

  useEffect(() => {
    if (page > 1) fetchData(page, mediaType, false);
  }, [page, mediaType, fetchData]);

  // Full-page skeleton only on the very first load
  if (initialLoad) return <ProductionPageSkeleton />;

  if (!company)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-light-secondary-text dark:text-dark-secondary-text">
          Company not found
        </p>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* ── Company Banner ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-md border border-light-border dark:border-dark-border">
        <div className="shrink-0 w-35 h-35 flex items-center justify-center bg-white dark:bg-white/5 rounded-xl shadow-sm border border-light-border dark:border-dark-border p-3">
          {company.logo_path ? (
            <Image
              draggable={false}
              src={tmdbImage(company.logo_path, "w300")!}
              alt={company.name}
              width={120}
              height={120}
              className="object-contain w-full h-full"
            />
          ) : (
            <span className="text-light-secondary-text dark:text-dark-secondary-text text-sm text-center">
              No Logo
            </span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h1 className="text-3xl font-bold text-light-header dark:text-white">
            {company.name}
          </h1>
          {company.origin_country && (
            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
              Origin: {company.origin_country}
            </p>
          )}
          {company.headquarters && (
            <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text">
              HQ: {company.headquarters}
            </p>
          )}
          <div className="flex gap-2 pt-2 flex-wrap justify-center sm:justify-start">
            <span className="text-xs px-3 py-1 rounded-full bg-light-border dark:bg-dark-border text-light-secondary-text dark:text-dark-secondary-text">
              {items.length} titles
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-light-border dark:bg-dark-border text-light-secondary-text dark:text-dark-secondary-text">
              {mediaType === "movie" ? "Movies" : "TV Shows"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Toggle Buttons ─────────────────────────────────────────────── */}
      <div className="flex gap-3">
        {(["movie", "tv"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMediaType(type)}
            disabled={switching}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              mediaType === type
                ? "bg-light-accent dark:bg-dark-accent text-white border-transparent shadow-sm"
                : "bg-transparent border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
            }`}
          >
            {type === "movie" ? "Movies" : "TV Shows"}
          </button>
        ))}
      </div>

      {/* ── Media Grid ─────────────────────────────────────────────────── */}
      {switching ? (
        // Grid-only skeleton while switching tabs — banner stays put
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <MediaCard
              key={`${mediaType}-${item.id}-${index}`}
              item={{ ...item, media_type: mediaType }}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
            No {mediaType === "movie" ? "movies" : "TV shows"} found for this
            company.
          </p>
        </div>
      )}

      {/* ── Infinite scroll sentinel ──────────────────────────────────── */}
      <div ref={loaderRef} className="h-4" />

      {/* ── Loading more ─────────────────────────────────────────────── */}
      {loadingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── End of results ───────────────────────────────────────────── */}
      {!loadingMore && page >= totalPages && items.length > 0 && (
        <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-sm pb-4">
          You've reached the end of the results.
        </p>
      )}
    </div>
  );
}
