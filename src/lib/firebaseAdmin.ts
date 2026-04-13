import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;
function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

try {
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(getServiceAccount()),
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (e) {
  console.error("[firebaseAdmin] init error:", e);
  throw e;
}

export const adminDb = getFirestore(adminApp);
export { adminApp };
