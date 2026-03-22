import { notFound, redirect } from "next/navigation";

type ListingSlugPageProps = {
  params: Promise<{ slug: string }>;
};

const UUID_AT_END_REGEX =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function decodeSlug(raw: string): string {
  let value = String(raw || "").trim();

  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  return value.trim();
}

export default async function ListingSlugPage({ params }: ListingSlugPageProps) {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const match = decoded.match(UUID_AT_END_REGEX);

  if (!match) {
    notFound();
  }

  const requestId = match[1].toLowerCase();
  redirect(`/requests/${requestId}`);
}

