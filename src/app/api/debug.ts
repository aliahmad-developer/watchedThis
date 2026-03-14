import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length,
    serviceAccountStart: process.env.FIREBASE_SERVICE_ACCOUNT?.slice(0, 50),
    serviceAccountEnd: process.env.FIREBASE_SERVICE_ACCOUNT?.slice(-50),
  });
}