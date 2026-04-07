import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

try {
  adminApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: process.env.FIREBASE_SERVICE_ACCOUNT
            ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
            : cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,  
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"), 
              }),
        });
} catch (e) {
  console.error("[firebaseAdmin] init error:", e);
  throw e;
}

export const adminDb = getFirestore(adminApp!);