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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);

  const mediaType = searchParams.get("mediaType") || "movie";
  const page = searchParams.get("page") || "1";

  try {
    if (page === "1") {
      // First page → also fetch company info
      const company = await fetchFromTMDB<TMDBCompany>(`/company/${id}`);

      const media = await fetchFromTMDB<TMDBDiscoverResponse>(
        `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`
      );

      return NextResponse.json({
        company,
        results: media.results,
        total_pages: media.total_pages,
      });
    } else {
      // Only media for subsequent pages
      const media = await fetchFromTMDB<TMDBDiscoverResponse>(
        `/discover/${mediaType}?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=${page}`
      );
      return NextResponse.json({
        results: media.results,
        total_pages: media.total_pages,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
