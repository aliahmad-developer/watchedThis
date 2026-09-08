import { NextResponse } from "next/server";
import { fetchProductionCompanyData } from "@/lib/productionCompany";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const mediaType = searchParams.get("mediaType") ?? "movie";
  const page = searchParams.get("page") ?? "1";

  try {
    const result = await fetchProductionCompanyData(id, mediaType, page);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
