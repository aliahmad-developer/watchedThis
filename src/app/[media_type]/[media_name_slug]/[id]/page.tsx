"use client";
import React, { useEffect, useState } from "react";
import { createSlug } from "@/app/components/utilities/createSlug";
import { useRouter } from "next/navigation";
import Head from "next/head";
import CastScroll from "@/app/components/mediaCard/castScroll";
import Desc from "@/app/components/randomMedia/detailsPage";

export default function SpecificRandomMediaPage({
  params,
}: {
  params: Promise<{ media_type: string; media_name_slug: string; id: string }>;
}) {
  const router = useRouter();
  const { media_type, media_name_slug, id } = React.use(params);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!media_type || !id) {
      setError("Invalid URL parameters");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/media/${media_type}/${media_name_slug}/${id}`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const json = await res.json();
        setData(json);

        const expectedSlug = createSlug(json.title || json.name);
        if (media_name_slug !== expectedSlug) {
          router.replace(`/${media_type}/${expectedSlug}/${id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [media_type, media_name_slug, id, router]);

  const mediaTitle = data?.title || data?.name || "Media Details";
  const metaDescription = data?.overview
    ? `${data.overview.substring(0, 160)}...`
    : `Details about ${mediaTitle}`;

  if (error) {
    return (
      <>
        <Head>
          <title>Error Loading Media | Your Site Name</title>
          <meta
            name="description"
            content="An error occurred while loading media details"
          />
        </Head>
        <div className="flex items-center justify-center min-h-screen text-light-accent dark:text-dark-accent">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          {isLoading
            ? "Loading... | Your Site Name"
            : `${mediaTitle} | Your Site Name`}
        </title>
        <meta name="description" content={metaDescription} />
        {!isLoading && (
          <>
            <meta property="og:title" content={mediaTitle} />
            <meta property="og:description" content={metaDescription} />
            {data.poster_path && (
              <meta
                property="og:image"
                content={`https://image.tmdb.org/t/p/original${data.poster_path}`}
              />
            )}
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
          </>
        )}
      </Head>

      <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-lg overflow-hidden transition-colors">
          <h1 className="sr-only">
            {isLoading ? "Loading media..." : mediaTitle}
          </h1>

          {/* Desc component with skeleton loading */}
          <Desc
            data={data || {}} // Pass empty object when loading
            backdropUrl={
              data?.backdrop_path
                ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
                : ""
            }
            isLoading={isLoading}
          />
        </div>

        {/* Cast Section with Skeleton */}
        {isLoading ? (
          <CastScrollSkeleton />
        ) : (
          data?.credits?.cast &&
          data.credits.cast.length > 0 && (
            <CastScroll cast={data.credits.cast} mediaType={media_type} />
          )
        )}
      </div>
    </>
  );
}

// Cast Scroll Skeleton Component
function CastScrollSkeleton() {
  return (
    <div className="max-w-6xl mx-auto mt-8 animate-pulse">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
      <div className="flex space-x-4 overflow-hidden">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="shrink-0 w-32">
            <div className="w-28 sm:w-32 h-40 sm:h-48 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
