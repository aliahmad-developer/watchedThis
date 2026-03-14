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

  console.log("[dailyMedia] fetchUniqueItems base URL:", base);

  while (results.length < n && attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch(`${base}/api/randomCall`);
      if (!res.ok) {
        console.warn(`[dailyMedia] randomCall attempt ${attempts} failed: ${res.status}`);
        continue;
      }
      const item: MediaItem = await res.json();
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
        console.log(`[dailyMedia] got unique item: ${item.id} - ${item.title}`);
      }
    } catch (e) {
      console.warn(`[dailyMedia] randomCall attempt ${attempts} threw:`, e);
    }
  }

  console.log(`[dailyMedia] fetchUniqueItems returning ${results.length}/${n} items`);
  return results;
}

export async function GET() {
  console.log("[dailyMedia] GET hit");
  console.log("[dailyMedia] env check:", {
    projectId:   !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey:  !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    baseUrl:     process.env.NEXT_PUBLIC_BASE_URL,
    vercelUrl:   process.env.VERCEL_URL,
  });

  try {
    const today  = new Date().toDateString();
    console.log("[dailyMedia] today:", today);

    const docRef = adminDb.collection(COLLECTION).doc(DOC);
    console.log("[dailyMedia] fetching Firestore doc...");
    const snap   = await docRef.get();
    console.log("[dailyMedia] snap.exists:", snap.exists);

    // ── Case 1: fresh doc for today ──────────────────────────
    if (snap.exists) {
      const remote = snap.data() as DailyMediaDoc;
      console.log("[dailyMedia] remote.date:", remote.date, "today:", today);

      if (remote.date === today && remote.items?.length > 0) {
        console.log("[dailyMedia] serving fresh cached doc");
        return NextResponse.json({ success: true, data: deduped(remote.items) });
      }

      // ── Case 2: stale doc — rotate ────────────────────────
      console.log("[dailyMedia] doc is stale, rotating...");
      const existingItems = deduped(remote.items ?? []);
      const newItems      = await fetchUniqueItems(1, existingItems);

      const rotated: DailyMediaDoc = {
        date:  today,
        items: deduped([...newItems, ...existingItems]).slice(0, 3),
      };

      await docRef.set(rotated);
      console.log("[dailyMedia] rotated doc written");
      return NextResponse.json({ success: true, data: rotated.items });
    }

    // ── Case 3: no doc yet — seed ─────────────────────────────
    console.log("[dailyMedia] no doc, seeding...");
    const initial = await fetchUniqueItems(3);
    if (initial.length === 0) throw new Error("Could not fetch any media");

    const seed: DailyMediaDoc = { date: today, items: initial };
    await docRef.set(seed);
    console.log("[dailyMedia] seed doc written");
    return NextResponse.json({ success: true, data: seed.items });

  } catch (error) {
    console.error("[dailyMedia] error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}