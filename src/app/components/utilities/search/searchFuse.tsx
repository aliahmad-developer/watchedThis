import Fuse from "fuse.js";

export interface MediaResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  original_name?: string;
  release_date?: string;
  poster_path?: string;
  runtime?: number;
}

async function fetchTMDB(
  query: string,
  page = 1,
): Promise<{ results: MediaResult[]; has_more: boolean; total_pages: number }> {
  try {
    const res = await fetch(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}`,
    );
    if (!res.ok) return { results: [], has_more: false, total_pages: 0 };
    return await res.json();
  } catch {
    return { results: [], has_more: false, total_pages: 0 };
  }
}

async function fetchByKeyword(
  keyword: string,
  page = 1,
): Promise<{ results: MediaResult[]; has_more: boolean; total_pages: number }> {
  try {
    const res = await fetch(
      `/api/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
    );
    if (!res.ok) return { results: [], has_more: false, total_pages: 0 };
    return await res.json();
  } catch {
    return { results: [], has_more: false, total_pages: 0 };
  }
}

export async function smartSearch(
  query: string,
  page = 1,
  keyword?: string,
): Promise<{ results: MediaResult[]; has_more: boolean }> {
  // ── Keyword mode ────────────────────────────────────────────────────────────
  if (keyword) {
    const data = await fetchByKeyword(keyword, page);
    return { results: data.results, has_more: data.has_more };
  }

  // ── Pages > 1: just paginate ────────────────────────────────────────────────
  if (page > 1) {
    const data = await fetchTMDB(query, page);
    return { results: data.results, has_more: data.has_more };
  }

  // ── Page 1: multi-variant + fuse re-rank ────────────────────────────────────
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const variants = [...new Set([query, ...words])];

  const allData = await Promise.all(variants.map((v) => fetchTMDB(v, 1)));

  const seen = new Set<number>();
  const merged: MediaResult[] = [];
  for (const data of allData) {
    for (const item of data.results) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
  }

  const fuse = new Fuse(merged, {
    keys: [
      { name: "title",         weight: 0.6 },
      { name: "name",          weight: 0.6 },
      { name: "original_name", weight: 0.3 },
    ],
    threshold: 0.5,
    distance: 200,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true,
  });

  const fuseResults = fuse.search(query);
  const reranked = fuseResults.length > 0 ? fuseResults.map((r) => r.item) : merged;

  return {
    results: reranked,
    has_more: allData[0].has_more,
  };
}