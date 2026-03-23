import { redirect } from "next/navigation";
import { createSlug } from "../components/utilities/createSlug";

export default async function RandomPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/randomCall`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`randomCall failed: ${res.status}`);
  }

  const data = await res.json();
  const mediaTitle = data.title || data.name || "";
  redirect(`/random/${data.media_type}/${createSlug(mediaTitle)}/${data.id}`);
}