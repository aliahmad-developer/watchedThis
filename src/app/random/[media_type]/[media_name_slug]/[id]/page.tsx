import { notFound } from "next/navigation";
import { cache } from "react";
import RandomMediaShell from "./pageClient";
import Desc from "../../../../components/randomMedia/detailsPage";
import CastScroll from "@/app/components/mediaCard/castScroll";

interface PageParams {
  media_type: string;
  media_name_slug: string;
  id: string;
}
const fetchMediaDetails = cache(
  async (media_type: string, media_name_slug: string, id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/media/${media_type}/${media_name_slug}/${id}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json();
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { media_type, media_name_slug, id } = await params;
  const data = await fetchMediaDetails(media_type, media_name_slug, id);
  if (!data) return { title: "Media Not Found | RandoMovie" };

  const mediaTitle = data.title || data.name || "Media Details";
  const description = data.overview
    ? `${data.overview.substring(0, 160)}...`
    : `Details about ${mediaTitle}`;

  return {
    title: `${mediaTitle} | RandoMovie`,
    description,
    openGraph: {
      title: mediaTitle,
      description,
      images: data.poster_path
        ? [`https://image.tmdb.org/t/p/original${data.poster_path}`]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: mediaTitle,
      description,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { media_type, media_name_slug, id } = await params;

  const data = await fetchMediaDetails(media_type, media_name_slug, id);
  if (!data) notFound();

  const mediaTitle = data.title || data.name || "";

  return (
    // Shell only handles scroll-to-top + dice animation on first mount
    <RandomMediaShell key={id} mediaTitle={mediaTitle}>
      <div className="py-6 px-4 min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="max-w-6xl mx-auto bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text rounded-xl shadow-md overflow-hidden transition-colors">
          <h1 className="sr-only">{mediaTitle}</h1>
          <Desc
            data={data}
            backdropUrl={data.backdrop_path ?? ""}
            isLoading={false}
          />
        </div>
        {data.credits?.cast?.length > 0 && (
          <CastScroll cast={data.credits.cast} mediaType={media_type} />
        )}
      </div>
    </RandomMediaShell>
  );
}
