import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

// FIX: Runtime guard instead of relying solely on the non-null assertion (!).
// If the secret is missing the HMAC will silently use "undefined" as the key,
// producing valid-looking but worthless hashes.
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

function validatePassword(password: string): string | null {
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
  // Fail fast if server is misconfigured — before touching any user input.
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

  const tokenError = validateToken(token);
  if (tokenError) {
    return NextResponse.json({ error: tokenError }, { status: 400 });
  }

  const passwordError = validatePassword(newPassword as string);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const hashedToken = hashToken((token as string).trim());

  try {
    const snapshot = await adminDb
      .collection("passwordResetTokens")
      .where("token", "==", hashedToken)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (data.used) {
      return NextResponse.json(
        { error: "This link has already been used." },
        { status: 400 },
      );
    }

    if (data.expiresAt.toDate() < new Date()) {
      return NextResponse.json(
        { error: "This link has expired." },
        { status: 400 },
      );
    }

    let user;
    try {
      user = await adminAuth.getUserByEmail(data.email);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      throw err;
    }

    await adminAuth.updateUser(user.uid, { password: newPassword as string });
    await doc.ref.update({ used: true });

    return NextResponse.json({ success: true });
  } catch {
    // Never echo the caught error — it may contain email or internal paths.
    console.error("[confirmReset] unexpected error");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
