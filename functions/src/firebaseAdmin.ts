import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
if (!getApps().length) {
  initializeApp();
}

export const adminDb = getFirestore();
