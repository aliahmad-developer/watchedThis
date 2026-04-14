import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebaseAdmin";
import { getPasswordResetTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const auth = getAuth(adminApp);
    const baseUrl = "http://localhost:3000";
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${baseUrl}/reset-password`,
      handleCodeInApp: true,
    });

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Reset your password",
      html: getPasswordResetTemplate(resetLink),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[reset-password]", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}