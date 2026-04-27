import { onSchedule } from "firebase-functions/v2/scheduler";
import { getOrCreateDailyMedia } from "./dailyMedia";
import { generateSitemap, tmdbApiKey } from "./sitemap";

export const updateDailyMedia = onSchedule("0 0 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  console.log("[worker] today =", today);
  await getOrCreateDailyMedia(today);
  console.log("Daily media updated for", today);
});

export const updateSitemap = onSchedule(
  { schedule: "0 1 * * *", secrets: [tmdbApiKey] },
  async () => {
    await generateSitemap();
    console.log("Sitemap updated");
  }
);