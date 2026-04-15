export type PersonData = {
  details: {
    name: string;
    biography?: string;
    profile_path?: string;
  };
} | null;

export const fetchPerson = async (id: string): Promise<PersonData> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${id}?append_to_response=combined_credits`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const details = await res.json();
    return { details };
  } catch {
    return null;
  }
};