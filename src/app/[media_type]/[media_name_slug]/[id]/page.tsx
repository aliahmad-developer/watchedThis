import React from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createSlug } from "@/app/components/utilities/createSlug";
import CastScroll from "@/app/components/mediaCard/castScroll";
import Desc from "@/app/components/randomMedia/detailsPage";
import DetailsClientShell from "./clientShell";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
// ─── Types ───────────────────────────────────────────────────────────────────

interface PageParams {
  media_type: string;
  media_name_slug: string;
  id: string;
}

const fetchMediaDetails = unstable_cache(
  async (media_type: string, media_name_slug: string, id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/media/${media_type}/${media_name_slug}/${id}`);
    if (!res.ok) return null;
    return res.json();
  },
  ["media-details"],
  { revalidate: 3600 }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { media_type, media_name_slug, id } = await params;
  const data = await fetchMediaDetails(media_type, media_name_slug, id);

  if (!data) {
    return { title: "Media Not Found | RandoMovie" };
  }

  const mediaTitle = data.title || data.name || "Media Details";
  const description = data.overview
    ? `${data.overview.substring(0, 160)}...`
    : `Details about ${mediaTitle}`;

  return {
    title: mediaTitle,
    description,
    openGraph: {
      title: mediaTitle,
      description,
      images: data.poster_path
        ? [
            {
              url: `https://image.tmdb.org/t/p/w1280${data.poster_path}`,
              width: 1280,
              height: 1920,
              alt: mediaTitle,
            },
          ]
        : [
            {
              url: "/og-default.png",
              width: 1200,
              height: 630,
              alt: "RandoMovie",
            },
          ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: mediaTitle,
      description,
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SpecificRandomMediaPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { media_type, media_name_slug, id } = await params;

  const data = await fetchMediaDetails(media_type, media_name_slug, id);

  if (!data) notFound();

  const mediaTitle = data.title || data.name || "Media Details";

  // Canonical slug — if the URL slug is wrong the client shell will redirect
  const expectedSlug = createSlug(mediaTitle);
  if (media_name_slug !== expectedSlug) {
  redirect(`/random/${media_type}/${expectedSlug}/${id}`);
}
  return (
    // DetailsClientShell handles scroll-to-top + slug redirect only
    <DetailsClientShell
      mediaType={media_type}
      currentSlug={media_name_slug}
      expectedSlug={expectedSlug}
      id={id}
    >
      <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-lg overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>

          {/* Data arrives with the HTML — no skeleton needed, no loading state */}
          <Desc
            data={data}
            backdropUrl={data.backdrop_path ?? ""} // e.g. "/8x9iKH8kWA0zdkgNdpAew7OstYe.jpg"
            isLoading={false}
          />
        </div>

        {data.credits?.cast && data.credits.cast.length > 0 && (
          <CastScroll cast={data.credits.cast} mediaType={media_type} />
        )}
      </div>
    </DetailsClientShell>
  );
}
