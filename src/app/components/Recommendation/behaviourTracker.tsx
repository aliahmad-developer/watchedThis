import { UserBehaviour } from "./types";

const MAX_SEARCHES = 50;
const MAX_FILTERS = 30;

let cachedAuth: any = null;
let cachedDb: any = null;

async function initFirebase() {
  if (cachedAuth && cachedDb) {
    return { auth: cachedAuth, db: cachedDb };
  }

  const firebase = await import("../../firebase/firebaseConfig");

  cachedAuth = await firebase.getFirebaseAuth();
  cachedDb = firebase.getFirebaseDB();

  return {
    auth: cachedAuth,
    db: cachedDb,
  };
}

async function getBehaviourDoc(uid: string): Promise<UserBehaviour> {
  const { db } = await initFirebase();

  try {
    const { doc, getDoc } = await import("firebase/firestore");

    const ref = doc(db, "users", uid, "behaviour", "log");
    const snap = await getDoc(ref);

    const data = snap.exists() ? snap.data() : {};

    return {
      clickLog: data.clickLog ?? [],
      searchHistory: data.searchHistory ?? [],
      findFilters: data.findFilters ?? [],
      updatedAt: data.updatedAt ?? Date.now(),
    };
  } catch {
    return {
      clickLog: [],
      searchHistory: [],
      findFilters: [],
      updatedAt: Date.now(),
    };
  }
}
export async function trackClick(
  itemId: number,
  mediaType: "movie" | "tv",
): Promise<void> {
  const { auth, db } = await initFirebase();
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  try {
    const { doc, setDoc, arrayUnion } = await import("firebase/firestore");

    const ref = doc(db, "users", uid, "behaviour", "log");

    await setDoc(
      ref,
      {
        clickLog: arrayUnion({
          id: itemId,
          media_type: mediaType,
        }),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch {
    // silent fail
  }
}

export async function trackSearch(query: string): Promise<void> {
  const { auth, db } = await initFirebase();
  const uid = auth.currentUser?.uid;

  if (!uid || !query.trim()) return;

  try {
    const q = query.trim().toLowerCase();

    const current = await getBehaviourDoc(uid);

    const updated = [q, ...current.searchHistory.filter((s) => s !== q)].slice(
      0,
      MAX_SEARCHES,
    );

    const { doc, setDoc } = await import("firebase/firestore");

    const ref = doc(db, "users", uid, "behaviour", "log");

    await setDoc(
      ref,
      {
        searchHistory: updated,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch {
    // silent fail
  }
}

export interface FindFilterSnapshot {
  mediaType: "movie" | "tv" | "both";
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
  snapshot: Omit<FindFilterSnapshot, "ts">,
): Promise<void> {
  const { auth, db } = await initFirebase();
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

    const entry: FindFilterSnapshot = {
      ...snapshot,
      ts: Date.now(),
    };

    const updated = [...(current.findFilters ?? []), entry].slice(-MAX_FILTERS);

    const { doc, setDoc } = await import("firebase/firestore");

    const ref = doc(db, "users", uid, "behaviour", "log");

    await setDoc(
      ref,
      {
        findFilters: updated,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch {}
}
export async function loadBehaviour(uid: string): Promise<UserBehaviour> {
  return getBehaviourDoc(uid);
}
