import { notFound } from "next/navigation";
import { cache } from "react";
import { verifyToken } from "@/app/components/utilities/signId";
import RandomMediaShell from "./pageClient";
import DetailsPage from "@/app/components/randomMedia/detailsPage";
import CastScroll from "@/app/components/mediaCard/castScroll";
import { Metadata } from "next";
import { tmdbImage } from "@/lib/imageTmdb";

interface PageParams {
  token: string;
}

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

// Single fetch — gets everything
const fetchMediaDetails = cache(async (media_type: string, id: number) => {
  try {
    const res = await fetch(
      `${baseUrl}/api/media/${media_type}/placeholder/${id}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("fetchMediaDetails failed:", err);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { token } = await params;
  const payload = verifyToken(token);
  if (!payload) return { title: "Not Found | WatchedThis" };

  const data = await fetchMediaDetails(payload.media_type, payload.id);
  const title = data?.title || data?.name || "Random Pick";
  const description =
    data?.overview?.substring(0, 160) ?? `Details about ${title}`;

  return {
    title: `${title} | WatchedThis`,
    description,
    openGraph: {
      title,
      description,

      images: data?.poster_path ? [tmdbImage(data.poster_path, "w780")!] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
          <DetailsPage
            data={safeData}
            backdropUrl={safeData.backdrop_path ?? ""}
            isLoading={false}
          />
        </div>

        {safeData?.credits?.cast?.length > 0 && (
          <CastScroll
            cast={safeData.credits.cast}
            mediaType={safeData.media_type}
          />
        )}
      </div>
    </RandomMediaShell>
  );
}
