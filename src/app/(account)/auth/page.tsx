import Link from "next/link";
import { getRedirectPath } from "@/lib/app/seo/redirects";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = getRedirectPath({
    next: firstValue(resolvedSearchParams.next),
    callbackUrl: firstValue(resolvedSearchParams.callbackUrl),
    returnTo: firstValue(resolvedSearchParams.returnTo),
  });

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Authentication Is Being Redesigned</h1>
        <p className="mt-3 text-sm text-zinc-400">
          The old <code>/login</code> page has been removed. You can continue browsing as guest.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={nextPath}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Continue
          </Link>
          <Link
            href="/market"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            Go To Market
          </Link>
        </div>
      </div>
    </main>
  );
}

