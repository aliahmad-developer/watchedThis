import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROW_ID = "singleton";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_media")
      .select("items")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch daily media from Supabase:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch daily media" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: data?.items ?? [] },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch (error) {
    console.error("DailyMedia API route error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
