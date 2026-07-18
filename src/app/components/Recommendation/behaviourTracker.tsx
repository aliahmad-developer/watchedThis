import { createClient } from "@/lib/supabase/client";
import { UserBehaviour } from "./types";

const MAX_SEARCHES = 50;
const MAX_FILTERS = 30;

async function getUid(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getBehaviourDoc(uid: string): Promise<UserBehaviour> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("user_behaviour")
      .select("click_log, search_history, find_filters, updated_at")
      .eq("user_id", uid)
      .maybeSingle();

    if (error || !data) {
      return {
        clickLog: [],
        searchHistory: [],
        findFilters: [],
        updatedAt: Date.now(),
      };
    }

    return {
      clickLog: data.click_log ?? [],
      searchHistory: data.search_history ?? [],
      findFilters: data.find_filters ?? [],
      updatedAt: data.updated_at ?? Date.now(),
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
  const uid = await getUid();
  if (!uid) return;

  try {
    const supabase = createClient();
    await supabase.rpc("track_click", {
      p_item: { id: itemId, media_type: mediaType },
    });
  } catch {
    // silent fail
  }
}

export async function trackSearch(query: string): Promise<void> {
  const uid = await getUid();
  if (!uid || !query.trim()) return;

  try {
    const q = query.trim().toLowerCase();
    const current = await getBehaviourDoc(uid);

    const updated = [q, ...current.searchHistory.filter((s) => s !== q)].slice(
      0,
      MAX_SEARCHES,
    );

    const supabase = createClient();
    await supabase.from("user_behaviour").upsert({
      user_id: uid,
      search_history: updated,
      updated_at: Date.now(),
    });
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
  const uid = await getUid();
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

    const supabase = createClient();
    await supabase.from("user_behaviour").upsert({
      user_id: uid,
      find_filters: updated,
      updated_at: Date.now(),
    });
  } catch {
    // silent fail
  }
}

export async function loadBehaviour(uid: string): Promise<UserBehaviour> {
  return getBehaviourDoc(uid);
}
