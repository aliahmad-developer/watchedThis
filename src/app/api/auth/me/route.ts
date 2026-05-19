import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "__session";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      console.log("[auth/me] no cookie found");
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // checkRevoked: false — avoids live Firebase call on every request
    // which can timeout on serverless cold starts and cause false 401s
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: decoded.name || decoded.email || null,
      photoURL: decoded.picture || null,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[auth/me] verifySessionCookie failed — code:", code, err);

    // Expired session: clear the cookie so client stops retrying
    if (code === "auth/session-cookie-expired") {
      const res = NextResponse.json(
        { error: "Session expired" },
        { status: 401 },
      );
      res.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
