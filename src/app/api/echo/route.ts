import { NextRequest, NextResponse } from "next/server";

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

interface TMDBCast { name: string }
interface TMDBCrew { job: string; name: string }

export async function GET(req: NextRequest) {
  if (!KEY) {
    return NextResponse.json({ error: "TMDB_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query    = searchParams.get("query");
  const id       = searchParams.get("id");
  const type     = searchParams.get("type") as "movie" | "tv" | null;
  const trending = searchParams.get("trending");

  try {
    // ── Trending / random mode ────────────────────────────────────────────────
    if (trending) {
      const res = await fetch(`${BASE}/trending/all/week?api_key=${KEY}`);
      const data = await res.json();
      const items = (data.results as TMDBItem[] ?? [])
        .filter(i => i.media_type === "movie" || i.media_type === "tv")
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(item => ({
          id:       item.id,
          title:    item.title ?? item.name ?? "",
          type:     (item.media_type ?? "movie") as "movie" | "tv",
          year:     (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
          poster:   item.poster_path ?? null,
          backdrop: item.backdrop_path ?? null,
          vote:     item.vote_average ?? 0,
          overview: item.overview ?? "",
          genre_ids: item.genre_ids ?? [],
        }));
      return NextResponse.json({ results: items });
    }

    // ── Search mode ──────────────────────────────────────────────────────────
    if (query && !id) {
      const [mRes, tRes] = await Promise.all([
        fetch(`${BASE}/search/movie?api_key=${KEY}&query=${encodeURIComponent(query)}&page=1`),
        fetch(`${BASE}/search/tv?api_key=${KEY}&query=${encodeURIComponent(query)}&page=1`),
      ]);
      const [mData, tData] = await Promise.all([mRes.json(), tRes.json()]);

      const movies = (mData.results as TMDBItem[] ?? []).slice(0, 5).map(m => ({
        id:     m.id,
        title:  m.title ?? m.name ?? "",
        type:   "movie" as const,
        year:   (m.release_date ?? "").slice(0, 4),
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : null,
        vote:   m.vote_average ?? 0,
      }));

      const shows = (tData.results as TMDBItem[] ?? []).slice(0, 5).map(t => ({
        id:     t.id,
        title:  t.name ?? t.title ?? "",
        type:   "tv" as const,
        year:   (t.first_air_date ?? "").slice(0, 4),
        poster: t.poster_path ? `https://image.tmdb.org/t/p/w92${t.poster_path}` : null,
        vote:   t.vote_average ?? 0,
      }));

      const results = [...movies, ...shows]
        .sort((a, b) => b.vote - a.vote)
        .slice(0, 8);

      return NextResponse.json({ results });
    }

    // ── Similar mode ─────────────────────────────────────────────────────────
    if (id && type) {
      const [detRes, simRes, credRes] = await Promise.all([
        fetch(`${BASE}/${type}/${id}?api_key=${KEY}`),
        fetch(`${BASE}/${type}/${id}/similar?api_key=${KEY}&page=1`),
        fetch(`${BASE}/${type}/${id}/credits?api_key=${KEY}`),
      ]);
      const [det, sim, cred] = await Promise.all([
        detRes.json(),
        simRes.json(),
        credRes.json(),
      ]);

      const cast: string[] = (cred.cast ?? []).slice(0, 5).map((c: TMDBCast) => c.name);
      const director: string | null =
        type === "movie"
          ? ((cred.crew ?? []) as TMDBCrew[]).find(c => c.job === "Director")?.name ?? null
          : null;

      const source = {
        id:       det.id,
        title:    det.title ?? det.name ?? "",
        type,
        year:     (det.release_date ?? det.first_air_date ?? "").slice(0, 4),
        poster:   det.poster_path ?? null,
        backdrop: det.backdrop_path ?? null,
        overview: det.overview ?? "",
        genres:   (det.genres ?? []).map((g: { name: string }) => g.name) as string[],
        vote:     det.vote_average ?? 0,
        runtime:  det.runtime ?? det.episode_run_time?.[0] ?? null,
        cast,
        director,
      };

      const similar = (sim.results as TMDBItem[] ?? []).slice(0, 12).map(item => ({
        id:        item.id,
        title:     item.title ?? item.name ?? "",
        type,
        year:      (item.release_date ?? item.first_air_date ?? "").slice(0, 4),
        poster:    item.poster_path ?? null,
        backdrop:  item.backdrop_path ?? null,
        vote:      item.vote_average ?? 0,
        overview:  item.overview ?? "",
        genre_ids: item.genre_ids ?? [],
      }));

      return NextResponse.json({ source, similar });
    }

    return NextResponse.json({ error: "Provide query or id+type" }, { status: 400 });
  } catch (err) {
    console.error("[/api/echo]", err);
    return NextResponse.json({ error: "TMDB request failed" }, { status: 500 });
  }
}