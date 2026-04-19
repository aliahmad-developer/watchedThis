import { onSchedule } from "firebase-functions/v2/scheduler";
import { getOrCreateDailyMedia } from "./dailyMedia";
import { generateSitemap } from "./sitemap";

export const updateDailyMedia = onSchedule("0 0 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  await getOrCreateDailyMedia(today);
  console.log("Daily media updated for", today);
});

export const updateSitemap = onSchedule("0 1 * * *", async () => {
  await generateSitemap();
  console.log("Sitemap updated");
});
