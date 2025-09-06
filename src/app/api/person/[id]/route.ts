import { NextResponse } from "next/server";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Cache responses for 1 day (86400 seconds) to reduce API calls
export const revalidate = 86400;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> } // params is now a Promise
) {
  const { id } = await context.params; 

  // Validate ID parameter
  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid person ID" },
      { status: 400 }
    );
  }

  try {
    // Fetch person details and credits in parallel
    const [detailsRes, creditsRes, imagesRes] = await Promise.all([
      fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/person/${id}/images?api_key=${API_KEY}`),
    ]);

    // Check if all responses are successful
    if (!detailsRes.ok) {
      if (detailsRes.status === 404) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }
      throw new Error(`TMDB API error: ${detailsRes.status}`);
    }

    if (!creditsRes.ok) {
      console.error("Credits fetch failed:", creditsRes.status);
      // We'll continue without credits if this fails
    }

    const [details, credits, imagesData] = await Promise.all([
      detailsRes.json(),
      creditsRes.ok ? creditsRes.json() : Promise.resolve(null),
      imagesRes.ok ? imagesRes.json() : Promise.resolve(null),
    ]);

    // Filter to only include necessary data to reduce payload size
    const filteredCredits = credits
      ? {
          cast: credits.cast
            .sort(
              (a: any, b: any) =>
                new Date(b.release_date || b.first_air_date || "9999").getTime() -
                new Date(a.release_date || a.first_air_date || "9999").getTime()
            )
            .slice(0, 20) // Limit to top 20 credits
            .map((item: any) => ({
              id: item.id,
              title: item.title || item.name,
              character: item.character,
              poster_path: item.poster_path,
              media_type: item.media_type,
              release_date: item.release_date || item.first_air_date,
              vote_average: item.vote_average,
            })),
          crew: credits.crew
            .filter(
              (item: any) =>
                item.job === "Director" || item.job === "Producer"
            )
            .slice(0, 10) // Limit to top 10 crew credits
            .map((item: any) => ({
              id: item.id,
              title: item.title || item.name,
              job: item.job,
              poster_path: item.poster_path,
              media_type: item.media_type,
              release_date: item.release_date || item.first_air_date,
            })),
        }
      : null;

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
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch person data" },
      { status: 500 }
    );
  }
}
