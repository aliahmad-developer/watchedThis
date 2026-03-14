import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const COLLECTION = "appData";
const DOC        = "dailyMedia";

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

const deduped = (items: MediaItem[]): MediaItem[] =>
  items.filter((item, i, arr) => arr.findIndex(x => x.id === item.id) === i);

async function fetchUniqueItems(
  n: number,
  existing: MediaItem[] = []
): Promise<MediaItem[]> {
  const seen    = new Set(existing.map(x => x.id));
  const results: MediaItem[] = [];
  const maxAttempts = n * 4;
  let attempts = 0;

  const base = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  while (results.length < n && attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch(`${base}/api/randomCall`);
      if (!res.ok) continue;
      const item: MediaItem = await res.json();
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
    } catch {
      // keep trying
    }
  }

  return results;
}

export async function GET() {
  try {
    const today  = new Date().toDateString();
    const docRef = adminDb.collection(COLLECTION).doc(DOC);
    const snap   = await docRef.get();

    if (snap.exists) {
      const remote = snap.data() as DailyMediaDoc;

      if (remote.date === today && remote.items?.length > 0) {
        return NextResponse.json({ success: true, data: deduped(remote.items) });
      }

      const existingItems = deduped(remote.items ?? []);
      const newItems      = await fetchUniqueItems(1, existingItems);

      const rotated: DailyMediaDoc = {
        date:  today,
        items: deduped([...newItems, ...existingItems]).slice(0, 3),
      };

      await docRef.set(rotated);
      return NextResponse.json({ success: true, data: rotated.items });
    }

    const initial = await fetchUniqueItems(3);
    if (initial.length === 0) throw new Error("Could not fetch any media");

    const seed: DailyMediaDoc = { date: today, items: initial };
    await docRef.set(seed);
    return NextResponse.json({ success: true, data: seed.items });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}