import { adminDb } from "@/lib/firebaseAdmin";
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

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const now = Date.now();

    if (snap.exists) {
      const data = snap.data() as {
        date: string;
        items: MediaItem[];
        lockUntil?: number;
      };

      // Another instance holds the lock — skip generation
      if (data.lockUntil && data.lockUntil > now) {
        return { items: data.items ?? [], needsGeneration: false };
      }

      // Already up-to-date for today — nothing to do
      if (data.date === today && data.items?.length === 3) {
        return { items: dedupe(data.items), needsGeneration: false };
      }

      // Rolling to a new day (or partial write): always keep existing items
      // so we only ever add 1 new one rather than re-fetching all 3.
      const existingItems: MediaItem[] = data.items ?? [];

      tx.set(docRef, {
        date: today,
        items: existingItems,
        lockUntil: now + 15_000, // 15 s covers Cloud Run cold-start races
      });
      return { items: existingItems, needsGeneration: true };
    }

    // First ever run — no document yet
    tx.set(docRef, { date: today, items: [], lockUntil: Date.now() + 15_000 });
    return { items: [], needsGeneration: true };
  });

  if (!result.needsGeneration) return result.items;

  try {
    const existingIds = new Set(result.items.map((i: MediaItem) => i.id));

    // Always fetch exactly 1 — never recompute "needed" from items.length.
    // That was the root cause: on a date rollover result.items came back empty
    // (transaction wrote [] for the new day) so needed = 3, fetching all fresh.
    const newItems = await getRandomMedia(existingIds, 1);

    if (!newItems.length) throw new Error("Failed to generate new media item");

    // Prepend the new item, drop the oldest — always 3 total after seeding
    const fresh = dedupe([newItems[0], ...result.items]).slice(0, 3);

    await docRef.set({ date: today, items: fresh, lockUntil: 0 });
    return fresh;
  } catch (error) {
    // Release lock so the next request can retry
    await docRef.set({ date: today, items: result.items, lockUntil: 0 });
    console.error("[getOrCreateDailyMedia] Generation failed:", error);
    if (result.items.length > 0) {
      return result.items;
    }
    throw error;
  }
}

