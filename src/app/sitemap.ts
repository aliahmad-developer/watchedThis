import { MetadataRoute } from "next";
const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = process.env.TMDB_BASE_URL;
const SITE_URL = "https://watchedthis.com";
export const dynamic = 'force-dynamic'  // ← add this line at top
export const revalidate = 0  
// ─── TMDB helpers ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(
    `${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

// Fetch N pages of a discover/trending endpoint
async function fetchAllPages<
  T extends { id: number; title?: string; name?: string },
>(endpoint: string, maxPages = 5): Promise<T[]> {
  const first = await tmdbFetch<{ results: T[]; total_pages: number }>(
    `${endpoint}&page=1`,
  );
  const pages = Math.min(first.total_pages, maxPages);
  if (pages <= 1) return first.results;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      tmdbFetch<{ results: T[] }>(`${endpoint}&page=${i + 2}`)
        .then((d) => d.results)
        .catch(() => [] as T[]),
    ),
  );
  return [...first.results, ...rest.flat()];
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function getMovies() {
  return fetchAllPages<{ id: number; title: string }>(
    "/discover/movie?sort_by=popularity.desc&language=en-US",
  );
}

async function getTvShows() {
  return fetchAllPages<{ id: number; name: string }>(
    "/discover/tv?sort_by=popularity.desc&language=en-US",
  );
}

async function getPopularPersons() {
  return fetchAllPages<{ id: number; name: string }>(
    "/person/popular?language=en-US",
  );
}

async function getPopularCompanies(): Promise<{ id: number; name: string }[]> {
  const movies = await fetchAllPages<{
    id: number;
    production_companies?: { id: number; name: string }[];
  }>(
    "/discover/movie?sort_by=popularity.desc&language=en-US&append_to_response=production_companies",
    3,
  );

  const seen = new Map<number, { id: number; name: string }>();
  for (const movie of movies) {
    for (const company of movie.production_companies ?? []) {
      if (!seen.has(company.id)) seen.set(company.id, company);
    }
  }
  return Array.from(seen.values());
}

async function getGenres() {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch<{ genres: { id: number }[] }>("/genre/movie/list?language=en-US"),
    tmdbFetch<{ genres: { id: number }[] }>("/genre/tv/list?language=en-US"),
  ]);

  const seen = new Set<number>();
  const all: { id: number; mediaType: "movie" | "tv" }[] = [];

  for (const g of movieGenres.genres) {
    seen.add(g.id);
    all.push({ id: g.id, mediaType: "movie" });
  }
  for (const g of tvGenres.genres) {
    if (!seen.has(g.id)) all.push({ id: g.id, mediaType: "tv" });
  }
  return all;
}

// ─── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movies, tvShows, persons, companies, genres] = await Promise.all([
    getMovies().catch(() => []),
    getTvShows().catch(() => []),
    getPopularPersons().catch(() => []),
    getPopularCompanies().catch(() => []),
    getGenres().catch(() => []),
  ]);

  type ChangeFreq =
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily" as ChangeFreq, priority: 1.0 },
    {
      url: `${SITE_URL}/echo`,
      changeFrequency: "daily" as ChangeFreq,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/find`,
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/random`,
      changeFrequency: "daily" as ChangeFreq,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/spinner`,
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/user`,
      changeFrequency: "monthly" as ChangeFreq,
      priority: 0.4,
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
  ].map((r) => ({ ...r, lastModified: new Date() }));

  // ── /app/[media_type]/[media_name_slug]/[id] ──────────────────────────────
  const movieRoutes: MetadataRoute.Sitemap = movies.map(({ id, title }) => ({
  url: `${SITE_URL}/movie/${slugify(title ?? String(id))}/${id}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as ChangeFreq,
  priority: 0.8,
}))

  const tvRoutes: MetadataRoute.Sitemap = tvShows.map(({ id, name }) => ({
    url: `${SITE_URL}/tv/${slugify(name ?? String(id))}/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.8,
  }));

  // ── /person/[name-slug]/[id] 
  const personRoutes: MetadataRoute.Sitemap = persons.map(({ id, name }) => ({
    url: `${SITE_URL}/person/${slugify(name ?? String(id))}/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.6,
  }));

  // ── /production-company/[id]  
  const companyRoutes: MetadataRoute.Sitemap = companies.map(({ id }) => ({
    url: `${SITE_URL}/production-company/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as ChangeFreq,
    priority: 0.5,
  }));

  const genreRoutes: MetadataRoute.Sitemap = genres.map(
    ({ id, mediaType }) => ({
      url: `${SITE_URL}/genre/${id}?media_type=${mediaType}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.5,
    }),
  );

  return [
    ...staticRoutes,
    ...movieRoutes,
    ...tvRoutes,
    ...personRoutes,
    ...companyRoutes,
    ...genreRoutes,
  ];
}
