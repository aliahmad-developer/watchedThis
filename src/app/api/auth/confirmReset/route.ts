import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

function getHmacSecret(): string {
  const secret = process.env.RANDOM_HMAC_SECRET;
  if (!secret) throw new Error("RANDOM_HMAC_SECRET is not set.");
  return secret;
}

function hashToken(token: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(token).digest("hex");
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Invalid password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must include a special character.";
  return null;
}

function validateToken(token: unknown): string | null {
  if (typeof token !== "string" || !token.trim()) return "Missing or invalid token.";
  if (token.length > 512) return "Invalid token.";
  return null;
}

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
  try {
    getHmacSecret();
  } catch {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token, newPassword } = body as { token?: unknown; newPassword?: unknown };

  const tokenError = validateToken(token);
  if (tokenError) return NextResponse.json({ error: tokenError }, { status: 400 });

  const passwordError = validatePassword(newPassword);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const hashedToken = hashToken((token as string).trim());

  try {
    const admin = createAdminClient();

    const { data: resetRow } = await admin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", hashedToken)
      .maybeSingle();

    if (!resetRow) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    if (resetRow.used) {
      return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
    }

    if (new Date(resetRow.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired." }, { status: 400 });
    }

    const user = await findUserByEmail(resetRow.email);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 400 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword as string,
    });
    if (updateError) throw updateError;

    await admin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", hashedToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[confirmReset] error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}