import type { PersonData } from "../app/person/[slug]/[id]/types";
import { tmdbFetch, TmdbError } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

/**
 * NOTE: previously wrapped in unstable_cache(). That relies on Next's
 * filesystem-based data cache, which does not exist on the Cloudflare
 * Workers runtime -- it works locally (Node dev server) and silently
 * breaks/no-ops in production, the same issue that caused the media
 * detail page bugs. Caching here now uses the same in-memory
 * ServerCache (@/lib/cache) the rest of the app already relies on.
 */
async function _fetchPerson(id: string): Promise<PersonData | null> {
  const cacheKey = `person-full:${id}`;
  const cached = cache.get<PersonData>(cacheKey, TTL.DAY);
  if (cached) return cached;

  try {
    const data = await tmdbFetch<any>(
      `/person/${id}?append_to_response=combined_credits,images&language=en-US`,
      { next: { revalidate: 3600 } },
    );

    const result: PersonData = {
      details: {
        id: data.id,
        name: data.name,
        biography: data.biography,
        birthday: data.birthday ?? null,
        deathday: data.deathday ?? null,
        place_of_birth: data.place_of_birth ?? null,
        profile_path: data.profile_path ?? null,
        known_for_department: data.known_for_department,
        popularity: data.popularity,
      },
      credits: data.combined_credits
        ? {
            cast: data.combined_credits.cast ?? [],
            crew: data.combined_credits.crew ?? [],
          }
        : null,
      images: data.images
        ? { profiles: data.images.profiles?.slice(0, 10) ?? [] }
        : null,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    // A genuine 404 (person doesn't exist) resolves to null, same as
    // before. Anything else (network error, TMDB 5xx, rate limit) is
    // logged but still resolves to null here -- callers of fetchPerson
    // currently treat null as "not found" with no separate error state,
    // so this preserves existing behavior. If you want to show a
    // distinct "couldn't load, try again" state instead of a hard
    // "not found" for transient failures, this is the place to
    // re-throw instead of swallowing.
    if (err instanceof TmdbError) {
      console.error(
        `[fetchPerson] TMDB returned ${err.status} for person ${id}`,
      );
    } else {
      console.error("[fetchPerson] fetch threw:", err);
    }
    return null;
  }
}

export const fetchPerson = _fetchPerson;
