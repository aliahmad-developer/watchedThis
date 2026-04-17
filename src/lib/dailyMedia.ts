import { adminDb } from "@/lib/firebaseAdmin";
import { getRandomMedia } from "@/lib/randomMedia";

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

// ─────────────────────────────────────────────────────────────
// 🔹 Read cached daily media
// ─────────────────────────────────────────────────────────────
export async function getDailyMediaItems(
  today: string,
): Promise<MediaItem[] | null> {
  const docRef = adminDb.collection(COLLECTION).doc(DOC);
  const snap = await docRef.get();

  if (!snap.exists) return null;

  const data = snap.data() as { date: string; items: MediaItem[] };

  if (data?.date === today && data.items?.length === 3) {
    return dedupe(data.items);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Simple write (NO transaction)
// ─────────────────────────────────────────────────────────────
async function saveDailyMedia(today: string, items: MediaItem[]) {
  const docRef = adminDb.collection(COLLECTION).doc(DOC);

  await docRef.set(
    {
      date: today,
      items,
    },
    { merge: true },
  );
}

// ─────────────────────────────────────────────────────────────
// 🔹 Core generator (safe + bounded)
// ─────────────────────────────────────────────────────────────
export async function generateDailyMedia(
  existing: MediaItem[] = [],
): Promise<MediaItem[]> {
  const seen = new Set(existing.map((i) => i.id));
  const results = [...existing];

  const maxAttempts = 3;

  for (let i = 0; i < maxAttempts && results.length < 3; i++) {
    const batch = await getRandomMedia(seen, 1);

    for (const item of batch) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);

        if (results.length === 3) break;
      }
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

  const snap = await docRef.get();

  if (snap.exists) {
    const data = snap.data() as {
      date: string;
      items: MediaItem[];
      lockUntil?: number;
    };

    const now = Date.now();

    if (data.lockUntil && data.lockUntil > now) {
      return data.items;
    }

    if (data?.date === today && data.items?.length === 3) {
      return data.items;
    }
  }

  const fresh = await generateDailyMedia([]);

  await docRef.set({
    date: today,
    items: fresh,
    lockUntil: Date.now() + 10_000,
  });

  return fresh;
}
