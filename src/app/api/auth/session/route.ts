import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebaseAdmin";
import { Redis } from "@upstash/redis";

const bodySchema = z.object({
  idToken: z.string().min(1),
});
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const COOKIE_NAME = "__session";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400, headers: noCacheHeaders },
      );
    }

    const { idToken } = parsed.data;

    // Debug (prod only): confirm we reached this endpoint + cookie attributes.
    if (process.env.NODE_ENV === "production") {
      console.log("[auth/session] POST received");
    }

    await adminAuth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ ok: true }, { headers: noCacheHeaders });

    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: isProd,
      // Google OAuth / One Tap redirects are commonly cross-site; this is required so
      // the cookie is actually sent back to the server in production.
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    return res;
  } catch (err) {
    console.error("[auth/session] error:", err);

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401, headers: noCacheHeaders },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value;

  if (sessionCookie) {
    const cacheKey = `user:session:${sessionCookie.slice(-32)}`;
    await redis.del(cacheKey);
  }

  const res = NextResponse.json({ ok: true }, { headers: noCacheHeaders });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
