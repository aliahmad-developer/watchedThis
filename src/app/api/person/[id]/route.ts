import { NextResponse } from "next/server";
import type { TMDBPersonCredit } from "@/types/tmdb";

import { tmdbFetch } from "@/lib/tmdbRequest";

export const revalidate = 86400;

async function fetchRuntime(id: number, media_type: string) {
  try {
    const data = await tmdbFetch<any>(`/${media_type}/${id}?language=en-US`);

    if (media_type === "movie") {
      return {
        runtime: data.runtime ?? null,
        vote_average: data.vote_average ?? null,
        overview: data.overview ?? null,
      };
    }
    if (media_type === "tv") {
      return {
        episode_run_time: data.episode_run_time ?? [],
        number_of_seasons: data.number_of_seasons ?? null,
        number_of_episodes: data.number_of_episodes ?? null,
        vote_average: data.vote_average ?? null,
        overview: data.overview ?? null,
      };
    }
    return {};
  } catch {
    return {};
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
  }

  try {
    // Fetch person details, credits, and images (no api_key in URL)
    const [details, credits, imagesData] = await Promise.all([
      tmdbFetch<any>(`/person/${id}?language=en-US`),
      tmdbFetch<any>(`/person/${id}/combined_credits?language=en-US`),
      tmdbFetch<any>(`/person/${id}/images`),
    ]);

    // If tmdbFetch throws, we handle it in the catch below.
    // (We no longer have access to HTTP status from a separate Response object here.)

    // Process credits
    let filteredCredits = null;

    if (credits) {
      const cast = (credits.cast as TMDBPersonCredit[]).sort(
        (a, b) =>
          new Date(b.release_date || b.first_air_date || "9999").getTime() -
          new Date(a.release_date || a.first_air_date || "9999").getTime(),
      );
      const crew = (credits.crew as TMDBPersonCredit[]).filter(
        (item) => item.job === "Director" || item.job === "Producer",
      );
      // Fetch runtimes in parallel for cast + crew
      const allCredits = [...cast, ...crew];
      const runtimeData = await Promise.all(
        allCredits.map((c) => fetchRuntime(c.id, c.media_type)),
      );

      // Merge runtime info back into cast/crew
      const enrichedCast = cast.map((c, i) => ({
        ...runtimeData[i],
        id: c.id,
        title: c.title || c.name,
        character: c.character,
        poster_path: c.poster_path,
        media_type: c.media_type,
        release_date: c.release_date || c.first_air_date,
        vote_average: runtimeData[i]?.vote_average ?? c.vote_average,
      }));

      const enrichedCrew = crew.map((c, i) => ({
        ...runtimeData[cast.length + i],
        id: c.id,
        title: c.title || c.name,
        job: c.job,
        poster_path: c.poster_path,
        media_type: c.media_type,
        release_date: c.release_date || c.first_air_date,
        vote_average:
          runtimeData[cast.length + i]?.vote_average ?? c.vote_average,
      }));

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
    console.error({
      level: "error",
      endpoint: "/api/person/[id]",
      message: (error as Error).message,
    });

    const msg = (error as Error).message || "";
    const status = msg.includes("404") ? 404 : 500;

    return NextResponse.json(
      { error: status === 404 ? "Person not found" : "Failed to fetch person data" },
      { status },
    );
  }
}
