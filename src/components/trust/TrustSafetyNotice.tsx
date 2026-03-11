"use client";

import type { ReactNode } from "react";

type TrustSafetyNoticeProps = {
  title: string;
  description: string;
  tone?: "info" | "warning" | "critical";
  action?: ReactNode;
};

const toneStyles: Record<NonNullable<TrustSafetyNoticeProps["tone"]>, string> = {
  info: "border-indigo-400/35 bg-indigo-500/10 text-indigo-100",
  warning: "border-amber-300/45 bg-amber-500/10 text-amber-100",
  critical: "border-rose-300/55 bg-rose-500/10 text-rose-100",
};

export function TrustSafetyNotice({
  title,
  description,
  tone = "warning",
  action,
}: TrustSafetyNoticeProps) {
  return (
    <div
      role="status"
      className={`rounded-2xl border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${toneStyles[tone]}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-95">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
