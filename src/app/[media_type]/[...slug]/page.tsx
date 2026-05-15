import React from "react";
import { notFound, redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createSlug } from "@/app/components/utilities/createSlug";
import CastScroll from "@/app/components/mediaCard/castScroll";
import DetailsPage from "@/app/components/randomMedia/detailsPage";
import DetailsClientShell from "./clientShell";
import type { Metadata } from "next";
import { tmdbImage } from "@/lib/imageTmdb";
import { cache } from "react";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";


// ─── Types ───────────────────────────────────────────────────────────────────

interface PageParams {
  media_type: string;
  slug: string[];
}

type ResolvedMedia =
  | { shouldRedirect: true; redirectTo: string }
  | { shouldRedirect: false; data: any; media_name_slug: string; id: string };

// ─── Fetchers ─────────────────────────────────────────────────────────────────

const fetchMediaById = (media_type: string, id: string) =>
  unstable_cache(
    async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";
      const res = await fetch(`${baseUrl}/api/media/${media_type}/_/${id}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      return res.json();
    },
    [`media-by-id-${media_type}-${id}`],
    { revalidate: 3600 },
  )();

const fetchMediaDetails = cache(
  (media_type: string, media_name_slug: string, id: string) =>
    unstable_cache(
      async () => {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";
        const res = await fetch(
          `${baseUrl}/api/media/${media_type}/${media_name_slug}/${id}`,
          {
            next: { revalidate: 3600 },
          },
        );
        if (!res.ok) return null;
        return res.json();
      },
      [`media-details-${media_type}-${media_name_slug}-${id}`],
      { revalidate: 3600 },
    )(),
);

// ─── Structured Data ──────────────────────────────────────────────────────────

function buildJsonLd(data: any, media_type: string) {
  const mediaTitle = data.title || data.name || "Media Details";
  const isMovie = media_type === "movie";

  return {
    "@context": "https://schema.org",
    "@type": isMovie ? "Movie" : "TVSeries",
    name: mediaTitle,
    description: data.overview || "",
    image: data.poster_path ? tmdbImage(data.poster_path, "w500")! : undefined,
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
            (c: any) => c.job === "Director",
          );
          return director
            ? { director: { "@type": "Person", name: director.name } }
            : {};
        })()
      : {}),
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function resolveParams(
  media_type: string,
  slug: string[],
): Promise<ResolvedMedia | null> {
  // /tv/76479 → slug = ['76479']
  if (slug.length === 1 && /^\d+$/.test(slug[0])) {
    const id = slug[0];
    const data = await fetchMediaById(media_type, id);
    if (!data) return null;
    const correctSlug = createSlug(data.title || data.name);
    return {
      shouldRedirect: true,
      redirectTo: `/${media_type}/${correctSlug}/${id}`,
    };
  }
  const media_name_slug = slug[0];
  const id = slug[1];
  if (!media_name_slug || !id) return null;

  const data = await fetchMediaDetails(media_type, media_name_slug, id);
  if (!data) return null;

  const correctSlug = createSlug(data.title || data.name);
  if (correctSlug !== media_name_slug) {
    return {
      shouldRedirect: true,
      redirectTo: `/${media_type}/${correctSlug}/${id}`,
    };
  }

  return { shouldRedirect: false, data, media_name_slug, id };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { media_type, slug } = await params;

  if (slug.length === 1) return { title: "Loading... | WatchedThis" };

  const media_name_slug = slug[0];
  const id = slug[1];
  if (!media_name_slug || !id)
    return { title: "Media Not Found | WatchedThis" };

  const data = await fetchMediaDetails(media_type, media_name_slug, id);
  if (!data) return { title: "Media Not Found | WatchedThis" };

  const mediaTitle = data.title || data.name || "Media Details";
  const year = (data.release_date || data.first_air_date || "").substring(0, 4);
  const typeLabel = media_type === "movie" ? "Movie" : "TV Series";
  const description = data.overview
    ? `${data.overview.substring(0, 155)}...`
    : `Details about ${mediaTitle}`;

  const ogUrl = new URL("/og", "https://watchedthis.com");
  ogUrl.searchParams.set("title", `${mediaTitle}${year ? ` (${year})` : ""}`);
  ogUrl.searchParams.set("subtitle", description);
  if (data.poster_path) ogUrl.searchParams.set("poster", data.poster_path);

  return {
    title: `${mediaTitle} ${year ? `(${year})` : ""} | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/${media_type}/${media_name_slug}/${id}`,
    },
    openGraph: {
      title: `${mediaTitle} ${year ? `(${year})` : ""} — ${typeLabel} | WatchedThis`,
      description,
      type: "video.movie",
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${mediaTitle} — WatchedThis`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${mediaTitle} ${year ? `(${year})` : ""} | WatchedThis`,
      description,
      images: [ogUrl.toString()],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SpecificRandomMediaPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { media_type, slug } = await params;

  const resolved = await resolveParams(media_type, slug);

  if (!resolved) notFound();
  if (resolved.shouldRedirect) redirect(resolved.redirectTo);

  const { data, media_name_slug, id } = resolved;

  const mediaTitle = data.title || data.name || "Media Details";
  const expectedSlug = createSlug(mediaTitle);
  const jsonLd = buildJsonLd(data, media_type);

  return (
    <DetailsClientShell
      mediaType={media_type}
      currentSlug={media_name_slug}
      expectedSlug={expectedSlug}
      id={id}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-lg overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>
          <Breadcrumbs
            crumbs={[
              { name: "Home", href: "/" },
              {
                name: media_type === "movie" ? "Movies" : "TV Series",
                href: `/${media_type}`,
              },
              {
                name: mediaTitle,
                href: `/${media_type}/${media_name_slug}/${id}`,
              },
            ]}
          />


          <DetailsPage
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
