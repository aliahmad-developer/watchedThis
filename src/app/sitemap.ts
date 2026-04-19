import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

const SITE_URL = "https://watchedthis.com";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily" as ChangeFreq, priority: 1.0 },
  { url: `${SITE_URL}/echo`, changeFrequency: "daily" as ChangeFreq, priority: 0.9 },
  { url: `${SITE_URL}/find`, changeFrequency: "weekly" as ChangeFreq, priority: 0.9 },
  { url: `${SITE_URL}/random`, changeFrequency: "daily" as ChangeFreq, priority: 0.8 },
  { url: `${SITE_URL}/spinner`, changeFrequency: "weekly" as ChangeFreq, priority: 0.7 },
  { url: `${SITE_URL}/user`, changeFrequency: "monthly" as ChangeFreq, priority: 0.4 },
  { url: `${SITE_URL}/about`, changeFrequency: "monthly" as ChangeFreq, priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly" as ChangeFreq, priority: 0.3 },
  { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly" as ChangeFreq, priority: 0.3 },
].map((r) => ({ ...r, lastModified: new Date() }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const snap = await adminDb.collection("appData").doc("sitemapCache").get();

    if (!snap.exists) {
      console.warn("Sitemap cache not built yet — returning static routes only");
      return staticRoutes;
    }

    const data = snap.data() as {
      movies: { id: number; slug: string }[];
      tvShows: { id: number; slug: string }[];
      persons: { id: number; slug: string }[];
      genres: { id: number; mediaType: string }[];
    };

    const movieRoutes: MetadataRoute.Sitemap = (data.movies ?? []).map(({ id, slug }) => ({
      url: `${SITE_URL}/movie/${slug}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.8,
    }));

    const tvRoutes: MetadataRoute.Sitemap = (data.tvShows ?? []).map(({ id, slug }) => ({
      url: `${SITE_URL}/tv/${slug}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.8,
    }));

    const personRoutes: MetadataRoute.Sitemap = (data.persons ?? []).map(({ id, slug }) => ({
      url: `${SITE_URL}/person/${slug}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.6,
    }));

    const genreRoutes: MetadataRoute.Sitemap = (data.genres ?? []).map(({ id, mediaType }) => ({
      url: `${SITE_URL}/genre/${id}?media_type=${mediaType}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.5,
    }));

    return [...staticRoutes, ...movieRoutes, ...tvRoutes, ...personRoutes, ...genreRoutes];
  } catch (error) {
    console.error("Sitemap error:", error);
    return staticRoutes;
  }
}