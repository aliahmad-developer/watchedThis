import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebaseAdmin";
import { getEmailVerificationTemplate } from "@/lib/emailTemplates";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const auth = getAuth(adminApp);
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_BASE_URL!;

    const user = await auth.getUserByEmail(email);
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
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
    console.error("[send-verification] full error:", JSON.stringify(error, null, 2));
    console.error("[send-verification] message:", error.message);
    console.error("[send-verification] code:", error.code);
    return NextResponse.json(
      { error: error.message || "Failed to send verification email" },
      { status: 500 }
    );
  }
  }
