import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

const SITE_URL = "https://watchedthis.com";

export const revalidate = 86400;

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

const STATIC_LAST_MODIFIED = new Date("2026-05-13");

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    changeFrequency: "daily" as ChangeFreq,
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/movie`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/tv`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/find`,
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/echo`,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/genre`,
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/production`,
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/random`,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/spinner`,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/about`,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/privacy`,
    changeFrequency: "yearly" as ChangeFreq,
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms`,
    changeFrequency: "yearly" as ChangeFreq,
    priority: 0.3,
  },
  // Excluded:
  // /auth, /auth/confirmed, /reset-password  — auth flows, no SEO value
  // /user, /user/library, /user/profile      — personal/gated pages
  // /sceneDetect                             — tool page, no unique indexable content
  // /search, /find/results                  — query-driven, Google skips param URLs
].map((r) => ({ ...r, lastModified: STATIC_LAST_MODIFIED }));

type SitemapEntry = {
  id: number;
  slug: string;
  updatedAt?: string;
  posterPath?: string;
  title?: string;
};

type SitemapCache = {
  movies: SitemapEntry[];
  tvShows: SitemapEntry[];
  persons: { id: number; slug: string }[];
  genres: { slug: string }[];
};

/**
 * Safely constructs a Date from a string.
 * Falls back to STATIC_LAST_MODIFIED if the string is missing or invalid.
 */
function safeDate(updatedAt?: string): Date {
  if (!updatedAt) return STATIC_LAST_MODIFIED;
  const d = new Date(updatedAt);
  return isNaN(d.getTime()) ? STATIC_LAST_MODIFIED : d;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const snap = await adminDb.collection("appData").doc("sitemapCache").get();

    if (!snap.exists) {
      console.warn(
        "Sitemap cache not built yet — returning static routes only",
      );
      return staticRoutes;
    }

    const data = snap.data() as SitemapCache;

    // Movie routes — weekly changeFreq since ratings/reviews update regularly
    const movieRoutes: MetadataRoute.Sitemap = (data.movies ?? []).map(
      ({ id, slug, updatedAt }) => ({
        url: `${SITE_URL}/movie/${slug}/${id}`,
        lastModified: safeDate(updatedAt),
        changeFrequency: "weekly" as ChangeFreq,
        priority: 0.8,
      }),
    );

    // TV show routes — weekly changeFreq for same reason
    const tvRoutes: MetadataRoute.Sitemap = (data.tvShows ?? []).map(
      ({ id, slug, updatedAt }) => ({
        url: `${SITE_URL}/tv/${slug}/${id}`,
        lastModified: safeDate(updatedAt),
        changeFrequency: "weekly" as ChangeFreq,
        priority: 0.8,
      }),
    );

    // Person routes — monthly; cast/crew info rarely changes
    const personRoutes: MetadataRoute.Sitemap = (data.persons ?? []).map(
      ({ id, slug }) => ({
        url: `${SITE_URL}/person/${slug}/${id}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as ChangeFreq,
        priority: 0.6,
      }),
    );

    // Genre routes — clean URLs, no query params (Google skips those in sitemaps)
    const genreRoutes: MetadataRoute.Sitemap = (data.genres ?? []).map(
      ({ slug }) => ({
        url: `${SITE_URL}/genre/${slug}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "weekly" as ChangeFreq,
        priority: 0.7,
      }),
    );

    const allRoutes = [
      ...staticRoutes,
      ...movieRoutes,
      ...tvRoutes,
      ...personRoutes,
      ...genreRoutes,
    ];

    if (allRoutes.length > 45000) {
      console.warn(
        `Sitemap is approaching the 50,000 URL limit (${allRoutes.length} URLs). ` +
          "Consider splitting into multiple sitemaps using generateSitemaps().",
      );
    }

    return allRoutes;
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return staticRoutes;
  }
}
