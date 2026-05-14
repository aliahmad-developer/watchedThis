import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";
import * as crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;

// Derive a 32-byte AES key from the HMAC secret (one env var, two uses)
function deriveKey(): Buffer {
  return crypto.scryptSync(HMAC_SECRET, "pendingSignup", 32);
}

function signToken(id: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(id).digest("hex");
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", deriveKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 },
    );
  }
  if (!HMAC_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 503 },
    );
  }

  let email: string, password: string, username: string;
  try {
    const body = await req.json();
    ({ email, password, username } = body ?? {});
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "email, password, and username are required" },
      { status: 400 },
    );
  }

  try {
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    try {
      await auth.getUserByEmail(email);
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    // id goes in Firestore; sig goes in the URL — neither alone is valid
    const id = crypto.randomBytes(32).toString("hex");
    const sig = signToken(id);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await db
      .collection("pendingSignups")
      .doc(id)
      .set({
        email,
        username,
        passwordEncrypted: encrypt(password),
        expiresAt,
        createdAt: Date.now(),
      });

    const confirmUrl = `${baseUrl}/api/auth/confirmSignUp?token=${id}.${sig}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your email address",
      html: getEmailVerificationTemplate(confirmUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[send-verification]", error?.code, error?.message);
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 },
    );
  }
}
