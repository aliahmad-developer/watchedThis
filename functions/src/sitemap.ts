import { getFirestore } from "firebase-admin/firestore";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const COLLECTION = "appData";
const DOC = "sitemapCache";

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE_URL}${endpoint}${sep}api_key=${API_KEY}`);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

async function fetchAllPages<T extends { id: number; title?: string; name?: string }>(
  endpoint: string,
  maxPages = 5,
): Promise<T[]> {
  const first = await tmdbFetch<{ results: T[]; total_pages: number }>(`${endpoint}&page=1`);
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

export async function generateSitemap() {
  const db = getFirestore();

  const [movies, tvShows, persons, genres] = await Promise.all([
    fetchAllPages<{ id: number; title: string }>(
      "/discover/movie?sort_by=popularity.desc&language=en-US", 5
    ).catch(() => []),
    fetchAllPages<{ id: number; name: string }>(
      "/discover/tv?sort_by=popularity.desc&language=en-US", 5
    ).catch(() => []),
    fetchAllPages<{ id: number; name: string }>(
      "/person/popular?language=en-US", 5
    ).catch(() => []),
    Promise.all([
      tmdbFetch<{ genres: { id: number }[] }>("/genre/movie/list?language=en-US"),
      tmdbFetch<{ genres: { id: number }[] }>("/genre/tv/list?language=en-US"),
    ]).then(([m, t]) => ({ movie: m.genres, tv: t.genres })).catch(() => ({ movie: [], tv: [] })),
  ]);

  const sitemapData = {
    movies: movies.map(({ id, title }) => ({ id, slug: slugify(title ?? String(id)) })),
    tvShows: tvShows.map(({ id, name }) => ({ id, slug: slugify(name ?? String(id)) })),
    persons: persons.map(({ id, name }) => ({ id, slug: slugify(name ?? String(id)) })),
    genres: [
      ...genres.movie.map((g) => ({ id: g.id, mediaType: "movie" })),
      ...genres.tv.map((g) => ({ id: g.id, mediaType: "tv" })),
    ],
    generatedAt: new Date().toISOString(),
  };

  await db.collection(COLLECTION).doc(DOC).set(sitemapData);
  console.log(`Sitemap cached: ${movies.length} movies, ${tvShows.length} tv, ${persons.length} persons`);
}