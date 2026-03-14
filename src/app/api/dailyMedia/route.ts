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

const deduped = (items: MediaItem[]): MediaItem[] =>
  items.filter((item, i, arr) => arr.findIndex((x) => x.id === item.id) === i);

async function fetchUniqueItems(
  n: number,
  existing: MediaItem[] = [],
): Promise<MediaItem[]> {
  const seen = new Set(existing.map((x) => x.id));
  const results: MediaItem[] = [];
  const maxAttempts = n * 4;
  let attempts = 0;

  const base =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`
      : "https://random-ozus.vercel.app";

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
  if (process.env.NODE_ENV !== "production") {
    try {
      const res = await fetch("https://random-ozus.vercel.app/api/dailyMedia", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Vercel returned ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch (e) {
      console.error("[dailyMedia] proxy to vercel failed:", e);
      return NextResponse.json(
        { success: false, error: "Dev proxy to Vercel failed" },
        { status: 503 },
      );
    }
  }

  try {
    const today = new Date().toDateString();
    const docRef = adminDb.collection(COLLECTION).doc(DOC);

    // ── Read first ────────────────────────────────────────────
    const snap = await docRef.get();

    // ── Case 1: already fresh for today ──────────────────────
    if (snap.exists) {
      const remote = snap.data() as DailyMediaDoc;
      if (remote.date === today && remote.items?.length > 0) {
        return NextResponse.json({
          success: true,
          data: deduped(remote.items),
        });
      }
    }

    // ── Case 2/3: stale or missing — fetch new items first ───
    const existingItems = snap.exists
      ? deduped((snap.data() as DailyMediaDoc).items ?? [])
      : [];

    const newItems = snap.exists
      ? await fetchUniqueItems(1, existingItems)
      : await fetchUniqueItems(3);

    if (!snap.exists && newItems.length === 0) {
      throw new Error("Could not fetch any media");
    }

    const updatedItems = snap.exists
      ? deduped([...newItems, ...existingItems]).slice(0, 3)
      : newItems;

    // ── Transaction: only write if still stale ────────────────
    const result = await adminDb.runTransaction(async (tx) => {
      const freshSnap = await tx.get(docRef);

      if (freshSnap.exists) {
        const fresh = freshSnap.data() as DailyMediaDoc;
        if (fresh.date === today && fresh.items?.length > 0) {
          return fresh.items;
        }
      }

      const newDoc: DailyMediaDoc = { date: today, items: updatedItems };
      tx.set(docRef, newDoc);
      return updatedItems;
    });

    return NextResponse.json({ success: true, data: deduped(result) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
