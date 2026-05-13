"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateDailyMedia = getOrCreateDailyMedia;
const firebaseAdmin_1 = require("./firebaseAdmin");
const randomMedia_1 = require("./randomMedia");
const COLLECTION = "appData";
const DOC = "dailyMedia";
const dedupe = (items) => {
    const map = new Map();
    for (const item of items) {
        if ((item === null || item === void 0 ? void 0 : item.id) && !map.has(item.id)) {
            map.set(item.id, item);
        }
    }
    return Array.from(map.values());
};
async function getOrCreateDailyMedia(today) {
    var _a, _b, _c, _d;
    const docRef = firebaseAdmin_1.adminDb.collection(COLLECTION).doc(DOC);
    const snap = await docRef.get();
    // Case 1: date is today and already have 3 — do nothing
    if (snap.exists) {
        const data = snap.data();
        if (data.date === today && ((_a = data.items) === null || _a === void 0 ? void 0 : _a.length) >= 3) {
            return data.items;
        }
        // Case 2: date is today but < 3 items — fill up to 3
        if (data.date === today && ((_b = data.items) === null || _b === void 0 ? void 0 : _b.length) < 3) {
            const existing = (_c = data.items) !== null && _c !== void 0 ? _c : [];
            const needed = 3 - existing.length;
            const seenIds = new Set(existing.map((i) => i.id));
            const newItems = await (0, randomMedia_1.getRandomMedia)(seenIds, needed);
            const updated = dedupe([...newItems, ...existing]).slice(0, 3);
            await docRef.set({ date: today, items: updated });
            return updated;
        }
        // Case 3: new day — carry 2 newest, fetch 1 new → [newItem, old1, old2]
        if (data.date !== today) {
            // Case 3 in getOrCreateDailyMed
            const carryover = ((_d = data.items) !== null && _d !== void 0 ? _d : []).slice(0, 2);
            const seenIds = new Set(data.items.map((i) => i.id)); // all 3, not just carryover
            const newItems = await (0, randomMedia_1.getRandomMedia)(seenIds, 1);
            const updated = dedupe([...newItems, ...carryover]).slice(0, 3);
            await docRef.set({ date: today, items: updated });
            return updated;
        }
    }
    // Case 4: no doc yet — first ever run
    const newItems = await (0, randomMedia_1.getRandomMedia)(new Set(), 3);
    const items = dedupe(newItems).slice(0, 3);
    await docRef.set({ date: today, items });
    return items;
}
//# sourceMappingURL=dailyMedia.js.map