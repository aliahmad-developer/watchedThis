import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch all dynamic routes in parallel
    // NOTE: Adjust table names (movies, tv_shows, persons, genres) to match your actual schema
    const [moviesRes, tvRes, personsRes, genresRes] = await Promise.all([
      supabase.from("movies").select("id, slug, updated_at"),
      supabase.from("tv_shows").select("id, slug, updated_at"), 
      supabase.from("persons").select("id, slug"),
      supabase.from("genres").select("slug"),
    ]);

    if (moviesRes.error) throw moviesRes.error;
    if (tvRes.error) throw tvRes.error;
    if (personsRes.error) throw personsRes.error;
    if (genresRes.error) throw genresRes.error;

    const cacheData = {
      movies: moviesRes.data ?? [],
      tvShows: tvRes.data ?? [],
      persons: personsRes.data ?? [],
      genres: genresRes.data ?? [],
    };

    // Upsert into the singleton sitemap_cache table
    const { error } = await supabase
      .from("sitemap_cache")
      .upsert(
        { 
          id: "singleton", 
          data: cacheData,
          updated_at: new Date().toISOString()
        }, 
        { onConflict: "id" }
      );

    if (error) throw error;

    return NextResponse.json({ 
      ok: true, 
      counts: {
        movies: cacheData.movies.length,
        tvShows: cacheData.tvShows.length,
        persons: cacheData.persons.length,
        genres: cacheData.genres.length,
      }
    });
  } catch (error) {
    console.error("Sitemap cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}