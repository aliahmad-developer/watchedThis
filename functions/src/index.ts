import { onSchedule } from "firebase-functions/v2/scheduler";
import { getOrCreateDailyMedia } from "./dailyMedia";

export const updateDailyMedia = onSchedule("0 0 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  await getOrCreateDailyMedia(today);
  console.log("Daily media updated for", today);
});