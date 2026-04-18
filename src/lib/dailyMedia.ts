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

// ── Helpers ───────────────────────────────────────────────────────────────────
const dedupe = (items: MediaItem[]): MediaItem[] => {
  const map = new Map<number, MediaItem>();
  for (const item of items) {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
};

// ── Core generator ────────────────────────────────────────────────────────────
export async function generateDailyMedia(
  existing: MediaItem[] = [],
): Promise<MediaItem[]> {
  const seen = new Set(existing.map((i) => i.id));
  const results = [...existing];
  const maxAttempts = 9; // 3 items × 3 attempts each

  for (let i = 0; i < maxAttempts && results.length < 3; i++) {
    try {
      const batch = await getRandomMedia(seen, 1);

      for (const item of batch) {
        if (item) {
          // Don't re-check seen — getRandomMedia already handles dedup
          results.push(item);
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
// ── Main: get or create with race condition protection ────────────────────────
export async function getOrCreateDailyMedia(
  today: string,
): Promise<MediaItem[]> {
  const docRef = adminDb.collection(COLLECTION).doc(DOC);

  // Try to get existing data or set lock inside transaction
  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const now = Date.now();

    if (snap.exists) {
      const data = snap.data() as {
        date: string;
        items: MediaItem[];
        lockUntil?: number;
      };

      // Another instance is generating — return what we have
      if (data.lockUntil && data.lockUntil > now) {
        return { items: data.items, needsGeneration: false };
      }

      // Already generated today
      if (data.date === today && data.items?.length === 3) {
        return { items: dedupe(data.items), needsGeneration: false };
      }
    }

    // Claim the lock so no other instance generates simultaneously
    tx.set(docRef, {
      date: today,
      items: [],
      lockUntil: Date.now() + 10_000,
    });

    return { items: [], needsGeneration: true };
  });

  // Return cached data — no generation needed
  if (!result.needsGeneration) return result.items;

  // Generate outside transaction (async TMDB calls can't run inside)
  try {
    const fresh = await generateDailyMedia([]);

    await docRef.set({
      date: today,
      items: fresh,
      lockUntil: 0, // release lock
    });

    return fresh;
  } catch (error) {
    // Release lock on failure so next request can retry
    await docRef.set({
      date: today,
      items: [],
      lockUntil: 0,
    });

    throw error;
  }
}
