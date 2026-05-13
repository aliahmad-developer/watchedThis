import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebaseAdmin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 },
    );
  }

  let email: string;
  try {
    const body = await req.json();
    email = body?.email;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const auth = getAuth(adminApp);
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_BASE_URL || "https://watchedthis.com";

    const user = await auth.getUserByEmail(email);
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    const verifyLink = await auth.generateEmailVerificationLink(email, {
      url: `${baseUrl}/user/profile`,
      handleCodeInApp: false,
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your email address",
      html: getEmailVerificationTemplate(verifyLink),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[send-verification]", error?.code, error?.message);

    const STATUS_MAP: Record<string, number> = {
      "auth/user-not-found": 404,
      "auth/invalid-email": 400,
      "auth/email-not-found": 404,
      "auth/invalid-api-key": 503,
      "app/no-app": 503,
    };

    const status = STATUS_MAP[error?.code] ?? 500;
    const message =
      error?.code === "auth/user-not-found" ||
      error?.code === "auth/email-not-found"
        ? "No account found with this email address."
        : error?.code === "auth/invalid-email"
          ? "Invalid email address."
          : "Failed to send verification email.";

    return NextResponse.json({ error: message }, { status });
  }
}
