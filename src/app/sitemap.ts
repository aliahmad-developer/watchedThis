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

// Updated to reflect actual last significant content change
const STATIC_LAST_MODIFIED = new Date("2026-05-13");

// Only include pages that are truly indexable by Google
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    changeFrequency: "daily" as ChangeFreq,
    priority: 1.0,
  },
  {
    // Movie listing/browse page — high value for SEO
    url: `${SITE_URL}/movie`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.9,
  },
  {
    // TV listing/browse page — high value for SEO
    url: `${SITE_URL}/tv`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.9,
  },
  {
    // Discovery/search page — users land here from search engines
    url: `${SITE_URL}/find`,
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.8,
  },
  {
    // "Movies like X" — high-value long-tail SEO, keep indexed
    url: `${SITE_URL}/echo`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.9,
  },
  {
    // "Random movie to watch" — real search intent, worth indexing
    url: `${SITE_URL}/random`,
    changeFrequency: "daily" as ChangeFreq,
    priority: 0.7,
  },
  {
    // Customizable watch spinner — niche but unique, "what should I watch tonight"
    url: `${SITE_URL}/spinner`,
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/about`,
    changeFrequency: "monthly" as ChangeFreq,
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/privacy-policy`,
    changeFrequency: "yearly" as ChangeFreq,
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms-and-conditions`,
    changeFrequency: "yearly" as ChangeFreq,
    priority: 0.3,
  },
  // Removed: /user    — base route is not a real indexable page
  // Removed: /random  — interactive tool, same content every load, no SEO value
  // Removed: /spinner — interactive tool, no unique indexable content
].map((r) => ({ ...r, lastModified: STATIC_LAST_MODIFIED }));

type SitemapEntry = {
  id: number;
  slug: string;
  updatedAt?: string;
  posterPath?: string; // Optional: used for image sitemap entries
  title?: string; // Optional: used for image sitemap alt text
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

/**
 * Splits a flat array into chunks for sitemap index support.
 * Useful when you exceed 50,000 URLs per sitemap file.
 */
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

    // Warn early if approaching the 50,000 URL limit per sitemap file.
    // If you exceed this, migrate to generateSitemaps() with a sitemap index:
    // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps
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
