"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmdbApiKey = void 0;
exports.generateSitemap = generateSitemap;
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
const tmdbApiKey = (0, params_1.defineSecret)("TMDB_API_KEY");
exports.tmdbApiKey = tmdbApiKey;
const BASE_URL = "https://api.themoviedb.org/3";
const COLLECTION = "appData";
const DOC = "sitemapCache";
function slugify(text) {
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
async function tmdbFetch(endpoint, apiKey) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE_URL}${endpoint}${sep}api_key=${apiKey}`);
    if (!res.ok)
        throw new Error(`TMDB error: ${res.status}`);
    return res.json();
}
async function fetchAllPages(endpoint, apiKey, maxPages = 5) {
    const first = await tmdbFetch(`${endpoint}&page=1`, apiKey);
    const pages = Math.min(first.total_pages, maxPages);
    if (pages <= 1)
        return first.results;
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => tmdbFetch(`${endpoint}&page=${i + 2}`, apiKey)
        .then((d) => d.results)
        .catch(() => [])));
    return [...first.results, ...rest.flat()];
}
async function generateSitemap() {
    const API_KEY = tmdbApiKey.value(); // ← called inside function, not at module level
    const db = (0, firestore_1.getFirestore)();
    const [movies, tvShows, persons, genres] = await Promise.all([
        fetchAllPages("/discover/movie?sort_by=popularity.desc&language=en-US", API_KEY, 5).catch(() => []),
        fetchAllPages("/discover/tv?sort_by=popularity.desc&language=en-US", API_KEY, 5).catch(() => []),
        fetchAllPages("/person/popular?language=en-US", API_KEY, 5).catch(() => []),
        Promise.all([
            tmdbFetch("/genre/movie/list?language=en-US", API_KEY),
            tmdbFetch("/genre/tv/list?language=en-US", API_KEY),
        ]).then(([m, t]) => ({ movie: m.genres, tv: t.genres })).catch(() => ({ movie: [], tv: [] })),
    ]);
    const sitemapData = {
        movies: movies.map(({ id, title }) => ({ id, slug: slugify(title !== null && title !== void 0 ? title : String(id)), poster_path: '/tmdb/movie/' + id + '/w780.jpg' })),
        tvShows: tvShows.map(({ id, name }) => ({ id, slug: slugify(name !== null && name !== void 0 ? name : String(id)), poster_path: '/tmdb/tv/' + id + '/w780.jpg' })),
        persons: persons.map(({ id, name }) => ({ id, slug: slugify(name !== null && name !== void 0 ? name : String(id)) })),
        genres: [
            ...genres.movie.map((g) => ({ id: g.id, mediaType: "movie" })),
            ...genres.tv.map((g) => ({ id: g.id, mediaType: "tv" })),
        ],
        generatedAt: new Date().toISOString(),
    };
    await db.collection(COLLECTION).doc(DOC).set(sitemapData);
    console.log(`Sitemap cached: ${movies.length} movies, ${tvShows.length} tv, ${persons.length} persons`);
}
//# sourceMappingURL=sitemap.js.map