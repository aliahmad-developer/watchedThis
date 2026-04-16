import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const COLLECTION = "appData";
const DOC = "dailyMedia";

interface MediaItem {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
}

interface DailyMediaDoc {
  date: string;
  items: MediaItem[];
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://watchedthis.com";


const dedupe = (items: MediaItem[]): MediaItem[] => {
  const map = new Map<number, MediaItem>();
  for (const item of items) {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
};

async function fetchBatch(count: number): Promise<MediaItem[]> {
  const requests = Array.from({ length: count }, () =>
    fetch(`${BASE_URL}/api/randomCall`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  );

  const results = await Promise.all(requests);

  return results.filter((x): x is MediaItem => !!x?.id);
}

async function fetchUnique(
  target: number,
  existing: MediaItem[] = []
): Promise<MediaItem[]> {
  const seen = new Set(existing.map((x) => x.id));
  let collected: MediaItem[] = [];

  for (let i = 0; i < 2 && collected.length < target; i++) {
    const batch = await fetchBatch(target * 2);

    for (const item of batch) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        collected.push(item);
        if (collected.length >= target) break;
      }
    }
  }

  return collected;
}


export async function GET() {
  try {
    const today = new Date().toDateString();
    const docRef = adminDb.collection(COLLECTION).doc(DOC);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);

      if (snap.exists) {
        const data = snap.data() as DailyMediaDoc;

        if (data.date === today && data.items?.length > 0) {
          return dedupe(data.items);
        }

        const existing = dedupe(data.items || []);
        const newItems = await fetchUnique(1, existing);

        const updated = dedupe([...newItems, ...existing]).slice(0, 3);

        tx.set(docRef, { date: today, items: updated });

        return updated;
      }

      const freshItems = await fetchUnique(3);

      if (freshItems.length === 0) {
        throw new Error("Failed to fetch media");
      }

      tx.set(docRef, { date: today, items: freshItems });

      return freshItems;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}