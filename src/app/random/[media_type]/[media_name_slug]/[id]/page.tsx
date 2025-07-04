"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Loading from "../../../../components/utilities/loading";
import Desc from '../../../../components/randomMedia/desc'
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
          router.replace(`/random/${media_type}/${expectedSlug}/${id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media");
      }
    };

    fetchData();
  }, [media_type, media_name_slug, id, router]);

  const createSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");

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
        <div className=" m-100 min-h-screen flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg">
          <div className="max-w-md w-full bg-light-card dark:bg-dark-card p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="mb-6 text-light-body-text dark:text-dark-body-text">
              {error}
            </p>
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
          <Desc data={data} backdropUrl={`https://image.tmdb.org/t/p/original${data.backdrop_path}`}/>
        </div>
      </div>
      <div className="p-100"></div>
    </>
  );
}
