import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebaseAdmin";

// ─── Input validation ─────────────────────────────────────────────────────────
const bodySchema = z.object({
  idToken: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, {
      message: "Invalid token format",
    }),
});

// ─── Cookie config ────────────────────────────────────────────────────────────
const COOKIE_NAME = "__session";
const MAX_AGE = 3600; // 1 hour — matches Firebase ID token lifetime

// HttpOnly session cookie — never readable by JS.
function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

// Non-HttpOnly indicator cookie — no sensitive data, lets client code
// (e.g. Google One Tap) know a session exists without reading the token.
function indicatorCookie(): string {
  return `signed-in=1; Path=/; Max-Age=${MAX_AGE}; Secure; SameSite=Strict`;
}

function clearedSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function clearedIndicatorCookie(): string {
  return `signed-in=; Path=/; Max-Age=0; Secure; SameSite=Strict`;
}

// ─── Normalized error helper ──────────────────────────────────────────────────
function err(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// ─── POST — sign in ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return err("Invalid token format", 400);

  try {
    // Cryptographically verify the token and check it hasn't been revoked.
    await adminAuth.verifyIdToken(
      parsed.data.idToken,
      /* checkRevoked= */ true,
    );
  } catch {
    // Never echo the Firebase error — it can contain credential fragments.
    return err("Authentication failed", 401);
  }

  const res = NextResponse.json({ ok: true });
  // Set both cookies in a single response via append
  res.headers.set("Set-Cookie", sessionCookie(parsed.data.idToken));
  res.headers.append("Set-Cookie", indicatorCookie());
  return res;
}

// ─── DELETE — sign out ────────────────────────────────────────────────────────
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearedSessionCookie());
  res.headers.append("Set-Cookie", clearedIndicatorCookie());
  return res;
}
