import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdbRequest";

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

interface TMDBCast {
  name: string;
}
interface TMDBCrew {
  job: string;
  name: string;
}

interface TMDBPagedResponse {
  results: TMDBItem[];
  total_pages?: number;
}

interface TMDBDetailResponse {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  overview?: string;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  episode_run_time?: number[];
}

interface TMDBCreditsResponse {
  cast?: TMDBCast[];
  crew?: TMDBCrew[];
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
      // Fetch detail + credits in parallel
      const [det, cred] = await Promise.all([
        tmdbFetch<TMDBDetailResponse>(`/${type}/${id}`),
        tmdbFetch<TMDBCreditsResponse>(`/${type}/${id}/credits`),
      ]);

      const recData = await tmdbFetch<TMDBPagedResponse>(
        `/${type}/${id}/recommendations?page=${page}`,
      );

      const hasRecommendations = (recData.results ?? []).length > 0;
      let sim: TMDBPagedResponse;

      if (hasRecommendations) {
        sim = recData;
      } else {
        const genreIds = (det.genres ?? []).map((g) => g.id).join(",");
        const discoverEndpoint = genreIds
          ? `/discover/${type}?with_genres=${genreIds}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`
          : `/discover/${type}?sort_by=vote_average.desc&vote_count.gte=100&page=${page}`;

        sim = await tmdbFetch<TMDBPagedResponse>(discoverEndpoint);
      }

      const cast: string[] = (cred.cast ?? []).slice(0, 5).map((c) => c.name);
      const director: string | null =
        type === "movie"
          ? ((cred.crew ?? []).find((c) => c.job === "Director")?.name ?? null)
          : null;

      const source =
        page === 1
          ? {
              id: det.id,
              title: det.title ?? det.name ?? "",
              type,
              year: (det.release_date ?? det.first_air_date ?? "").slice(0, 4),
              poster: det.poster_path ?? null,
              backdrop: det.backdrop_path ?? null,
              overview: det.overview ?? "",
              genres: (det.genres ?? []).map((g) => g.name) as string[],
              vote: det.vote_average ?? 0,
              runtime: det.runtime ?? det.episode_run_time?.[0] ?? null,
              cast,
              director,
            }
          : undefined;

      const similar = (sim.results ?? [])
        .filter((item) => item.id !== det.id)
        .map((item) => ({
          id: item.id,
          title: item.title ?? item.name ?? "",
          type,
          year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
          poster: item.poster_path ?? null,
          backdrop: item.backdrop_path ?? null,
          vote: item.vote_average ?? 0,
          overview: item.overview ?? "",
          genre_ids: item.genre_ids ?? [],
        }));

      return NextResponse.json({
        source,
        similar,
        has_more: page < (sim.total_pages ?? 1),
        page,
        total_pages: sim.total_pages ?? 1,
      });
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
