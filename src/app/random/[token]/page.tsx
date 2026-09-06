import { notFound } from "next/navigation";
import { cache } from "react";
import { verifyToken } from "@/app/components/utilities/signId";
import RandomMediaShell from "./pageClient";
import DetailsPage from "@/app/components/randomMedia/detailsPage";
import CastScroll from "@/app/components/mediaCard/castScroll";
import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import { tmdbImage } from "@/lib/imageTmdb";

import { fetchMediaById } from "@/lib/mediaDetails";
import type { MediaDetails } from "@/lib/mediaDetails";

interface PageParams {
  token: string;
}

// Direct TMDB fetch — no HTTP self-fetch, no middleware re-entry
const fetchMediaDetails = cache(
  async (media_type: string, id: number): Promise<MediaDetails | null> => {
    try {
      return await fetchMediaById(media_type, id);
    } catch (err) {
      console.error("MEDIA FETCH ERROR:", err);
      return null;
    }
  },
);


export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { token } = await params;
  const payload = verifyToken(token);
  if (!payload) notFound();

  const data = await fetchMediaDetails(payload.media_type, payload.id);

  const title = data?.title || data?.name || "Random Pick";

  const description =
    data?.overview?.slice(0, 160) || `Explore ${title} on WatchedThis.`;

  const image = data?.poster_path
    ? tmdbImage(data.poster_path, "w780")
    : undefined;

  return {
    metadataBase: new URL("https://watchedthis.com"),

    title: `${title} | WatchedThis`,

    description,

    alternates: {
      canonical: `/random/${token}`,
    },

    robots: {
      index: false,
      follow: true,
    },

    openGraph: {
      title,
      description,

      url: `https://watchedthis.com/random/${token}`,

      siteName: "WatchedThis",

      images: image ? [image] : [],

      type: "article",
    },

    twitter: {
      card: "summary_large_image",

      title,
      description,

      images: image ? [image] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { token } = await params;

  const payload = verifyToken(token);
  if (!payload) notFound();

  const { id, media_type } = payload;

  const data = await fetchMediaDetails(media_type, id);

  // Soft fallback — don't 404 if TMDB is flaky
  const safeData = data ?? {
    id,
    media_type,
    title: "Content unavailable",
    overview: "This content could not be loaded right now.",
    credits: { cast: [] },
  };

  const mediaTitle = safeData.title || safeData.name || "Untitled";
  return (
    <RandomMediaShell key={id} mediaTitle={mediaTitle} initialLoad={false}>
      <div className="py-6 px-4 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-md overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>
          <Breadcrumbs
            crumbs={[
              { name: "Home", href: "/" },
              { name: "Random", href: "/random" },
              {
                name: `${String(token).slice(0, 8)}…`,
                href: `/random/${token}`,
              },
            ]}
          />
          <DetailsPage
            data={safeData}
            backdropUrl={safeData.backdrop_path ?? ""}
            isLoading={false}
          />
        </div>

        {(safeData?.credits?.cast?.length ?? 0) > 0 && (
          <CastScroll
            cast={safeData.credits!.cast!}
            mediaType={safeData.media_type}
          />
        )}
      </div>
    </RandomMediaShell>
  );
}
