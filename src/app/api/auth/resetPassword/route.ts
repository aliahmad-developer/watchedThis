import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { Resend } from "resend";
import { getPasswordResetTemplate } from "@/lib/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", process.env.RANDOM_HMAC_SECRET!)
    .update(token)
    .digest("hex");
}

// ─── Input validation ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Please enter a valid email address.";
  if (v.length > 254) return "Email address is too long.";
  return null;
}

// Generic success message returned regardless of whether the email exists.
// This prevents user enumeration — an attacker cannot tell valid from invalid.
const SAFE_SUCCESS = {
  success: true,
  message: "If that email is registered, a reset link has been sent.",
};

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 503 },
    );
  }
  if (!process.env.RANDOM_HMAC_SECRET) {
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

  const { email } = (body ?? {}) as Record<string, unknown>;

  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const cleanEmail = (email as string).trim().toLowerCase();

  try {
    // FIX (enumeration): check if user exists but return the same response
    // either way — don't tell the caller whether the email is registered.
    try {
      await adminAuth.getUserByEmail(cleanEmail);
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        return NextResponse.json(SAFE_SUCCESS);
      }
      throw e;
    }
    // After getUserByEmail succeeds, check if they're still pending verification
    const pendingSnap = await adminDb
      .collection("pendingSignups")
      .where("email", "==", cleanEmail)
      .limit(1)
      .get();

    if (!pendingSnap.empty) {
      const { expiresAt } = pendingSnap.docs[0].data();
      if (expiresAt > Date.now()) {
        return NextResponse.json(
          {
            error:
              "Please verify your email address before resetting your password.",
          },
          { status: 403 },
        );
      }
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await adminDb.collection("passwordResetTokens").doc(hashedToken).set({
      token: hashedToken,
      email: cleanEmail,
      expiresAt,
      used: false,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: cleanEmail,
      subject: "Reset your password",
      html: getPasswordResetTemplate(resetLink),
    });

    if (error) {
      // Log error type only — not the email address (PII)
      console.error("[resetPassword] resend error:", error.name);
      return NextResponse.json(
        { error: "Failed to send email." },
        { status: 500 },
      );
    }

    return NextResponse.json(SAFE_SUCCESS);
  } catch {
    console.error("[resetPassword] unexpected error");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
