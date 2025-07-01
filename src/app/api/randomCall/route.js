// app/api/test/route.js
export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY; // Now using env var
  
  if (!apiKey) {
    return Response.json(
      { error: "API key not loaded from .env" },
      { status: 500 }
    );
  }

  const url = `https://api.themoviedb.org/3/movie/550?api_key=${apiKey}`;
  const res = await fetch(url);
  return Response.json(await res.json());
}