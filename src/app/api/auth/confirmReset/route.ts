import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", process.env.RANDOM_HMAC_SECRET!)
    .update(token)
    .digest("hex");
}
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^a-zA-Z0-9]/.test(password))
    return "Password must include a special character.";
  return null;
}

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  const hashedToken = hashToken(token.trim());

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
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    throw err;
  }

  await adminAuth.updateUser(user.uid, { password: newPassword });
  await doc.ref.update({ used: true });

  return NextResponse.json({ success: true });
}
