"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = void 0;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
exports.adminDb = (0, firestore_1.getFirestore)();
//# sourceMappingURL=firebaseAdmin.js.map