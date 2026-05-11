// lib/imageTmdb.ts
export function tmdbImage(path: string | null, size = "w185"): string | null {
  if (!path) return null;

  const tmdbUrl = `https://image.tmdb.org/t/p/${size}${path}`;

  if (process.env.NODE_ENV === "development") {
    return tmdbUrl;
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`;
}
