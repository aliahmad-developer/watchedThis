"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSitemap = exports.updateDailyMedia = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const dailyMedia_1 = require("./dailyMedia");
const sitemap_1 = require("./sitemap");
exports.updateDailyMedia = (0, scheduler_1.onSchedule)("0 0 * * *", async () => {
    const today = new Date().toISOString().slice(0, 10);
    console.log("[worker] today =", today);
    await (0, dailyMedia_1.getOrCreateDailyMedia)(today);
    console.log("Daily media updated for", today);
});
exports.updateSitemap = (0, scheduler_1.onSchedule)({ schedule: "0 1 * * *", secrets: [sitemap_1.tmdbApiKey] }, async () => {
    await (0, sitemap_1.generateSitemap)();
    console.log("Sitemap updated");
});
//# sourceMappingURL=index.js.map