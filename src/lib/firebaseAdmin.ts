import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// ─── Env validation ───────────────────────────────────────────────────────────
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// ─── Service account ──────────────────────────────────────────────────────────
function getServiceAccount(): Parameters<typeof cert>[0] {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is set but contains invalid JSON. " +
          "Check that the secret was not double-escaped.",
      );
    }
  }

  // Fall back to individual vars with explicit presence checks.
  return {
    projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
    privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}

// ─── Singleton initialization ─────────────────────────────────────────────────
function initAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    const app = existing[0];
    if (!app)
      throw new Error("Firebase Admin: getApps() returned an empty slot.");
    return app;
  }

  return initializeApp({ credential: cert(getServiceAccount()) });
}

export const adminApp: App = (() => {
  try {
    return initAdminApp();
  } catch (e) {
    const label =
      e instanceof Error && !e.message.includes("PRIVATE KEY")
        ? e.message
        : "Firebase Admin initialization failed (details withheld)";

    console.error({ level: "error", module: "firebaseAdmin", message: label });
    throw e;
  }
})();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
