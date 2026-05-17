import { NextResponse } from "next/server";
import sharp from "sharp";

export async function GET() {
  try {
    const png = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}