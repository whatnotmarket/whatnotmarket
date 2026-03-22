"use client";

import Link from "next/link";

type RelatedLinkItem = {
  href: string;
  label: string;
};

type RelatedLinksProps = {
  title: string;
  links: RelatedLinkItem[];
  className?: string;
};

export function RelatedLinks({ title, links, className }: RelatedLinksProps) {
  const unique = Array.from(new Map(links.map((item) => [item.href, item])).values());
  if (!unique.length) return null;

  return (
    <aside className={className}>
      <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">{title}</h2>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {unique.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
