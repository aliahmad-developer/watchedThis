import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("__session")?.value;

  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const auth = getAuth(adminApp);
    const decoded = await auth.verifySessionCookie(session, true);

    const customToken = await auth.createCustomToken(decoded.uid);
    return NextResponse.json({ customToken });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}