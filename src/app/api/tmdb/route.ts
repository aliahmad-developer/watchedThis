import { NextRequest, NextResponse } from "next/server";

const TMDB_KEY = process.env.TMDB_API_KEY ?? "";
const TMDB = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const path   = req.nextUrl.searchParams.get("path") ?? "";
  const params = req.nextUrl.searchParams.get("params") ?? "";

  const url = new URL(`${TMDB}${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  if (params) {
    Object.entries(JSON.parse(params)).forEach(([k, v]) =>
      url.searchParams.set(k, v as string)
    );
  }

  const res  = await fetch(url.toString());
  const data = await res.json();
  return NextResponse.json(data);
}