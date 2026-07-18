import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import * as crypto from "crypto";

const HMAC_SECRET = process.env.RANDOM_HMAC_SECRET!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

function deriveKey(): Buffer {
  return crypto.scryptSync(HMAC_SECRET, "pendingSignup", 32);
}

function verifyToken(id: string, sig: string): boolean {
  const expected = crypto.createHmac("sha256", HMAC_SECRET).update(id).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
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

  if (!id || !sig || !verifyToken(id, sig)) {
    return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
  }

  try {
    const admin = createAdminClient();

    const { data: pending } = await admin
      .from("pending_signups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!pending) {
      return NextResponse.redirect(`${baseUrl}/user/profile?error=invalid_token`);
    }

    if (Date.now() > pending.expires_at) {
      await admin.from("pending_signups").delete().eq("id", id);
      return NextResponse.redirect(`${baseUrl}/user/profile?error=expired_token`);
    }

    const { email, username, password_encrypted } = pending;
    const password = decrypt(password_encrypted);

    // If user already exists — clean up and redirect
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      await admin.from("pending_signups").delete().eq("id", id);
      return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip Supabase's own verification — we already verified via our custom flow
      user_metadata: { full_name: username },
    });

    if (createError || !created.user) {
      throw createError ?? new Error("User creation failed");
    }

    await admin.from("pending_signups").delete().eq("id", id);

    // Log the user in — this sets the session cookie via the route handler's
    // cookie adapter (middleware picks it up on next request)
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("[confirmSignUp] auto sign-in failed", signInError);
      // Account exists and is verified — just skip auto-login
      return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
    }

    return NextResponse.redirect(`${baseUrl}/user/profile?verified=true`);
  } catch (err) {
    console.error("[confirmSignUp] unexpected error", err);
    return NextResponse.redirect(`${baseUrl}/user/profile?error=server_error`);
  }
}