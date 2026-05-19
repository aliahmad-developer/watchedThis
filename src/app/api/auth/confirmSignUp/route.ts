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

function buildSessionCookie(token: string): string {
  return [
    `__session=${token}`,
    `Path=/`,
    `Max-Age=3600`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
  ].join("; ");
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

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

  if (!id || !sig || sig.length !== 64) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
  }

  try {
    if (!verifyToken(id, sig)) {
      return NextResponse.redirect(
        `${baseUrl}/user/profile?error=invalid_token`,
      );
    }
  } catch {
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

    // Double-click / retry protection — user already exists
    try {
      await auth.getUserByEmail(email);
      await docRef.delete();
      // User exists — redirect to profile as already confirmed, set no new cookie
      // (they will need to sign in normally if they have no active session)
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

    // FIX: Create a custom token, then sign it in via the REST API to get an
    // ID token we can store as an HttpOnly cookie — never expose the custom
    // token in the URL where it would appear in logs and browser history.
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Exchange custom token → ID token via Firebase REST API
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey)
      throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");

    const exchangeRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );

    if (!exchangeRes.ok) {
      // Can't set the session cookie — redirect to profile page so the user
      // can sign in manually. Account was created successfully.
      console.error(
        "[confirmSignUp] token exchange failed:",
        exchangeRes.status,
      );
      return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
    }

    const { idToken } = (await exchangeRes.json()) as { idToken: string };

    // Verify the ID token we just got (confirms it's well-formed and not tampered)
    await auth.verifyIdToken(idToken, true);

    const response = NextResponse.redirect(
      `${baseUrl}/user/profile?verified=true`,
    );
    response.headers.set("Set-Cookie", buildSessionCookie(idToken));
    return response;
  } catch {
    console.error("[confirmSignUp] unexpected error");
    return NextResponse.redirect(`${baseUrl}/user/profile?error=server_error`);
  }
}
