// app/api/company/[id]/route.ts
import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

// TMDB types
interface TMDBDiscoverResponse {
  page: number;
  results: any[]; // you can replace `any` with a proper TMDB media type if you want
  total_pages: number;
  total_results: number;
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

  if (!res.ok) {
    throw new Error(
      `TMDB request failed for ${endpoint}: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const [company, movies, tv] = await Promise.all([
      fetchFromTMDB<TMDBCompany>(`/company/${id}`),
      fetchFromTMDB<TMDBDiscoverResponse>(
        `/discover/movie?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=1`
      ).catch(
        () =>
          ({
            page: 1,
            total_pages: 0,
            total_results: 0,
            results: [],
          } as TMDBDiscoverResponse)
      ),
      fetchFromTMDB<TMDBDiscoverResponse>(
        `/discover/tv?with_companies=${id}&sort_by=popularity.desc&language=en-US&page=1`
      ).catch(
        () =>
          ({
            page: 1,
            total_pages: 0,
            total_results: 0,
            results: [],
          } as TMDBDiscoverResponse)
      ),
    ]);

    return NextResponse.json({
      company,
      movies: movies.results || [],
      tv: tv.results || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
