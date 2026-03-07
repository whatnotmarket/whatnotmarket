import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Car,
  Gem,
  Globe,
  HandCoins,
  Lock,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Escrow for Brokers | Whatnot Market",
  description:
    "Manage secure broker transactions between buyers and sellers with protected commissions, transparent escrow flow, and trusted infrastructure.",
  openGraph: {
    title: "Escrow for Brokers | Whatnot Market",
    description:
      "A premium escrow solution for brokers managing buyer-seller deals with secure commission distribution.",
    type: "website",
    url: "/broker",
  },
};

const sectionClass =
  "rounded-[28px] border border-white/10 bg-[#111214] p-5 md:p-8 shadow-[0_14px_50px_rgba(0,0,0,0.32)]";

const benefits = [
  {
    title: "Discreet transaction management",
    description:
      "Manage buyer and seller relationships privately and securely.",
    icon: Lock,
  },
  {
    title: "Full transaction control",
    description:
      "Start, monitor and manage the entire escrow transaction from start to completion.",
    icon: Network,
  },
  {
    title: "Secure broker commissions",
    description:
      "Broker fees can be included and protected within the escrow transaction.",
    icon: HandCoins,
  },
  {
    title: "Low and transparent fees",
    description:
      "Competitive escrow pricing designed for brokers and marketplaces.",
    icon: BadgeCheck,
  },
  {
    title: "Reduced fraud risk",
    description:
      "Our secure platform reduces the risk of payment fraud or disputes.",
    icon: ShieldCheck,
  },
  {
    title: "Trusted infrastructure",
    description:
      "Our escrow technology is designed for reliability, transparency and global transactions.",
    icon: Globe,
  },
] as const;

const brokerSteps = [
  {
    title: "Buyer, Seller and Broker agree to terms",
    description:
      "The broker initiates a three-party escrow transaction and defines the terms of the agreement.",
  },
  {
    title: "Buyer sends payment",
    description:
      "The buyer transfers the payment to the escrow account. Funds are secured and all parties are notified.",
  },
  {
    title: "Seller delivers the asset",
    description:
      "The seller delivers the product, service, or digital asset according to the agreement.",
  },
  {
    title: "Buyer reviews and approves",
    description:
      "The buyer confirms that the transaction conditions have been fulfilled.",
  },
  {
    title: "Funds are released",
    description:
      "The escrow system releases funds to the seller and broker commission is distributed.",
  },
] as const;

const useCases = [
  { label: "Domain brokers", icon: Globe },
  { label: "Business brokers", icon: Building2 },
  { label: "Vehicle brokers", icon: Car },
  { label: "Luxury asset brokers", icon: Gem },
  { label: "Digital asset brokers", icon: Wallet },
] as const;

function CTAButtons({
  primaryLabel,
  secondaryLabel,
}: {
  primaryLabel: string;
  secondaryLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild className="h-10 bg-white text-black hover:bg-zinc-200">
        <Link href="/market">{primaryLabel}</Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="h-10 border-zinc-600 text-white hover:bg-white/10"
      >
        <Link href="/contact">{secondaryLabel}</Link>
      </Button>
    </div>
  );
}

export default function BrokerPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-8 md:px-6 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#161a24] via-[#12131a] to-[#0e0f14] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-10">
          <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 max-w-4xl space-y-4">
            <Badge className="bg-white/10 text-white">
              Built for broker-led transactions
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Escrow for Brokers
            </h1>
            <p className="max-w-3xl text-base text-zinc-300 sm:text-lg">
              Our escrow platform allows brokers to securely manage transactions
              between buyers and sellers while ensuring their commission is
              protected.
            </p>
            <p className="text-sm text-zinc-400">
              Our three-party escrow transactions allow brokers to start,
              manage, and complete deals with full transparency and security.
            </p>
            <CTAButtons
              primaryLabel="Start Broker Transaction"
              secondaryLabel="Contact Sales"
            />
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-4")}>
          <h2 className="text-2xl font-bold text-white">
            Our escrow service is tailored for brokers
          </h2>
          <div className="space-y-3 text-zinc-300">
            <p>
              Our platform allows brokers to facilitate transactions between
              buyers and sellers while acting as a neutral and secure payment
              intermediary.
            </p>
            <p>
              As a regulated online escrow service, we help protect both
              parties while ensuring brokers can manage deals efficiently and
              securely.
            </p>
            <p>
              La nostra piattaforma è progettata per semplificare la gestione
              delle transazioni complesse e ad alto valore.
            </p>
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <h2 className="text-2xl font-bold text-white">Benefits for brokers</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-[#0d0f12] ring-white/10">
                <CardHeader>
                  <benefit.icon className="mb-2 h-5 w-5 text-blue-300" />
                  <CardTitle className="text-base text-white">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-400">
                  {benefit.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <h2 className="text-2xl font-bold text-white">
            How escrow works for brokers
          </h2>
          <div className="grid gap-4 lg:grid-cols-5">
            {brokerSteps.map((step, index) => (
              <Card key={step.title} className="bg-[#0d0f12] ring-white/10">
                <CardHeader className="space-y-3 pb-1">
                  <Badge
                    variant="secondary"
                    className="w-fit bg-white/10 text-zinc-200"
                  >
                    Step {index + 1}
                  </Badge>
                  <CardTitle className="text-sm text-white">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400">
                  {step.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-4")}>
          <h2 className="text-2xl font-bold text-white">
            Three-party escrow transactions
          </h2>
          <p className="text-zinc-300">
            Our broker escrow model supports three-party transactions involving
            buyer, seller and broker.
          </p>
          <p className="text-zinc-300">
            This ensures that broker commissions can be securely included and
            automatically distributed once the transaction is completed.
          </p>
        </section>

        <section className={cn(sectionClass, "space-y-5")}>
          <h2 className="text-2xl font-bold text-white">
            Common broker transactions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {useCases.map((item) => (
              <Card key={item.label} className="bg-[#0d0f12] ring-white/10">
                <CardHeader className="pb-2">
                  <item.icon className="mb-1 h-5 w-5 text-blue-300" />
                  <CardTitle className="text-sm text-white">
                    {item.label}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className={cn(sectionClass, "space-y-4")}>
          <Card className="bg-zinc-900/70 ring-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Start managing broker transactions securely
              </CardTitle>
              <CardDescription className="text-zinc-300">
                Use our escrow platform to facilitate transactions while
                protecting your broker commissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CTAButtons
                primaryLabel="Start Broker Transaction"
                secondaryLabel="Contact Broker Team"
              />
            </CardContent>
          </Card>
        </section>

        <section className="pb-2">
          <p className="text-xs text-zinc-500">
            Broker transactions are subject to verification checks and platform
            policy review to maintain secure transaction standards.
          </p>
        </section>
      </main>
    </div>
  );
}
