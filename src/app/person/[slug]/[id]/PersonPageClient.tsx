"use client";
import type { PersonData, Credit } from "./types";
import Image from "next/image";
import Link from "next/link";
import { useMediaType } from "@/app/components/hooks/Genre/useMediaType";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { useEffect, useState, useRef } from "react";
import { GenreHeader } from "@/app/components/Genre/mediaTypeToggle";

const PersonPageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg space-y-12 animate-pulse">
    <div className="flex flex-col md:flex-row gap-8 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="shrink-0 mx-auto md:mx-0 w-75 h-112.5 bg-light-border dark:bg-dark-border rounded-xl" />
      <div className="grow flex flex-col gap-4">
        <div className="h-10 bg-light-border dark:bg-dark-border rounded w-2/3" />
        <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/4" />
        <div className="h-7 bg-light-border dark:bg-dark-border rounded w-32 mt-2" />
        <div className="space-y-2.5">
          {[100, 92, 96, 85, 90, 78, 88, 94, 80].map((w, i) => (
            <div
              key={i}
              className="h-3.5 bg-light-border dark:bg-dark-border rounded"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="h-8 bg-light-border dark:bg-dark-border rounded w-44 mb-6" />
      <div className="h-6 bg-light-border dark:bg-dark-border rounded w-20 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-2/3 bg-light-border dark:bg-dark-border rounded-lg"
          />
        ))}
      </div>
    </div>
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
      <div className="h-8 bg-light-border dark:bg-dark-border rounded w-24 mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-2/3 bg-light-border dark:bg-dark-border rounded-lg"
          />
        ))}
      </div>
    </div>
  </div>
);

function CreditGrid({
  credits,
  keyPrefix,
  displayTitleKey,
}: {
  credits: Credit[];
  keyPrefix: string;
  displayTitleKey?: "character" | "job";
}) {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const hasMore = visibleCount < credits.length;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVisibleCount(10);
  }, [credits]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 10);
            setLoading(false);
          }, 400);
        }
      },
      { rootMargin: "100px" },
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {credits.slice(0, visibleCount).map((credit, index) => (
          <MediaCard
            key={`${keyPrefix}-${credit.media_type}-${credit.id}-${credit[displayTitleKey ?? "character"] || "unknown"}-${index}`}
            item={{
              id: credit.id,
              title: credit.title,
              name: credit.title,
              poster_path: credit.poster_path || undefined,
              media_type: credit.media_type,
              runtime: credit.runtime || undefined,
              episode_run_time: credit.episode_run_time || undefined,
            }}
            displayTitle={
              displayTitleKey ? credit[displayTitleKey] || "" : undefined
            }
          />
        ))}
      </div>

      <div ref={loaderRef} className="w-full">
        {hasMore && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                <div className="bg-light-border dark:bg-dark-border rounded-lg aspect-2/3 w-full mb-2" />
                <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4 mb-1" />
                <div className="h-3 bg-light-border dark:bg-dark-border rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PersonPageClient({
  id,
  initialData,
}: {
  slug: string;
  id: string;
  initialData: PersonData | null;
}) {
  const { mediaType, setMediaType } = useMediaType();
  const [data] = useState<PersonData | null>(initialData);
  const error = initialData === null ? "Person not found" : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  const filteredCast =
    data?.credits?.cast.filter((c) => c.media_type === mediaType) || [];
  const filteredCrew =
    data?.credits?.crew.filter((c) => c.media_type === mediaType) || [];

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-light-header dark:text-white">
            Person Not Found
          </h1>
          <p className="mb-4 text-light-secondary-text dark:text-dark-secondary-text">
            {error}
          </p>
          <Link
            href="/"
            className="text-light-accent dark:text-dark-accent hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );

  if (!data) return <PersonPageSkeleton />;

  const { details, images } = data;
  const bioText = details.biography || "No biography available.";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
        <div className="shrink-0 mx-auto md:mx-0">
          {details.profile_path ? (
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/w500${details.profile_path}`}
              alt={details.name}
              width={300}
              height={450}
              className="rounded-xl object-cover shadow-lg w-75 h-112.5"
              priority
            />
          ) : (
            <div className="w-75 h-112.5 flex items-center justify-center bg-light-border dark:bg-dark-border rounded-xl shadow-lg">
              <span className="text-gray-500">No Image Available</span>
            </div>
          )}
        </div>
        <div className="grow flex flex-col min-h-0">
          <h1 className="text-4xl font-bold text-light-accent dark:text-dark-accent mb-2 p-1">
            {details.name}
          </h1>
          <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text mb-4">
            {details.known_for_department}
          </p>
          <h2 className="mb-4">Biography</h2>
          <div className="overflow-y-auto max-h-72 md:max-h-80 pr-2 scrollbar-thin scrollbar-thumb-light-border dark:scrollbar-thumb-dark-border scrollbar-track-transparent">
            <p className="text-sm md:text-base leading-relaxed text-light-secondary-text dark:text-dark-secondary-text whitespace-pre-wrap">
              {bioText}
            </p>
          </div>
        </div>
      </div>

      {/* Credits */}
      {data.credits && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <GenreHeader
              genreName="Filmography"
              mediaType={mediaType}
              onMediaTypeChange={setMediaType}
            />
          </div>

          {filteredCast.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">
                Acting
              </h3>
              <CreditGrid
                credits={filteredCast}
                keyPrefix="cast"
                displayTitleKey="character"
              />
            </div>
          )}

          {filteredCrew.length > 0 && (
            <div>
              <h3 className="text-xl font-medium text-light-header dark:text-gray-200 mb-4">
                Production
              </h3>
              <CreditGrid
                credits={filteredCrew}
                keyPrefix="crew"
                displayTitleKey="job"
              />
            </div>
          )}
        </div>
      )}

      {/* Gallery */}
      {images && images.profiles.length > 0 && (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md">
          <h2 className="mb-6">Gallery</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.profiles.map((image) => (
              <div
                key={image.file_path}
                className="overflow-hidden rounded-lg shadow-md"
              >
                <Image
                  draggable={false}
                  src={`https://image.tmdb.org/t/p/w300${image.file_path}`}
                  alt={`${details.name} portrait`}
                  width={200}
                  height={250}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
