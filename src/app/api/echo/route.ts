import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";
import { fetchSimilarMedia } from "@/lib/similarMedia";

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
  media_type?: string;
}

interface TMDBPagedResponse {
  results: TMDBItem[];
  total_pages?: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "movie" | "tv" | null;
  const trending = searchParams.get("trending");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  try {
    // ── Trending ──────────────────────────────────────────────────────────────
    if (trending) {
      const data = await tmdbFetch<TMDBPagedResponse>(
        `/trending/all/week?page=${page}`,
      );

      const all = (data.results ?? []).filter(
        (i) => i.media_type === "movie" || i.media_type === "tv",
      );

      const PAGE_SIZE = 15;
      const slice = all.slice(0, PAGE_SIZE).map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? "",
        type: (item.media_type ?? "movie") as "movie" | "tv",
        year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
        poster: item.poster_path ?? null,
        backdrop: item.backdrop_path ?? null,
        vote: item.vote_average ?? 0,
        overview: item.overview ?? "",
        genre_ids: item.genre_ids ?? [],
      }));

      return NextResponse.json({
        results: slice,
        has_more: page < (data.total_pages ?? 1),
        page,
        total_pages: data.total_pages ?? 1,
      });
    }

    // ── Search ────────────────────────────────────────────────────────────────
    if (query && !id) {
      const encoded = encodeURIComponent(query);

      const [mData, tData] = await Promise.all([
        tmdbFetch<TMDBPagedResponse>(`/search/movie?query=${encoded}&page=1`),
        tmdbFetch<TMDBPagedResponse>(`/search/tv?query=${encoded}&page=1`),
      ]);

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://watchedthis.com";

      const proxyPoster = (path: string) =>
        `${appUrl}/api/image-proxy/?url=${encodeURIComponent(
          `https://image.tmdb.org/t/p/w92${path}`,
        )}`;

      const movies = (mData.results ?? []).slice(0, 5).map((m) => ({
        id: m.id,
        title: m.title ?? m.name ?? "",
        type: "movie" as const,
        year: (m.release_date ?? "").slice(0, 4),
        poster: m.poster_path ? proxyPoster(m.poster_path) : null,
        vote: m.vote_average ?? 0,
      }));

      const shows = (tData.results ?? []).slice(0, 5).map((t) => ({
        id: t.id,
        title: t.name ?? t.title ?? "",
        type: "tv" as const,
        year: (t.first_air_date ?? "").slice(0, 4),
        poster: t.poster_path ? proxyPoster(t.poster_path) : null,
        vote: t.vote_average ?? 0,
      }));

      const results = [...movies, ...shows]
        .sort((a, b) => b.vote - a.vote)
        .slice(0, 8);

      return NextResponse.json({ results });
    }

    // ── Similar ───────────────────────────────────────────────────────────────
    if (id && type) {
      const result = await fetchSimilarMedia(id, type, page);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Provide query or id+type" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[/api/echo]", err);
    return NextResponse.json({ error: "TMDB request failed" }, { status: 500 });
  }
}
