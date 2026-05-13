import { NextResponse } from "next/server";
import { signToken } from "@/app/components/utilities/signId";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const { id, media_type, title, name } = body;

    if (typeof id !== "number" || !media_type) {
      return NextResponse.json(
        { error: "Invalid id or media_type" },
        { status: 400 },
      );
    }

    const slug =
      (title || name || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") || "media";

    const token = signToken({
      id,
      media_type,
      slug,
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("SIGN ROUTE ERROR:", err);

    return NextResponse.json(
      { error: "Failed to sign", detail: String(err) },
      { status: 500 },
    );
  }
}
