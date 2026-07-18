import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // Adjust path if needed

export async function GET() {
  try {
    // 1. Await the client creation
    const supabase = await createClient();

    // 2. Now you can safely call .from()
    const { data, error } = await supabase
      .from("daily_media")
      .select("*")
      .order("date", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Failed to fetch daily media from Supabase:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch daily media" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          Vary: "Accept-Encoding",
        },
      }
    );
  } catch (error) {
    console.error("DailyMedia API route error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}