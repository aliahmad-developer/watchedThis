// src/app/api/find/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Hello world" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ data: body });
}
