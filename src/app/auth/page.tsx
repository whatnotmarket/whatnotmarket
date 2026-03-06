import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AuthRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    const raw = firstValue(value);
    if (raw) {
      params.set(key, raw);
    }
  });

  const query = params.toString();
  const target = query ? `/login?${query}` : "/login";
  redirect(target);
}

