import SpecificRandomMedia from "./pageClient";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ media_type: string; media_name_slug: string; id: string }>;
}) {
  const { media_type, media_name_slug, id } = await params;

  return (
    <SpecificRandomMedia
      key={id}
      media_type={media_type}
      media_name_slug={media_name_slug}
      id={id}
    />
  );
}