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

export async function generateDailyMedia(
  existing: MediaItem[] = [],
): Promise<MediaItem[]> {
  const seen = new Set(existing.map((i) => i.id));
  const results = [...existing];
  const maxAttempts = 9;

  for (let i = 0; i < maxAttempts && results.length < 3; i++) {
    try {
      const batch = await getRandomMedia(seen, 1);
      for (const item of batch) {
        if (item) {
          results.push(item);
          seen.add(item.id);
          if (results.length === 3) break;
        }
      }
    } catch (err) {
      console.error(`[generateDailyMedia] attempt ${i + 1} threw:`, err);
    }
  }

  if (results.length < 3) {
    throw new Error(`Failed to generate enough items (${results.length}/3)`);
  }

  return results.slice(0, 3);
}

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

      // Already full — nothing to do
      if (data.date === today && data.items?.length >= 3) {
        return { items: dedupe(data.items), needsGeneration: false };
      }

      // Partial or new day — preserve existing items, claim lock
      const existingItems: MediaItem[] = data.items ?? [];
      tx.set(docRef, {
        date: today,
        items: existingItems,
        lockUntil: now + 15_000,
      });
      return { items: existingItems, needsGeneration: true };
    }

    // No doc yet — first ever run
    tx.set(docRef, { date: today, items: [], lockUntil: Date.now() + 15_000 });
    return { items: [], needsGeneration: true };
  });

  if (!result.needsGeneration) return result.items;

  try {
    const fresh = await generateDailyMedia(result.items);
    console.log(
      `[dailyMedia] Generated ${fresh.length - result.items.length} new item(s) for ${today}, total: ${fresh.length}`,
    );
    await docRef.set({ date: today, items: fresh, lockUntil: 0 });
    return fresh;
  } catch (error) {
    await docRef.set({ date: today, items: result.items, lockUntil: 0 });
    console.error("[getOrCreateDailyMedia] Generation failed:", error);
    if (result.items.length > 0) return result.items;
    throw error;
  }
}