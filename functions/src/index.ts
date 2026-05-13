import { onSchedule } from "firebase-functions/v2/scheduler";
import { getOrCreateDailyMedia } from "./dailyMedia";
import { generateSitemap, tmdbApiKey } from "./sitemap";

export const updateDailyMedia = onSchedule("0 0 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  await getOrCreateDailyMedia(today);
});

export const updateSitemap = onSchedule(
  { schedule: "0 1 * * *", secrets: [tmdbApiKey] },
  async () => {
    await generateSitemap();
  }
);