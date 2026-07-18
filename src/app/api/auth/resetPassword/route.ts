import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Please enter a valid email address.";
  if (v.length > 254) return "Email address is too long.";
  return null;
}

const SAFE_SUCCESS = {
  success: true,
  message: "If that email is registered, a reset link has been sent.",
};

async function findUserByEmail(email: string) {
  const supabase = createAdminClient();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page++;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }
  if (!process.env.RANDOM_HMAC_SECRET) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = (body ?? {}) as Record<string, unknown>;
  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const cleanEmail = (email as string).trim().toLowerCase();

  try {
    const supabase = createAdminClient();

    const existingUser = await findUserByEmail(cleanEmail);
    if (!existingUser) {
      return NextResponse.json(SAFE_SUCCESS);
    }

    const { data: pending } = await supabase
      .from("pending_signups")
      .select("expires_at")
      .eq("email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (pending && pending.expires_at > Date.now()) {
      return NextResponse.json(
        { error: "Please verify your email address before resetting your password." },
        { status: 403 },
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error: insertError } = await supabase.from("password_reset_tokens").upsert({
      token: hashedToken,
      email: cleanEmail,
      expires_at: expiresAt.toISOString(),
      used: false,
    });
    if (insertError) throw insertError;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: cleanEmail,
      subject: "Reset your password",
      html: getPasswordResetTemplate(resetLink),
    });

    if (error) {
      console.error("[resetPassword] resend error:", error.name);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
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