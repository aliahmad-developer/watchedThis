import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "__session";

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No session" },
        { status: 401, headers: noCacheHeaders },
      );
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);

    return NextResponse.json(
      {
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name || decoded.email || null,
        photoURL: decoded.picture || null,
      },
      { headers: noCacheHeaders },
    );
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[auth/me] verifySessionCookie failed — code:", code, err);

    if (code === "auth/session-cookie-expired") {
      const res = NextResponse.json(
        { error: "Session expired" },
        { status: 401, headers: noCacheHeaders },
      );
      res.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
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
