//app\[media_type]\[media_name_slug]\[id]\page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { createSlug } from "@/app/components/utilities/createSlug";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Loading from "@/app/components/utilities/loading";
import Desc from "@/app/components/randomMedia/desc";
export default function SpecificRandomMediaPage({
  params,
}: {
  params: Promise<{ media_type: string; media_name_slug: string; id: string }>;
}) {
  const router = useRouter();
  const { media_type, media_name_slug, id } = React.use(params);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!media_type || !id) {
      setError("Invalid URL parameters");
      return;
    }

    const fetchData = async () => {
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
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>Loading... | RandoMovie</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
          <Loading />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${mediaTitle} | Your Site Name`}</title>
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
      </div>
    </>
  );
}
