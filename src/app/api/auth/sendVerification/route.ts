import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";
import * as crypto from "crypto";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

function getHmacSecret(): string {
  const secret = process.env.RANDOM_HMAC_SECRET;
  if (!secret) {
    throw new Error("RANDOM_HMAC_SECRET is not set");
  }
  return secret;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

function signToken(id: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(id).digest("hex");
}

function encrypt(text: string): string {
  const key = crypto.scryptSync(getHmacSecret(), "pendingSignup", 32);
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

// Supabase Admin has no getUserByEmail() — paginate + filter.
// Fine for small/medium user bases; if you cross tens of thousands of users,
// switch this to a `profiles` table (email column, unique index) synced via
// a Postgres trigger on auth.users insert, and query that table instead.
async function findUserByEmail(email: string) {
  const supabase = createAdminClient();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page++;
  }
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

    const supabase = createAdminClient();
    const resend = getResendClient();

    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: "Account already exists." },
        { status: 409 },
      );
    }

    const { data: existingPending } = await supabase
      .from("pending_signups")
      .select("*")
      .eq("email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existingPending && existingPending.expires_at > Date.now()) {
      const sig = signToken(existingPending.id);
      const confirmUrl = `${baseUrl}/api/auth/confirmSignUp?token=${existingPending.id}.${sig}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: cleanEmail,
        subject: "Verify your email address",
        html: getEmailVerificationTemplate(confirmUrl),
      });

      return NextResponse.json({ unverifiedResent: true });
    }

    const id = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const sig = signToken(id);
    const passwordEncrypted = encrypt(password);

    const { error: insertError } = await supabase
      .from("pending_signups")
      .upsert({
        id,
        email: cleanEmail,
        username: cleanUsername,
        password_encrypted: passwordEncrypted,
        expires_at: expiresAt,
        created_at: Date.now(),
      });
    if (insertError) throw insertError;

    const confirmUrl = `${baseUrl}/api/auth/confirmSignUp?token=${id}.${sig}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: cleanEmail,
      subject: "Verify your email address",
      html: getEmailVerificationTemplate(confirmUrl),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[signup] unexpected error", err);
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 },
    );
  }
}
