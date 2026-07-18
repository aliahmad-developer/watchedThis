import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDailyMedia } from "@/lib/dailyMedia";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const today = new Date().toISOString().slice(0, 10);
  await getOrCreateDailyMedia(today);
  return NextResponse.json({ ok: true });
}