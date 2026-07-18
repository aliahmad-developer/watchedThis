import { createAdminClient } from "@/lib/supabase/admin";
import { getRandomMedia } from "./randomMedia";

const ROW_ID = "singleton";

type MediaItem = { id: number; [key: string]: unknown };

const dedupe = (items: MediaItem[]) => {
  const map = new Map<number, MediaItem>();
  for (const item of items) if (item?.id && !map.has(item.id)) map.set(item.id, item);
  return Array.from(map.values());
};

export async function getOrCreateDailyMedia(today: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("daily_media")
    .select("date, items")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (data) {
    if (data.date === today && data.items?.length >= 3) {
      return data.items;
    }

    if (data.date === today && data.items?.length < 3) {
      const existing: MediaItem[] = data.items ?? [];
      const needed = 3 - existing.length;
      const seenIds = new Set(existing.map((i) => i.id));
      const newItems = await getRandomMedia(seenIds, needed);
      const updated = dedupe([...newItems, ...existing]).slice(0, 3);
      await supabase.from("daily_media").upsert({ id: ROW_ID, date: today, items: updated });
      return updated;
    }

    if (data.date !== today) {
      const carryover: MediaItem[] = (data.items ?? []).slice(0, 2);
      const seenIds = new Set((data.items ?? []).map((i: MediaItem) => i.id));
      const newItems = await getRandomMedia(seenIds, 1);
      const updated = dedupe([...newItems, ...carryover]).slice(0, 3);
      await supabase.from("daily_media").upsert({ id: ROW_ID, date: today, items: updated });
      return updated;
    }
  }

  const newItems = await getRandomMedia(new Set(), 3);
  const items = dedupe(newItems).slice(0, 3);
  await supabase.from("daily_media").upsert({ id: ROW_ID, date: today, items });
  return items;
}