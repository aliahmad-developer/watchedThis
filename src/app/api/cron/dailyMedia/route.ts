import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomMedia, type MediaItem } from "@/lib/randomMedia";

const ROW_ID = "singleton";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing, error: fetchError } = await supabase
      .from("daily_media")
      .select("*")
      .eq("id", ROW_ID)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let finalItems: MediaItem[] = [];

    if (
      existing &&
      existing.date === today &&
      (existing.items as MediaItem[])?.length >= 3
    ) {
      finalItems = existing.items as MediaItem[];
    } else if (
      existing &&
      existing.date === today &&
      (existing.items as MediaItem[])?.length < 3
    ) {
      const items = existing.items as MediaItem[];
      const seenIds = new Set(items.map((i) => i.id));
      const needed = 3 - items.length;
      const newItems = await getRandomMedia(seenIds, needed);
      finalItems = [...newItems, ...items].slice(0, 3);

      const { error: updateError } = await supabase
        .from("daily_media")
        .upsert({ id: ROW_ID, date: today, items: finalItems });
      if (updateError) throw updateError;
    } else {
      // New day (or no row yet) — carry over up to 2 from the existing row, fetch 1 new
      const prevItems = (existing?.items as MediaItem[]) ?? [];
      const carryover = prevItems.slice(0, 2);
      const seenIds = new Set(prevItems.map((i) => i.id));

      const newItems = await getRandomMedia(seenIds, 3 - carryover.length);
      finalItems = [...newItems, ...carryover].slice(0, 3);

      const { error: upsertError } = await supabase
        .from("daily_media")
        .upsert({ id: ROW_ID, date: today, items: finalItems });
      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ ok: true, count: finalItems.length });
  } catch (error) {
    console.error("[CRON] daily-media error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 },
    );
  }
}
