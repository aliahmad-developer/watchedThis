import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";
import * as crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

function signToken(id: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`${id}.${expiresAt}`)
    .digest("hex");
}

function encrypt(text: string): string {
  const key = crypto.scryptSync(HMAC_SECRET, "pendingSignup", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Invalid email.";
  return null;
}

function validateUsername(v: unknown): string | null {
  if (typeof v !== "string" || v.length < 3) return "Invalid username.";
  return null;
}

function validatePassword(v: unknown): string | null {
  if (typeof v !== "string" || v.length < 8) return "Weak password.";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username } = body;

    const emailErr = validateEmail(email);
    if (emailErr)
      return NextResponse.json({ error: emailErr }, { status: 400 });

    const usernameErr = validateUsername(username);
    if (usernameErr)
      return NextResponse.json({ error: usernameErr }, { status: 400 });

    const passwordErr = validatePassword(password);
    if (passwordErr)
      return NextResponse.json({ error: passwordErr }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    try {
      await auth.getUserByEmail(cleanEmail);
      return NextResponse.json(
        { error: "Account already exists." },
        { status: 409 },
      );
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    const id = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const sig = signToken(id, expiresAt);

    await db.collection("pendingSignups").doc(id).set({
      email: cleanEmail,
      username: cleanUsername,
      expiresAt,
      createdAt: Date.now(),
    });

    const confirmUrl = `${baseUrl}/api/auth/confirmSignUp?token=${id}.${sig}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: cleanEmail,
      subject: "Verify your email address",
      html: getEmailVerificationTemplate(confirmUrl),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 },
    );
  }
}
