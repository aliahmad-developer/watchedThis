import { adminDb } from "./firebaseAdmin";
import { getRandomMedia } from "./randomMedia";

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

const COLLECTION = "appData";
const DOC = "dailyMedia";

const dedupe = (items: MediaItem[]): MediaItem[] => {
  const map = new Map<number, MediaItem>();
  for (const item of items) {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
};

export async function getOrCreateDailyMedia(
  today: string,
): Promise<MediaItem[]> {
  const docRef = adminDb.collection(COLLECTION).doc(DOC);
  const snap = await docRef.get();

  // Case 1: date is today and already have 3 — do nothing
  if (snap.exists) {
    const data = snap.data() as { date: string; items: MediaItem[] };

    if (data.date === today && data.items?.length >= 3) {
      return data.items;
    }

    // Case 2: date is today but < 3 items — fill up to 3
    if (data.date === today && data.items?.length < 3) {
      const existing = data.items ?? [];
      const needed = 3 - existing.length;
      const seenIds = new Set(existing.map((i) => i.id));
      const newItems = await getRandomMedia(seenIds, needed);
      const updated = dedupe([...newItems, ...existing]).slice(0, 3);
      await docRef.set({ date: today, items: updated });
      console.log(
        `[dailyMedia] Generated ${newItems.length} new item(s) for ${today}, total: ${updated.length}`,
      );
      return updated;
    }

    // Case 3: new day — carry 2 newest, fetch 1 new → [newItem, old1, old2]
    if (data.date !== today) {
      const carryover = (data.items ?? []).slice(0, 2);
      const seenIds = new Set(data.items.map((i) => i.id)); // all 3, not just carryover
      const newItems = await getRandomMedia(seenIds, 1);
      const updated = dedupe([...newItems, ...carryover]).slice(0, 3);
      await docRef.set({ date: today, items: updated });
      console.log(
        `[dailyMedia] Rotated 1 new item for ${today}, total: ${updated.length}`,
      );
      return updated;
    }
  }

  // Case 4: no doc yet — first ever run
  const newItems = await getRandomMedia(new Set(), 3);
  const items = dedupe(newItems).slice(0, 3);
  await docRef.set({ date: today, items });
  console.log(`[dailyMedia] First run, generated ${items.length} item(s)`);
  return items;
}
