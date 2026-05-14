import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import * as crypto from "crypto";

const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;

function deriveKey(): Buffer {
  return crypto.scryptSync(HMAC_SECRET, "pendingSignup", 32);
}

function verifyToken(id: string, sig: string): boolean {
  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(id)
    .digest("hex");
  // Constant-time compare — prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(sig, "hex"),
    Buffer.from(expected, "hex"),
  );
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", deriveKey(), iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : (process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com");

export async function GET(req: NextRequest) {
  const rawToken = new URL(req.url).searchParams.get("token");

  if (!rawToken || !rawToken.includes(".")) {
    return NextResponse.redirect(`${baseUrl}/signup?error=invalid_token`);
  }

  // token = "<id>.<hmac-sig>"  — split on the LAST dot so the id hex is safe
  const lastDot = rawToken.lastIndexOf(".");
  const id = rawToken.slice(0, lastDot);
  const sig = rawToken.slice(lastDot + 1);

  // Reject immediately if the signature doesn't match — no DB call needed
  if (!id || !sig || sig.length !== 64) {
    return NextResponse.redirect(`${baseUrl}/signup?error=invalid_token`);
  }

  try {
    if (!verifyToken(id, sig)) {
      return NextResponse.redirect(`${baseUrl}/signup?error=invalid_token`);
    }
  } catch {
    // timingSafeEqual throws if buffers differ in length
    return NextResponse.redirect(`${baseUrl}/signup?error=invalid_token`);
  }

  try {
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    const docRef = db.collection("pendingSignups").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.redirect(`${baseUrl}/signup?error=invalid_token`);
    }

    const data = docSnap.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return NextResponse.redirect(`${baseUrl}/signup?error=expired_token`);
    }

    const { email, username, passwordEncrypted } = data;
    const password = decrypt(passwordEncrypted);

    // Double-click / retry protection
    try {
      await auth.getUserByEmail(email);
      await docRef.delete();
      return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
      emailVerified: true,
    });

    await db.collection("users").doc(userRecord.uid).set({
      email,
      displayName: username,
      createdAt: FieldValue.serverTimestamp(),
    });

    await docRef.delete();

    return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
  } catch (error: any) {
    console.error("[confirmSignup]", error?.code, error?.message);
    return NextResponse.redirect(`${baseUrl}/signup?error=server_error`);
  }
}
