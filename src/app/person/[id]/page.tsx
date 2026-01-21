import PersonPageClient from "./PersonPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the params promise
  const { id } = await params;
  
  return <PersonPageClient id={id} />;
}