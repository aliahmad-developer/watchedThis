// app/api/sceneDetection/route.ts
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

const HF_URL = "https://missypenguin-movie-scene-detector.hf.space/predict";
const TMDB_BASE = "https://api.themoviedb.org/3";

function cleanTitle(title: string): string {
  return title.replace(/\s*\(\d{4}\)\s*$/, "").trim();
}

async function fetchWithWakeup(formData: FormData): Promise<Response> {
  const attempt = await fetch(HF_URL, { method: "POST", body: formData });
  const contentType = attempt.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    await new Promise((r) => setTimeout(r, 8000));
    return fetch(HF_URL, { method: "POST", body: formData });
  }
  return attempt;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    let response: Response;
    try {
      response = await fetchWithWakeup(formData);
    } catch {
      return NextResponse.json(
        { error: "Could not reach the model server. It may be starting up — please try again in 30 seconds." },
        { status: 503 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Model server is waking up. Please try again in 30 seconds." },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "Model inference failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const key = process.env.TMDB_API_KEY;

    const enriched = await Promise.all(
      data.movies.map(async (item: { title: string; votes: number }) => {
        const cleanedTitle = cleanTitle(item.title);

        try {
          // 1. Search for movie
          const searchRes = await fetch(
            `${TMDB_BASE}/search/movie?query=${encodeURIComponent(cleanedTitle)}&api_key=${key}`
          );
          const searchData = await searchRes.json();
          const match = searchData.results?.[0];
          if (!match) throw new Error("no match");

          // 2. Fetch genres + keywords in parallel
          const [detailRes, kwRes] = await Promise.all([
            fetch(`${TMDB_BASE}/movie/${match.id}?api_key=${key}`),
            fetch(`${TMDB_BASE}/movie/${match.id}/keywords?api_key=${key}`),
          ]);
          const detail = await detailRes.json();
          const kwData = await kwRes.json();

          const genres: string[] = (detail.genres ?? []).map((g: { name: string }) => g.name);
          const keywords: string[] = (kwData.keywords ?? [])
            .slice(0, 5)
            .map((k: { name: string }) => k.name);

          return {
            id: match.id,
            title: match.title,
            poster_path: match.poster_path,
            backdrop_path: match.backdrop_path ?? null,
            release_date: match.release_date,
            overview: match.overview,
            vote_average: match.vote_average,
            genres,
            keywords,
            votes: item.votes,
          };
        } catch {
          return { title: cleanedTitle, votes: item.votes, poster_path: null, backdrop_path: null, genres: [], keywords: [] };
        }
      })
    );

    return NextResponse.json({ movies: enriched });
  } catch (err: any) {
    console.error("sceneDetection route error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}