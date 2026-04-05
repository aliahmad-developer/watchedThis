import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

// 🔑 Lazy app getter
function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// 🔑 Lazy auth
export async function getFirebaseAuth() {
  const app = getFirebaseApp();
  const auth = getAuth(app);

  // only set persistence in browser
  if (typeof window !== "undefined") {
    await setPersistence(auth, browserLocalPersistence);
  }

  return auth;
}

// 🔑 Lazy firestore
export function getFirebaseDB() {
  const app = getFirebaseApp();
  return getFirestore(app);
}