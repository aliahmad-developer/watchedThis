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

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(
    async (pageNum: number, type: string) => {
      setLoading(true);
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
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, page, totalPages]);

  // Fetch new page
  useEffect(() => {
    if (page > 1) {
      fetchData(page, mediaType);
    }
  }, [page, mediaType, fetchData]);

  if (!company) {
    return <Loading centerInParent fullScreen />;
  }

  return (
    <div className="p-6 space-y-8">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${mediaType}/${createSlug(
              item.title || item.name || "untitled"
            )}/${item.id}`}
          >
            <MediaCard item={{ ...item, media_type: mediaType }} />
          </Link>
        ))}
      </div>

      {/* Loader */}
      <div ref={loaderRef} className="h-10 flex justify-center items-center">
        {loading && <Loading hideText size="sm" />}
      </div>
    </div>
  );
}
