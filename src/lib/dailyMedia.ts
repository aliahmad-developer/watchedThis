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

      // Another instance holds the lock — return what we have
      if (data.lockUntil && data.lockUntil > now) {
        return { carryover: data.items ?? [], needsGeneration: false };
      }

      // Same day, already full — nothing to do
      if (data.date === today && data.items?.length >= 3) {
        return { carryover: dedupe(data.items), needsGeneration: false };
      }

      // New day — roll the window: drop oldest, carry forward 2
      const carryover =
        data.date !== today
          ? (data.items ?? []).slice(0, 2)
          : (data.items ?? []);

      tx.set(docRef, {
        date: today,
        items: carryover,
        lockUntil: now + 15_000,
      });
      return { carryover, needsGeneration: true };
    }

    // No doc yet — first ever run
    tx.set(docRef, { date: today, items: [], lockUntil: Date.now() + 15_000 });
    return { carryover: [], needsGeneration: true };
  });

  if (!result.needsGeneration) return result.carryover;

  try {
    const needed = 3 - result.carryover.length;
    const seenIds = new Set(result.carryover.map((i: MediaItem) => i.id));

    const newItems = await getRandomMedia(seenIds, needed);

    if (newItems.length < needed) {
      throw new Error(
        `Failed to generate enough items (got ${newItems.length}, needed ${needed})`,
      );
    }

    // Prepend new items: index 0 = today, 1 = yesterday, 2 = 2 days ago
    const ordered = dedupe([...newItems, ...result.carryover]).slice(0, 3);

    console.log(
      `[dailyMedia] Generated ${newItems.length} new item(s) for ${today}, total: ${ordered.length}`,
    );

    await docRef.set({ date: today, items: ordered, lockUntil: 0 });
    return ordered;
  } catch (error) {
    // Release lock, keep whatever we had
    await docRef.set({ date: today, items: result.carryover, lockUntil: 0 });
    console.error("[getOrCreateDailyMedia] Generation failed:", error);
    if (result.carryover.length > 0) return result.carryover;
    throw error;
  }
}
