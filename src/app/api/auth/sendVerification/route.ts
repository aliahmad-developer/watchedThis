import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebaseAdmin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";
import * as crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;

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

// ─── Input validation ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Please enter a valid email address.";
  if (v.length > 254) return "Email address is too long.";
  return null;
}

function validateUsername(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return "Username is required.";
  const u = v.trim();
  if (u.length < 3) return "Username must be at least 3 characters.";
  if (u.length > 30) return "Username must be 30 characters or fewer.";
  if (!/^[a-zA-Z0-9_-]+$/.test(u))
    return "Username may only contain letters, numbers, underscores, and hyphens.";
  return null;
}

function validatePassword(v: unknown): string | null {
  if (typeof v !== "string" || !v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (v.length > 128) return "Password is too long.";
  if (!/[0-9]/.test(v)) return "Password must include a number.";
  if (!/[^a-zA-Z0-9]/.test(v))
    return "Password must include a special character.";
  return null;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 503 },
    );
  }
  if (!HMAC_SECRET) {
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

  const { email, password, username } = (body ?? {}) as Record<string, unknown>;

  // Validate all fields before touching Firebase
  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const usernameErr = validateUsername(username);
  if (usernameErr)
    return NextResponse.json({ error: usernameErr }, { status: 400 });

  const passwordErr = validatePassword(password);
  if (passwordErr)
    return NextResponse.json({ error: passwordErr }, { status: 400 });

  const cleanEmail = (email as string).trim().toLowerCase();
  const cleanUsername = (username as string).trim();

  try {
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    try {
      await auth.getUserByEmail(cleanEmail);
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    const id = crypto.randomBytes(32).toString("hex");
    const sig = signToken(id);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await db
      .collection("pendingSignups")
      .doc(id)
      .set({
        email: cleanEmail,
        username: cleanUsername,
        passwordEncrypted: encrypt(password as string),
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
  } catch {    
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 },
    );
  }
}
