import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import * as crypto from "crypto";

const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

function deriveKey(): Buffer {
  return crypto.scryptSync(HMAC_SECRET, "pendingSignup", 32);
}

function verifyToken(id: string, sig: string): boolean {
  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(id)
    .digest("hex");

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

/**
 * 🔥 IMPORTANT FIX:
 * DO NOT manually build cookie strings.
 * Use NextResponse cookies API instead.
 */
function setSessionCookie(res: NextResponse, sessionCookie: string) {
  res.cookies.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // ❗ STRICT breaks auth in production
    path: "/",
    maxAge: 60 * 60 * 24 * 5, // 5 days
  });
}

export async function GET(req: NextRequest) {
  if (!HMAC_SECRET) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=server_error`);
  }

  const rawToken = new URL(req.url).searchParams.get("token");

  if (!rawToken || !rawToken.includes(".")) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
  }

  const lastDot = rawToken.lastIndexOf(".");
  const id = rawToken.slice(0, lastDot);
  const sig = rawToken.slice(lastDot + 1);

  if (!id || !sig) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
  }

  if (!verifyToken(id, sig)) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
  }

  try {
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    const docRef = db.collection("pendingSignups").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.redirect(
        `${baseUrl}/user/profile?error=invalid_token`,
      );
    }

    const data = docSnap.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return NextResponse.redirect(
        `${baseUrl}/user/profile?error=expired_token`,
      );
    }

    const { email, username, passwordEncrypted } = data;
    const password = decrypt(passwordEncrypted);

    // If user already exists → just clean up
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

    // 🔥 STEP 1: create custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      throw new Error("Missing FIREBASE_API_KEY");
    }

    // 🔥 STEP 2: exchange for ID token
    const exchangeRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

    if (!exchangeRes.ok) {
      console.error("[auth] token exchange failed", exchangeRes.status);

      return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
    }

    const { idToken } = (await exchangeRes.json()) as {
      idToken: string;
    };

    await auth.verifyIdToken(idToken);

    // 🔥 STEP 3: SET COOKIE PROPERLY (NO MANUAL HEADER)
    const response = NextResponse.redirect(
      `${baseUrl}/user/profile?verified=true`,
    );

    setSessionCookie(response, idToken);

    return response;
  } catch (err) {
    console.error("[confirmSignUp] unexpected error", err);

    return NextResponse.redirect(`${baseUrl}/user/profile?error=server_error`);
  }
}
