import React from "react";
import { notFound, redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createSlug } from "@/app/components/utilities/createSlug";
import CastScroll from "@/app/components/mediaCard/castScroll";
import Desc from "@/app/components/randomMedia/detailsPage";
import DetailsClientShell from "./clientShell";
import type { Metadata } from "next";

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

// ─── Structured Data ─────────────────────────────────────────────────────────

function buildJsonLd(data: any, media_type: string) {
  const mediaTitle = data.title || data.name || "Media Details";
  const isMovie = media_type === "movie";

  const base = {
    "@context": "https://schema.org",
    "@type": isMovie ? "Movie" : "TVSeries",
    name: mediaTitle,
    description: data.overview || "",
    image: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : undefined,
    ...(data.release_date || data.first_air_date
      ? { datePublished: data.release_date || data.first_air_date }
      : {}),
    ...(data.vote_average && data.vote_count
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: data.vote_average.toFixed(1),
            bestRating: "10",
            worstRating: "0",
            ratingCount: data.vote_count,
          },
        }
      : {}),
    ...(data.genres?.length
      ? { genre: data.genres.map((g: any) => g.name) }
      : {}),
    ...(data.credits?.cast?.length
      ? {
          actor: data.credits.cast.slice(0, 5).map((c: any) => ({
            "@type": "Person",
            name: c.name,
          })),
        }
      : {}),
    ...(data.credits?.crew?.length
      ? (() => {
          const director = data.credits.crew.find(
            (c: any) => c.job === "Director"
          );
          return director
            ? { director: { "@type": "Person", name: director.name } }
            : {};
        })()
      : {}),
  };

  return base;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { media_type, media_name_slug, id } = await params;
  const data = await fetchMediaDetails(media_type, media_name_slug, id);

  if (!data) {
    return { title: "Media Not Found | WatchedThis" };
  }

  const mediaTitle = data.title || data.name || "Media Details";
  const year = (data.release_date || data.first_air_date || "").substring(0, 4);
  const typeLabel = media_type === "movie" ? "Movie" : "TV Series";

  const description = data.overview
    ? `${data.overview.substring(0, 155)}...`
    : `Details about ${mediaTitle}`;

  return {
    title: `${mediaTitle} ${year ? `(${year})` : ""} | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/${media_type}/${media_name_slug}/${id}`,
    },
    openGraph: {
      title: `${mediaTitle} ${year ? `(${year})` : ""} — ${typeLabel} | WatchedThis`,
      description,
      images: data.poster_path
        ? [
            {
              url: `https://image.tmdb.org/t/p/w1280${data.poster_path}`,
              width: 1280,
              height: 1920,
              alt: `${mediaTitle} poster`,
            },
          ]
        : [{ url: "/og-default.png", width: 1200, height: 630, alt: "WatchedThis" }],
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${mediaTitle} ${year ? `(${year})` : ""} | WatchedThis`,
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

  const expectedSlug = createSlug(mediaTitle);
  if (media_name_slug !== expectedSlug) {
    redirect(`/random/${media_type}/${expectedSlug}/${id}`);
  }

  const jsonLd = buildJsonLd(data, media_type);

  return (
    <DetailsClientShell
      mediaType={media_type}
      currentSlug={media_name_slug}
      expectedSlug={expectedSlug}
      id={id}
    >
      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-lg overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>

          <Desc
            data={data}
            backdropUrl={data.backdrop_path ?? ""}
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