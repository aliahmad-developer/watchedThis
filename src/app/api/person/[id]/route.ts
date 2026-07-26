import { NextResponse } from "next/server";
import type { TMDBPersonCredit } from "@/types/tmdb";
import { tmdbFetch } from "@/lib/tmdbRequest";
import { cache, TTL } from "@/lib/cache";

async function fetchRuntimeCached(id: number, media_type: string) {
  const key = `runtime:${media_type}:${id}`;
  const cached = cache.get<Record<string, unknown>>(key, TTL.DAY);
  if (cached) return cached;

  try {
    const data = await tmdbFetch<any>(`/${media_type}/${id}?language=en-US`);

    let result: Record<string, unknown> = {};

    if (media_type === "movie") {
      result = {
        runtime: data.runtime ?? null,
        vote_average: data.vote_average ?? null,
        overview: data.overview ?? null,
      };
    } else if (media_type === "tv") {
      result = {
        episode_run_time: data.episode_run_time ?? [],
        number_of_seasons: data.number_of_seasons ?? null,
        number_of_episodes: data.number_of_episodes ?? null,
        vote_average: data.vote_average ?? null,
        overview: data.overview ?? null,
      };
    }

    cache.set(key, result);
    return result;
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

  const cacheKey = `person:${id}`;
  const cached = cache.get<Record<string, unknown>>(cacheKey, TTL.DAY);

  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const [details, credits, imagesData] = await Promise.all([
      tmdbFetch<any>(`/person/${id}?language=en-US`),
      tmdbFetch<any>(`/person/${id}/combined_credits?language=en-US`),
      tmdbFetch<any>(`/person/${id}/images`),
    ]);

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

      const allCredits = [...cast, ...crew];

      // Dedupe: same movie/show can appear multiple times (e.g. actor + director)
      const uniqueKeys = Array.from(
        new Set(allCredits.map((c) => `${c.media_type}:${c.id}`)),
      );

      const uniqueRuntimeEntries = await Promise.all(
        uniqueKeys.map(async (key) => {
          const [media_type, tmdbId] = key.split(":");
          const data = await fetchRuntimeCached(Number(tmdbId), media_type);
          return [key, data] as const;
        }),
      );

      const runtimeMap = new Map(uniqueRuntimeEntries);

      const enrichedCast = cast.map((c) => {
        const rt = runtimeMap.get(`${c.media_type}:${c.id}`) ?? {};
        return {
          ...rt,
          id: c.id,
          title: c.title || c.name,
          character: c.character,
          poster_path: c.poster_path,
          media_type: c.media_type,
          release_date: c.release_date || c.first_air_date,
          vote_average: (rt as any)?.vote_average ?? c.vote_average,
        };
      });

      const enrichedCrew = crew.map((c) => {
        const rt = runtimeMap.get(`${c.media_type}:${c.id}`) ?? {};
        return {
          ...rt,
          id: c.id,
          title: c.title || c.name,
          job: c.job,
          poster_path: c.poster_path,
          media_type: c.media_type,
          release_date: c.release_date || c.first_air_date,
          vote_average: (rt as any)?.vote_average ?? c.vote_average,
        };
      });

      filteredCredits = { cast: enrichedCast, crew: enrichedCrew };
    }

    const filteredImages = imagesData
      ? { profiles: imagesData.profiles.slice(0, 10) }
      : null;

    const payload = {
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
    };

    cache.set(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS" },
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
      {
        error:
          status === 404 ? "Person not found" : "Failed to fetch person data",
      },
      { status },
    );
  }
}
