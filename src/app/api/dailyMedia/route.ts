import { NextResponse } from "next/server";
import { getOrCreateDailyMedia } from "@/lib/dailyMedia";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const data = await getOrCreateDailyMedia(today);

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch (error) {
    console.error("DailyMedia error:", error);

    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
