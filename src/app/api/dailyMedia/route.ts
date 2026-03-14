import { NextResponse } from "next/server";

export async function GET() {
  console.log("[dailyMedia] GET hit");
  console.log("[dailyMedia] env check:", {
    projectId:    process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail:  process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length,
    privateKeyStart:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.slice(0, 50),
    privateKeyEnd:    process.env.FIREBASE_ADMIN_PRIVATE_KEY?.slice(-50),
  });

  return NextResponse.json({ success: true, test: "working" });
}