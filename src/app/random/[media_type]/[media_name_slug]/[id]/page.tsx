"use client";
import React, { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DiceRoll from "./diceRoll";
import Head from "next/head";
import { createSlug } from "@/app/components/utilities/createSlug";
import Desc from "../../../../components/randomMedia/detailsPage";
import CastScroll from "@/app/components/mediaCard/castScroll";

export default function SpecificRandomMediaPage({
  params,
}: {
  params: Promise<{ media_type: string; media_name_slug: string; id: string }>;
}) {
  const { media_type, media_name_slug, id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const redirectChecked = useRef(false);

  // Loader state
  const [loading, setLoading] = useState(true);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // 2s minimum display time for the dice animation
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!media_type || !id) {
      setError("Invalid URL parameters");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/media/${media_type}/${media_name_slug}/${id}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const json = await res.json();
        setData(json);

        if (!redirectChecked.current) {
          redirectChecked.current = true;
          const expectedSlug = createSlug(json.title || json.name);
          if (media_name_slug !== expectedSlug) {
            router.replace(`/random/${media_type}/${expectedSlug}/${id}`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [media_type, media_name_slug, id, router]);

  // Once both data and min delay are ready → show "Almost there…" → unmount loader
  useEffect(() => {
    if (loading || !minDelayDone) return;

    setFinishing(true);
    const t = setTimeout(() => setShowLoader(false), 700);
    return () => clearTimeout(t);
  }, [loading, minDelayDone]);

  const mediaTitle = data?.title || data?.name || "Media Details";
  const metaDescription = data?.overview
    ? `${data.overview.substring(0, 160)}...`
    : `Details about ${mediaTitle}`;

  if (error) {
    return (
      <>
        <Head>
          <title>Error Loading Media | RandoMovie</title>
          <meta name="description" content="An error occurred while loading media details" />
        </Head>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg">
          <div className="max-w-md w-full bg-light-card dark:bg-dark-card p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="mb-6 text-light-body-text dark:text-dark-body-text">{error}</p>
            <button
              onClick={() => router.push("/random")}
              className="px-6 py-2 bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text rounded-lg hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg transition"
            >
              Try Another Random
            </button>
          </div>
        </div>
      </>
    );
  }

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <DiceRoll finishing={finishing} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${mediaTitle} | RandoMovie`}</title>
        <meta name="description" content={metaDescription} />
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
      </Head>

      <div className="py-6 px-4 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-md overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>
          <Desc
            data={data}
            backdropUrl={`https://image.tmdb.org/t/p/original${data.backdrop_path}`}
          />
        </div>
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <CastScroll cast={data.credits.cast} mediaType={media_type} />
        )}
      </div>
    </>
  );
}