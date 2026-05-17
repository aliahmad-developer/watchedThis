import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
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
// Add to BOTH routes temporarily
export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 },
    );
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await adminDb.collection("passwordResetTokens").doc(email).set({
      token: hashedToken, // only the hash is stored
      email,
      expiresAt,
      used: false,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`; // raw in the link

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Reset your password",
      html: getPasswordResetTemplate(resetLink),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[resetPassword]", err?.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
