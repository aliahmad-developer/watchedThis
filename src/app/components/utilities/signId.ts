import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.RANDOM_HMAC_SECRET;
if (!SECRET) {
  throw new Error("RANDOM_HMAC_SECRET is not set in environment variables");
}
const KEY = SECRET;

type Payload = {
  id: number;
  media_type: string;
  slug: string;
};

export function signToken(payload: Payload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const sig = createHmac("sha256", KEY).update(encoded).digest("base64url");

  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): Payload | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const expected = createHmac("sha256", KEY)
    .update(encoded)
    .digest("base64url");

  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    return JSON.parse(json) as Payload;
  } catch {
    return null;
  }
}
