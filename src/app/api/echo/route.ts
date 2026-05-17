import { NextRequest, NextResponse } from "next/server";
import { tmdbImage } from "@/lib/imageTmdb";

const BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

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

export async function GET(req: NextRequest) {
  if (!KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not set" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "movie" | "tv" | null;
  const trending = searchParams.get("trending");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  try {
    // ── Trending ──────────────────────────────────────────────────────────────
    if (trending) {
      const res = await fetch(
        `${BASE}/trending/all/week?api_key=${KEY}&page=${page}`,
      );
      const data = await res.json();

      const all = ((data.results as TMDBItem[]) ?? []).filter(
        (i) => i.media_type === "movie" || i.media_type === "tv",
      );

      const PAGE_SIZE = 5;
      const slice = all.slice(0, PAGE_SIZE).map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? "",
        type: (item.media_type ?? "movie") as "movie" | "tv",
        year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
        poster: item.poster_path ?? null, // raw path — client uses tmdbImage()
        backdrop: item.backdrop_path ?? null, // raw path — client uses tmdbImage()
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
      const [mRes, tRes] = await Promise.all([
        fetch(
          `${BASE}/search/movie?api_key=${KEY}&query=${encodeURIComponent(query)}&page=1`,
        ),
        fetch(
          `${BASE}/search/tv?api_key=${KEY}&query=${encodeURIComponent(query)}&page=1`,
        ),
      ]);
      const [mData, tData] = await Promise.all([mRes.json(), tRes.json()]);

      const movies = ((mData.results as TMDBItem[]) ?? [])
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          title: m.title ?? m.name ?? "",
          type: "movie" as const,
          year: (m.release_date ?? "").slice(0, 4),
          // pass through image-proxy route (client expects tmdbImage-style behavior)
          poster: m.poster_path
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://watchedthis.com"}/api/image-proxy?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w92${m.poster_path}`)}`
            : null,

          vote: m.vote_average ?? 0,
        }));

      const shows = ((tData.results as TMDBItem[]) ?? [])
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          title: t.name ?? t.title ?? "",
          type: "tv" as const,
          year: (t.first_air_date ?? "").slice(0, 4),
          poster: t.poster_path
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://watchedthis.com"}/api/image-proxy?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w92${t.poster_path}`)}`
            : null,
          vote: t.vote_average ?? 0,
        }));

      const results = [...movies, ...shows]
        .sort((a, b) => b.vote - a.vote)
        .slice(0, 8);

      return NextResponse.json({ results });
    }

    // ── Similar ───────────────────────────────────────────────────────────────
    if (id && type) {
      const [detRes, simRes, credRes] = await Promise.all([
        fetch(`${BASE}/${type}/${id}?api_key=${KEY}`),
        fetch(`${BASE}/${type}/${id}/similar?api_key=${KEY}&page=${page}`),
        fetch(`${BASE}/${type}/${id}/credits?api_key=${KEY}`),
      ]);
      const [det, sim, cred] = await Promise.all([
        detRes.json(),
        simRes.json(),
        credRes.json(),
      ]);

      const cast: string[] = (cred.cast ?? [])
        .slice(0, 5)
        .map((c: TMDBCast) => c.name);
      const director: string | null =
        type === "movie"
          ? (((cred.crew ?? []) as TMDBCrew[]).find((c) => c.job === "Director")
              ?.name ?? null)
          : null;

      const source =
        page === 1
          ? {
              id: det.id,
              title: det.title ?? det.name ?? "",
              type,
              year: (det.release_date ?? det.first_air_date ?? "").slice(0, 4),
              poster: det.poster_path ?? null, // raw path — used by OG route directly
              backdrop: det.backdrop_path ?? null, // raw path — used by OG route directly
              overview: det.overview ?? "",
              genres: (det.genres ?? []).map(
                (g: { name: string }) => g.name,
              ) as string[],
              vote: det.vote_average ?? 0,
              runtime: det.runtime ?? det.episode_run_time?.[0] ?? null,
              cast,
              director,
            }
          : undefined;

      const similar = ((sim.results as TMDBItem[]) ?? []).map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? "",
        type,
        year: (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
        poster: item.poster_path ?? null, // raw path — client uses tmdbImage()
        backdrop: item.backdrop_path ?? null, // raw path — client uses tmdbImage()
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
