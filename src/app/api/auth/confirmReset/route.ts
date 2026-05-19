import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

function getHmacSecret(): string {
  const secret = process.env.RANDOM_HMAC_SECRET;
  if (!secret) throw new Error("RANDOM_HMAC_SECRET is not set.");
  return secret;
}

function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", getHmacSecret())
    .update(token)
    .digest("hex");
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Invalid password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^a-zA-Z0-9]/.test(password))
    return "Password must include a special character.";
  return null;
}

function validateToken(token: unknown): string | null {
  if (typeof token !== "string" || !token.trim())
    return "Missing or invalid token.";
  if (token.length > 512) return "Invalid token.";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    getHmacSecret();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { token, newPassword } = body as {
    token?: unknown;
    newPassword?: unknown;
  };

  // ── validate inputs
  const tokenError = validateToken(token);
  if (tokenError)
    return NextResponse.json({ error: tokenError }, { status: 400 });

  const passwordError = validatePassword(newPassword);
  if (passwordError)
    return NextResponse.json({ error: passwordError }, { status: 400 });

  const hashedToken = hashToken((token as string).trim());

  try {
    const docRef = adminDb.collection("passwordResetTokens").doc(hashedToken);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    const data = doc.data()!;

    if (data.used) {
      return NextResponse.json(
        { error: "This link has already been used." },
        { status: 400 },
      );
    }

    const expiresAt = data.expiresAt?.toDate?.() ?? new Date(0);

    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired." },
        { status: 400 },
      );
    }

    const user = await adminAuth.getUserByEmail(data.email);

    await adminAuth.updateUser(user.uid, {
      password: newPassword as string,
    });
    await docRef.update({
      used: true,
      usedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resetPassword] error", err);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
