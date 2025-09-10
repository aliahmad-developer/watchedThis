// app/api/company/[id]/route.ts
import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

interface TMDBDiscoverResponse {
  page: number;
  results: any[];
  total_pages: number;
}

interface TMDBCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
  headquarters?: string;
}

async function fetchFromTMDB<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB API key");

  const url = `${TMDB_BASE}${endpoint}${
    endpoint.includes("?") ? "&" : "?"
  }api_key=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// helper to fetch runtime details for each item
async function fetchRuntime(mediaType: string, id: number) {
  try {
    const detail = await fetchFromTMDB<any>(`/${mediaType}/${id}`);
    if (mediaType === "movie") {
      return detail.runtime || null;
    } else if (mediaType === "tv") {
      return detail.episode_run_time?.[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);

  const mediaType = searchParams.get("mediaType") || "movie";
  const page = searchParams.get("page") || "1";

  try {
    const media = await fetchFromTMDB<TMDBDiscoverResponse>(
      `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`
    );

    // fetch runtimes in parallel
    const resultsWithRuntime = await Promise.all(
      media.results.map(async (item) => {
        const runtime = await fetchRuntime(mediaType, item.id);
        return { ...item, runtime };
      })
    );

    if (page === "1") {
      const company = await fetchFromTMDB<TMDBCompany>(`/company/${id}`);
      return NextResponse.json({
        company,
        results: resultsWithRuntime,
        total_pages: media.total_pages,
      });
    } else {
      return NextResponse.json({
        results: resultsWithRuntime,
        total_pages: media.total_pages,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
