import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomMedia, type MediaItem } from "@/lib/randomMedia";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // 1. Check if we already have data for today
    const { data: existing, error } = await supabase
      .from("daily_media")
      .select("*")
      .eq("date", today)
      .maybeSingle();

    if (error) throw error;

    let finalItems: MediaItem[] = [];

    if (existing && (existing.items as MediaItem[])?.length >= 3) {
      // Case 1: Already have 3 items for today — do nothing
      finalItems = existing.items as MediaItem[];
    } else if (existing && (existing.items as MediaItem[])?.length < 3) {
      // Case 2: Today has < 3 items — fill up to 3
      const items = existing.items as MediaItem[];
      const seenIds = new Set(items.map((i) => i.id)); // ✅ TypeScript now knows i.id is a number
      const needed = 3 - items.length;
      const newItems = await getRandomMedia(seenIds, needed);
      finalItems = [...newItems, ...items].slice(0, 3);

      await supabase
        .from("daily_media")
        .update({ items: finalItems, updated_at: new Date().toISOString() })
        .eq("date", today);
    } else {
      // Case 3 & 4: New day (or first ever run) — carry over 2 newest from yesterday, fetch 1 new
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      const { data: yesterdayData } = await supabase
        .from("daily_media")
        .select("*")
        .eq("date", yesterday)
        .maybeSingle();

      const yItems = (yesterdayData?.items as MediaItem[]) ?? [];
      const carryover = yItems.slice(0, 2);
      const seenIds = new Set(yItems.map((i) => i.id)); // ✅ TypeScript now knows i.id is a number

      const newItems = await getRandomMedia(seenIds, 1);
      finalItems = [...newItems, ...carryover].slice(0, 3);

      await supabase
        .from("daily_media")
        .upsert(
          {
            date: today,
            items: finalItems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "date" },
        );
    }

    return NextResponse.json({ ok: true, count: finalItems.length });
  } catch (error) {
    console.error("Daily media cron error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}