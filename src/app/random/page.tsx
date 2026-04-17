import { redirect } from "next/navigation";
import { Metadata } from "next";

async function fetchRandomMedia(
  attempt = 1,
): Promise<{ id: number; media_type: string; title: string } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}`
    : "http://localhost:3000";

  const entropy = Math.random().toString(36).slice(2, 8);

  try {
    const res = await fetch(`${baseUrl}/api/randomCall?t=${entropy}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`Random API failed (attempt ${attempt}): ${res.status}`);
      return null;
    }

    const json = await res.json();
    const data = Array.isArray(json) ? json[0] : json;

    if (
      !data?.id ||
      typeof data.id !== "number" ||
      !data.media_type ||
      (!data.title && !data.name)
    ) {
      console.error(`Invalid random data (attempt ${attempt}):`, data);
      return null;
    }

    return {
      id: data.id,
      media_type: data.media_type,
      title: data.title || data.name || "random-pick",
    };
  } catch (error) {
    console.error(`Random fetch error (attempt ${attempt}):`, error);
    return null;
  }
}

function safeSlug(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100) || "random-pick";
}

async function fetchMediaDetails(
  baseUrl: string,
  media_type: string,
  slug: string,
  id: string,
) {
  try {
    const res = await fetch(
      `${baseUrl}/api/media/${media_type}/${slug}/${id}`,
      {
        next: { revalidate: 3600 },
      },
    );
    if (res.ok) {
      const data = await res.json();
      // Serialize safely - base64 JSON without functions
      const serializable = JSON.stringify(data, (k, v) =>
        typeof v === "function" ? undefined : v,
      );
      return btoa(serializable);
    }
  } catch {}
  return null;
}

const FALLBACK_MEDIA = {
  id: 1193,
  media_type: "movie",
  title: "shawshank-redemption",
};

export const metadata: Metadata = {
  title: "Random Pick",
  description: "Getting you a random movie or TV show to watch right now.",
  robots: { index: false },
  alternates: { canonical: "/random" },
};

export default async function RandomPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  for (let attempt = 1; attempt <= 3; attempt++) {
    const basicData = await fetchRandomMedia(attempt);
    if (basicData) {
      const detailsB64 = await fetchMediaDetails(
        baseUrl,
        basicData.media_type,
        safeSlug(basicData.title),
        basicData.id.toString(),
      );

      const url = `/random/${basicData.media_type}/${safeSlug(basicData.title)}/${basicData.id}${detailsB64 ? `?prefetch=${detailsB64}` : ""}`;
      redirect(url);
    }

    if (attempt === 3) {
      const detailsB64 = await fetchMediaDetails(
        baseUrl,
        FALLBACK_MEDIA.media_type,
        safeSlug(FALLBACK_MEDIA.title),
        FALLBACK_MEDIA.id.toString(),
      );

      const url = `/random/${FALLBACK_MEDIA.media_type}/${safeSlug(FALLBACK_MEDIA.title)}/${FALLBACK_MEDIA.id}${detailsB64 ? `?prefetch=${detailsB64}` : ""}`;
      redirect(url);
    }
  }
}
