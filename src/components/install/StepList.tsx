"use client";

import { cn } from "@/lib/utils";

type StepListProps = {
  title: string;
  steps: string[];
  className?: string;
};

export function StepList({ title, steps, className }: StepListProps) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-[#121225] p-5", className)}>
      <h2 className="text-base font-bold text-white">{title}</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-3">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#8f84dc]/45 bg-[#27214f] text-xs font-bold text-[#f4f2ff]">
              {index + 1}
            </span>
            <p className="pt-0.5 text-sm leading-relaxed text-[#d3ceef]">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
