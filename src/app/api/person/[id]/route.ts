import { NextResponse } from "next/server";
import type { TMDBPersonCredit } from "@/types/tmdb";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

export const revalidate = 86400;

async function fetchRuntime(id: number, media_type: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/${media_type}/${id}?api_key=${API_KEY}&language=en-US`
    );
    if (!res.ok) return {};
    const data = await res.json();

    if (media_type === "movie") {
      return { runtime: data.runtime ?? null };
    }
    if (media_type === "tv") {
      return { episode_run_time: data.episode_run_time ?? [] };
    }
    return {};
  } catch {
    return {};
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
  }

  try {
    // Fetch person details, credits, and images
    const [detailsRes, creditsRes, imagesRes] = await Promise.all([
      fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US`),
      fetch(
        `${BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`
      ),
      fetch(`${BASE_URL}/person/${id}/images?api_key=${API_KEY}`),
    ]);

    if (!detailsRes.ok) {
      if (detailsRes.status === 404) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }
      throw new Error(`TMDB API error: ${detailsRes.status}`);
    }

    const [details, credits, imagesData] = await Promise.all([
      detailsRes.json(),
      creditsRes.ok ? creditsRes.json() : Promise.resolve(null),
      imagesRes.ok ? imagesRes.json() : Promise.resolve(null),
    ]);

    // Process credits
    let filteredCredits = null;

    if (credits) {
      const cast = (credits.cast as TMDBPersonCredit[]).sort(
        (a, b) =>
          new Date(b.release_date || b.first_air_date || "9999").getTime() -
          new Date(a.release_date || a.first_air_date || "9999").getTime()
      );
      const crew = (credits.crew as TMDBPersonCredit[]).filter(
        (item) => item.job === "Director" || item.job === "Producer"
      );
      // Fetch runtimes in parallel for cast + crew
      const allCredits = [...cast, ...crew];
      const runtimeData = await Promise.all(
        allCredits.map((c) => fetchRuntime(c.id, c.media_type))
      );

      // Merge runtime info back into cast/crew
      const enrichedCast = cast.map((c, i) => ({
        id: c.id,
        title: c.title || c.name,
        character: c.character,
        poster_path: c.poster_path,
        media_type: c.media_type,
        release_date: c.release_date || c.first_air_date,
        vote_average: c.vote_average,
        ...runtimeData[i], // runtime or episode_run_time
      }));

      const enrichedCrew = crew.map((c, i) => {
        const offset = cast.length; // shift index
        return {
          id: c.id,
          title: c.title || c.name,
          job: c.job,
          poster_path: c.poster_path,
          media_type: c.media_type,
          release_date: c.release_date || c.first_air_date,
          ...runtimeData[offset + i],
        };
      });

      filteredCredits = { cast: enrichedCast, crew: enrichedCrew };
    }

    const filteredImages = imagesData
      ? { profiles: imagesData.profiles.slice(0, 10) }
      : null;

    return NextResponse.json({
      details: {
        id: details.id,
        name: details.name,
        biography: details.biography,
        birthday: details.birthday,
        deathday: details.deathday,
        place_of_birth: details.place_of_birth,
        profile_path: details.profile_path,
        known_for_department: details.known_for_department,
        popularity: details.popularity,
      },
      credits: filteredCredits,
      images: filteredImages,
    });
  } catch (error: unknown) {
    console.error({ level: 'error', endpoint: '/api/person/[id]', message: (error as Error).message });
    return NextResponse.json(
      { error: "Failed to fetch person data" },
      { status: 500 }
    );
  }
}
