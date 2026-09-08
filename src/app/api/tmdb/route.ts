import { NextRequest, NextResponse } from "next/server";
import { fetchTmdbCached } from "@/lib/TmdbCatched";

const ALLOWED_PATHS = [
  "/movie/",
  "/tv/",
  "/find/",
  "/search/",
  "/discover/",
  "/trending/",
  "/genre/",
  "/person/",
];

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const params = req.nextUrl.searchParams.get("params") ?? "";

  if (!path) {
    return NextResponse.json({ error: "Missing path param" }, { status: 400 });
  }

  if (!ALLOWED_PATHS.some((allowed) => path.startsWith(allowed))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  let extraParams: Record<string, string> = {};
  if (params) {
    try {
      extraParams = JSON.parse(params);
    } catch {
      return NextResponse.json(
        { error: "Invalid params JSON" },
        { status: 400 },
      );
    }
  }

  const data = await fetchTmdbCached(path, extraParams);

  if (data === null) {
    return NextResponse.json(
      { message: "Error fetching from TMDB" },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}