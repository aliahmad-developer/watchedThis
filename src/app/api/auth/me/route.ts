import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const COOKIE_NAME = "__session";
const CACHE_TTL = 60 * 60; 

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const hasCookie = !!req.cookies.get(COOKIE_NAME)?.value;
    console.log("[auth/me] called, __session present:", hasCookie);
    if (hasCookie) {
      const v = req.cookies.get(COOKIE_NAME)?.value;
      console.log("[auth/me] cookie __session len:", v?.length ?? 0);
    }
  }
  try {
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401, headers: noCacheHeaders },
      );
    }

    const cacheKey = `user:session:${sessionCookie.slice(-32)}`; 
    const cached = await redis.get<{
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json(cached, { headers: noCacheHeaders });
    }

    // Cache miss — verify and fetch from Firestore
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const db = getFirestore(adminApp);
    let firestorePhotoURL: string | null = null;
    try {
      const snap = await db.collection("users").doc(decoded.uid).get();
      const data = snap.data();
      firestorePhotoURL = (data?.photoURL as string | undefined) ?? null;
    } catch {
      // ignore
    }

    const userData = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name || decoded.email || null,
      photoURL: firestorePhotoURL ?? decoded.picture ?? null,
    };

    await redis.set(cacheKey, userData, { ex: CACHE_TTL });

    return NextResponse.json(userData, { headers: noCacheHeaders });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[auth/me] verifySessionCookie failed — code:", code, err);

    const isProd = process.env.NODE_ENV === "production";

    if (code === "auth/session-cookie-expired") {
      const res = NextResponse.json(
        { error: "Session expired" },
        { status: 401, headers: noCacheHeaders },
      );
      res.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401, headers: noCacheHeaders },
    );
  }
}
