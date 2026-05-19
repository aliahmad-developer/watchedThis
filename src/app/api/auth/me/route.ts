import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || decoded.email,
      photoURL: decoded.picture || null,
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
