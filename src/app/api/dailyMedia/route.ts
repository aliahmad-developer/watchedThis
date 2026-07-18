import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomMedia, type MediaItem } from "@/lib/randomMedia";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🚀 [CRON] Starting daily media generation...");
    const supabase = await createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    console.log("📅 [CRON] Today's date:", today);

    const { data: existing, error: fetchError } = await supabase
      .from("daily_media")
      .select("*")
      .eq("date", today)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ [CRON] Fetch error:", fetchError);
      throw fetchError;
    }

    let finalItems: MediaItem[] = [];

    if (existing && (existing.items as MediaItem[])?.length >= 3) {
      console.log("✅ [CRON] Case 1: Already have 3 items. Doing nothing.");
      finalItems = existing.items as MediaItem[];
    } else if (existing && (existing.items as MediaItem[])?.length < 3) {
      console.log("🔄 [CRON] Case 2: Filling up to 3 items...");
      const items = existing.items as MediaItem[];
      const seenIds = new Set(items.map((i) => i.id));
      const needed = 3 - items.length;
      const newItems = await getRandomMedia(seenIds, needed);
      finalItems = [...newItems, ...items].slice(0, 3);

      const { data: updateData, error: updateError } = await supabase
        .from("daily_media")
        .update({ items: finalItems, updated_at: new Date().toISOString() })
        .eq("date", today)
        .select(); // Add .select() to see what it actually updated

      console.log("📝 [CRON] Update Result:", { updateData, updateError });
      if (updateError) throw updateError;
    } else {
      console.log("🆕 [CRON] Case 3/4: New day. Fetching new items...");
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const { data: yesterdayData } = await supabase
        .from("daily_media")
        .select("*")
        .eq("date", yesterday)
        .maybeSingle();

      const yItems = (yesterdayData?.items as MediaItem[]) ?? [];
      const carryover = yItems.slice(0, 2);
      const seenIds = new Set(yItems.map((i) => i.id));

      const newItems = await getRandomMedia(seenIds, 1);
      finalItems = [...newItems, ...carryover].slice(0, 3);

      const { data: upsertData, error: upsertError } = await supabase
        .from("daily_media")
        .upsert(
          {
            date: today,
            items: finalItems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "date" }
        )
        .select(); // Add .select() to see what it actually inserted

      console.log("📝 [CRON] Upsert Result:", { upsertData, upsertError });
      if (upsertError) throw upsertError;
    }

    console.log(`✅ [CRON] Success! Final count: ${finalItems.length}`);
    return NextResponse.json({ ok: true, count: finalItems.length });
  } catch (error) {
    console.error("💥 [CRON] FATAL ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}