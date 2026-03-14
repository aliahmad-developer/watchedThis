import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

console.log("[firebaseAdmin] projectId:", projectId);
console.log("[firebaseAdmin] clientEmail:", clientEmail);
console.log("[firebaseAdmin] privateKey starts with:", privateKey?.slice(0, 40));
console.log("[firebaseAdmin] privateKey ends with:", privateKey?.slice(-40));

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(`Missing Firebase env vars: projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!privateKey}`);
}

const adminApp: App =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });

export const adminDb = getFirestore(adminApp);