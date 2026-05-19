import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebaseAdmin";

// ─── validation ─────────────────────────────────────────────
const bodySchema = z.object({
  idToken: z.string().min(1),
});

// ─── cookies ────────────────────────────────────────────────
const COOKIE_NAME = "__session";
const MAX_AGE = 3600;

function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

function indicatorCookie() {
  return `signed-in=1; Path=/; Max-Age=${MAX_AGE}; Secure; SameSite=Strict`;
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ─── POST login ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body;

  try {
    body = await req.json();
  } catch {
    return err("Invalid request body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return err("Invalid token", 400);

  try {
    await adminAuth.verifyIdToken(parsed.data.idToken, true);
  } catch {
    return err("Authentication failed", 401);
  }

  const res = NextResponse.json({ ok: true });

  res.headers.set("Set-Cookie", sessionCookie(parsed.data.idToken));
  res.headers.append("Set-Cookie", indicatorCookie());

  return res;
}

// ─── DELETE logout ──────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
  );

  res.headers.append(
    "Set-Cookie",
    `signed-in=; Path=/; Max-Age=0; Secure; SameSite=Strict`,
  );

  return res;
}
