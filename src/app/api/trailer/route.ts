import { NextApiRequest, NextApiResponse } from "next";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { mediaId, mediaType, title, year } = req.query;

  if (!mediaId || !mediaType) {
    return res.status(400).json({ error: "Missing mediaId or mediaType" });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: "TMDB API key is missing" });
  }

  try {
    const tmdbUrl = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
    const tmdbRes = await fetch(tmdbUrl);
    const tmdbData = await tmdbRes.json();

    if (!tmdbRes.ok) {
      throw new Error(`TMDB request failed: ${tmdbRes.status}`);
    }

    const trailers = (tmdbData.results || []).filter(
      (vid: any) => vid.site === "YouTube" && vid.type === "Trailer"
    );

    const officialFirst = trailers.sort((a: any, b: any) => {
      if (a.official && !b.official) return -1;
      if (!a.official && b.official) return 1;
      return (
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    });

    if (officialFirst.length > 0) {
      const best = officialFirst[0];
      return res
        .setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate")
        .status(200)
        .json({ key: best.key, source: "tmdb" });
    }

    // Fallback to YouTube Search
    if (YOUTUBE_API_KEY && title) {
      const query = encodeURIComponent(
        `${title} ${year || ""} official trailer`
      );
      const ytUrl = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=1&q=${query}&key=${YOUTUBE_API_KEY}`;
      const ytRes = await fetch(ytUrl);
      const ytData = await ytRes.json();

      if (ytData.items && ytData.items.length > 0) {
        const ytTrailer = ytData.items[0];
        return res
          .setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate")
          .status(200)
          .json({ key: ytTrailer.id.videoId, source: "youtube_fallback" });
      }
    }

    return res
      .status(404)
      .json({ error: "No trailer found from TMDB or YouTube" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch trailer", detail: error.message });
  }
}
