import { NextRequest, NextResponse } from "next/server";
import { fetchGenreMedia, parseGenreIds } from "@/lib/genreMedia";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await context.params;
    const mediaType = (req.nextUrl.searchParams.get("media_type") ?? "") as
      | "movie"
      | "tv";
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
    const strict = ["true", "1", "yes"].includes(
      (req.nextUrl.searchParams.get("strict") ?? "false").toLowerCase(),
    );

    const ids = parseGenreIds(idParam);
    if (!mediaType || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid media type or genre IDs" },
        { status: 400 },
      );
    }

    const result = await fetchGenreMedia(mediaType, ids, page, strict);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Genre API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre content" },
      { status: 500 },
    );
  }
}
