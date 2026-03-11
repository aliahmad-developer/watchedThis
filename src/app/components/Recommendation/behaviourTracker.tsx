// ─────────────────────────────────────────────────────────────
//  behaviourTracker.ts
//
//  Writes user behaviour (clicks, searches) to Firestore silently.
//  Stored under:  users/{uid}/behaviour  (single document, merged)
//
//  Call these from your existing event handlers — they never throw,
//  never block, and never affect your UI flow.
// ─────────────────────────────────────────────────────────────

import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserBehaviour } from "./types";

const MAX_CLICKS  = 200;
const MAX_SEARCHES = 50;

// ── Internal: get or init the behaviour doc ───────────────────

async function getBehaviourDoc(uid: string): Promise<UserBehaviour> {
  try {
    const ref  = doc(db, "users", uid, "behaviour", "log");
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as UserBehaviour;
    return { clickLog: [], searchHistory: [] };
  } catch {
    return { clickLog: [], searchHistory: [] };
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
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const current = await getBehaviourDoc(uid);
    const updated = [
      ...current.clickLog,
      { id: itemId, media_type: mediaType },
    ].slice(-MAX_CLICKS);

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
  const uid = auth.currentUser?.uid;
  if (!uid || !query.trim()) return;

  try {
    const q       = query.trim().toLowerCase();
    const current = await getBehaviourDoc(uid);
    const updated = [
      ...current.searchHistory.filter((s) => s !== q),
      q,
    ].slice(-MAX_SEARCHES);

    const ref = doc(db, "users", uid, "behaviour", "log");
    await setDoc(ref, { searchHistory: updated, updatedAt: Date.now() }, { merge: true });
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