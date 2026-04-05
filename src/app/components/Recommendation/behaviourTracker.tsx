// ──────────────────────────────────────────────────────────────────────────────

import { UserBehaviour } from "./types";

const MAX_CLICKS   = 200;
const MAX_SEARCHES = 50;
const MAX_FILTERS  = 30;

let cachedAuth: any = null;
let cachedDb: any = null;

async function initFirebase() {
  if (cachedAuth && cachedDb) return { auth: cachedAuth, db: cachedDb };
  
  const firebase = await import("../../firebase/firebaseConfig");
  cachedAuth = await firebase.getFirebaseAuth();
  cachedDb = firebase.getFirebaseDB();
  
  return { auth: cachedAuth, db: cachedDb };
}

// ── Internal: get or init the behaviour doc ───────────────────
async function getBehaviourDoc(uid: string): Promise<UserBehaviour> {
  const { db } = await initFirebase();
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const ref = doc(db, "users", uid, "behaviour", "log");
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as UserBehaviour;
    return { clickLog: [], searchHistory: [], findFilters: [] };
  } catch {
    return { clickLog: [], searchHistory: [], findFilters: [] };
  }
}

// ── Track a media item click ──────────────────────────────────
//
//  Call this wherever the user opens a media item detail,
//  plays a trailer, or navigates to a media page.
//
//  Example:
//    onClick={() => { trackClick(item.id, item.media_type); router.push(...) }}
export async function trackClick(
  itemId: number,
  mediaType: "movie" | "tv"
): Promise<void> {
  const { auth } = await initFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const current = await getBehaviourDoc(uid);
    const updated = [
      ...current.clickLog,
      { id: itemId, media_type: mediaType },
    ].slice(-MAX_CLICKS);

    const { db } = await initFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "users", uid, "behaviour", "log");
    await setDoc(ref, { clickLog: updated, updatedAt: Date.now() }, { merge: true });
  } catch {
    // Silent — never break the user's action
  }
}

// ── Track a search query ──────────────────────────────────────
//
//  Call this when the user submits a search.
//
//  Example (in your search component):
//    onSubmit={() => { trackSearch(query); fetchResults(query); }}
export async function trackSearch(query: string): Promise<void> {
  const { auth } = await initFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid || !query.trim()) return;

  try {
    const q = query.trim().toLowerCase();
    const current = await getBehaviourDoc(uid);
    const updated = [
      ...current.searchHistory.filter((s: string) => s !== q),
      q,
    ].slice(-MAX_SEARCHES);

    const { db } = await initFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "users", uid, "behaviour", "log");
    await setDoc(ref, { searchHistory: updated, updatedAt: Date.now() }, { merge: true });
  } catch {
    // Silent
  }
}

// ── Track Find-page filter usage ──────────────────────────────
//
//  Call this when the user hits Search on the Find page.
//  Each entry records which genres/keywords/ranges they searched with
//  so the recommendation engine can personalise based on repeated preferences.
//
//  Example (in FindPage):
//    handleSearch() { trackFindFilters({ ... }); router.push(...) }

export interface FindFilterSnapshot {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  keywords: string[];
  excludeKeywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  ts: number;
}

export async function trackFindFilters(
  snapshot: Omit<FindFilterSnapshot, "ts">
): Promise<void> {
  const { auth } = await initFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const isDefault =
    snapshot.genres.length === 0 &&
    snapshot.excludeGenres.length === 0 &&
    snapshot.keywords.length === 0 &&
    snapshot.excludeKeywords.length === 0 &&
    snapshot.yearRange[0] === 1950 &&
    snapshot.yearRange[1] === new Date().getFullYear() &&
    snapshot.ratingRange[0] === 0 &&
    snapshot.ratingRange[1] === 10;

  if (isDefault) return;

  try {
    const current = await getBehaviourDoc(uid);
    const entry: FindFilterSnapshot = { ...snapshot, ts: Date.now() };
    const updated = [
      ...(current.findFilters ?? []),
      entry,
    ].slice(-MAX_FILTERS);

    const { db } = await initFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "users", uid, "behaviour", "log");
    await setDoc(ref, { findFilters: updated, updatedAt: Date.now() }, { merge: true });
  } catch {
    // Silent
  }
}

// ── Load behaviour for the recommendation hook ────────────────
//
//  Used internally by useRecommendations — you don't need to call this.
export async function loadBehaviour(uid: string): Promise<UserBehaviour> {
  return getBehaviourDoc(uid);
}

