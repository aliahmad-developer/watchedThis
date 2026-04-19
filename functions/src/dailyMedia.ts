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

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const now = Date.now();

    if (snap.exists) {
      const data = snap.data() as {
        date: string;
        items: MediaItem[];
        lockUntil?: number;
      };

      if (data.lockUntil && data.lockUntil > now) {
        return { items: data.items, needsGeneration: false };
      }

      if (data.date === today && data.items?.length === 3) {
        return { items: dedupe(data.items), needsGeneration: false };
      }

      tx.set(docRef, {
        date: today,
        items: data.items ?? [],
        lockUntil: Date.now() + 10_000,
      });
      return { items: data.items ?? [], needsGeneration: true };
    }

    tx.set(docRef, { date: today, items: [], lockUntil: Date.now() + 10_000 });
    return { items: [], needsGeneration: true };
  });

  if (!result.needsGeneration) return result.items;

  try {
    const existingIds = new Set(result.items.map((i) => i.id));
    const needed = result.items.length < 3 ? 3 - result.items.length : 1;
    const newItems = await getRandomMedia(existingIds, needed);

    if (!newItems.length) throw new Error("Failed to generate new items");

    const fresh = [...newItems, ...result.items].slice(0, 3);

    await docRef.set({ date: today, items: fresh, lockUntil: 0 });
    return fresh;
  } catch (error) {
    // Release lock so next request can retry
    await docRef.set({ date: today, items: result.items, lockUntil: 0 });
    console.error("[getOrCreateDailyMedia] Generation failed:", error);
    // If we have existing items, return them rather than throwing
    if (result.items.length > 0) {
      return result.items;
    }
    throw error;
  }
}
