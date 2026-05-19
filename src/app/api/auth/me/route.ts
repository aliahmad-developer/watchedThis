import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "__session";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || decoded.email,
      photoURL: decoded.picture || null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
