export function getTmdbBaseUrl() {
  return process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
}

export function getTmdbBearerToken() {
  // Prefer the bearer token variable used elsewhere in the repo.
  return process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY;
}

export async function tmdbFetch<T>(path: string, init?: RequestInit & { next?: any }): Promise<T> {
  const token = getTmdbBearerToken();
  if (!token) {
    throw new Error("TMDB access token is not configured");
  }

  const baseUrl = getTmdbBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`TMDB responded with ${res.status} for ${url}`);
  }

  return (await res.json()) as T;
}

