// lib/imageTmdb.ts
export function tmdbImage(path: string | null, size = "w185"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}