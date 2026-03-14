"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CrossClusterLinks } from "@/components/CrossClusterLinks";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoadmapStatus = "completed" | "in-progress" | "planned";

type RoadmapItem = {
  title: string;
  description: string;
};

type RoadmapPhase = {
  id: string;
  period: string;
  title: string;
  owner: string;
  progress: number;
  status: RoadmapStatus;
  items: RoadmapItem[];
};

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "foundation",
    period: "Q2 2026",
    title: "Search & Discovery Foundation",
    owner: "Core Product",
    progress: 78,
    status: "in-progress",
    items: [
      {
        title: "Intent-aware search ranking",
        description: "Improve relevance with intent detection and weighted scoring for products, sellers, and requests.",
      },
      {
        title: "Smart empty states",
        description: "Show contextual suggestions and fallback paths when exact matches are unavailable.",
      },
      {
        title: "Recent + trending blending",
        description: "Combine personal recents with platform trends for faster discovery and repeat actions.",
      },
    ],
  },
  {
    id: "trust",
    period: "Q3 2026",
    title: "Trust, Compliance & Safety",
    owner: "Risk & Ops",
    progress: 42,
    status: "in-progress",
    items: [
      {
        title: "Verification flow v2",
        description: "Reduce onboarding friction while preserving strong identity checks for sellers and brokers.",
      },
      {
        title: "Dispute workflow upgrades",
        description: "Faster triage, clearer evidence collection, and better buyer/seller status visibility.",
      },
      {
        title: "Policy center refresh",
        description: "Simplified policy surfaces with clearer actions and transparent enforcement states.",
      },
    ],
  },
  {
    id: "seller-suite",
    period: "Q4 2026",
    title: "Seller Hub Expansion",
    owner: "Growth Team",
    progress: 18,
    status: "planned",
    items: [
      {
        title: "Listing templates",
        description: "Reusable templates for faster listing creation and better conversion consistency.",
      },
      {
        title: "Promotion controls",
        description: "Boost configuration, placement previews, and spend visibility in one panel.",
      },
      {
        title: "Revenue analytics",
        description: "Insights for top listings, conversion drop-offs, and category-level performance.",
      },
    ],
  },
  {
    id: "automation",
    period: "Q1 2027",
    title: "Automation & AI Assist",
    owner: "Platform Labs",
    progress: 5,
    status: "planned",
    items: [
      {
        title: "Draft assistant",
        description: "Suggest listing copy and metadata from short prompts or imported product links.",
      },
      {
        title: "Risk signal assistant",
        description: "Early fraud indicators with explainable flags for moderation and operations.",
      },
      {
        title: "Operator playbooks",
        description: "Reusable action flows for support teams handling disputes and escalations.",
      },
    ],
  },
];

const statusMeta: Record<
  RoadmapStatus,
  {
    label: string;
    dotClass: string;
    chipClass: string;
    Icon: typeof CheckCircle2;
  }
> = {
  completed: {
    label: "Completed",
    dotClass: "bg-emerald-400",
    chipClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    Icon: CheckCircle2,
  },
  "in-progress": {
    label: "In Progress",
    dotClass: "bg-sky-400",
    chipClass: "border-sky-400/40 bg-sky-400/10 text-sky-200",
    Icon: Wrench,
  },
  planned: {
    label: "Planned",
    dotClass: "bg-violet-300",
    chipClass: "border-violet-300/40 bg-violet-300/10 text-violet-100",
    Icon: CircleDashed,
  },
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function RoadmapPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-full max-w-[1100px] -translate-x-1/2 bg-gradient-to-b from-indigo-900/30 via-violet-900/15 to-transparent blur-[110px]" />
      </div>

      <main className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[300px_1fr] lg:gap-12">
        <div className="self-start space-y-6 lg:sticky lg:top-32">
          <Button
            variant="ghost"
            className="-ml-2 pl-0 text-zinc-500 transition-colors hover:bg-transparent hover:text-zinc-300"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-xl">
              <CalendarClock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-4xl">Roadmap</h1>
            <p className="text-base leading-relaxed text-zinc-400">
              Priorita, stato avanzamento e direzione prodotto. Aggiornata in tempo reale con focus su trust,
              performance e crescita seller.
            </p>
          </motion.div>

          <Squircle radius={24} smoothing={1} className="w-full" innerClassName="border border-white/8 bg-[#131316] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Focus Now</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Sparkles className="h-4 w-4 text-violet-200" />
                Search relevance upgrades
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                Trust & compliance hardening
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Rocket className="h-4 w-4 text-sky-200" />
                Seller tools acceleration
              </div>
            </div>
          </Squircle>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="w-full"
        >
          <Squircle
            radius={34}
            smoothing={1}
            className="w-full drop-shadow-2xl"
            innerClassName="overflow-hidden border border-white/10 bg-[#17171B]"
          >
            <div className="space-y-5 p-6 md:p-8 lg:p-10">
              {ROADMAP_PHASES.map((phase, index) => {
                const meta = statusMeta[phase.status];
                const Icon = meta.Icon;
                const progress = clampProgress(phase.progress);

                return (
                  <motion.section
                    key={phase.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.06 * index }}
                    className="rounded-3xl border border-white/7 bg-[#0F0F12] p-5 md:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} aria-hidden="true" />
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            {phase.period}
                          </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white md:text-2xl">{phase.title}</h2>
                        <p className="text-sm font-medium text-zinc-400">Owner: {phase.owner}</p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]",
                          meta.chipClass
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.09em] text-zinc-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {phase.items.map((item) => (
                        <article
                          key={`${phase.id}-${item.title}`}
                          className="rounded-2xl border border-white/6 bg-white/[0.02] p-4"
                        >
                          <h3 className="text-sm font-bold text-zinc-100">{item.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                        </article>
                      ))}
                    </div>
                  </motion.section>
                );
              })}

              <div className="rounded-2xl border border-white/7 bg-black/40 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Release Cadence</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-300">Bi-weekly shipping with monthly roadmap reviews.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300">
                    <Clock3 className="h-4 w-4 text-zinc-400" />
                    Last sync: today
                  </div>
                </div>
              </div>
            </div>
          </Squircle>

          <CrossClusterLinks variant="roadmap" className="mt-6" />
        </motion.div>
      </main>
    </div>
  );
}
