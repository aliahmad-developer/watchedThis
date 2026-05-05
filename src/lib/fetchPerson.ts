import { unstable_cache } from "next/cache";
import type { PersonData } from "../app/person/[slug]/[id]/types";

const _fetchPerson = async (id: string): Promise<PersonData | null> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${id}?append_to_response=combined_credits,images`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        },
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();

    return {
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
  } catch {
    return null;
  }
};

export const fetchPerson = unstable_cache(_fetchPerson, ["fetch-person"], {
  revalidate: 3600,
});
