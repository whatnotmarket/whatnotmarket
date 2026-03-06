"use client";

import { motion } from "framer-motion";
import { CheckCircle, Zap, Smartphone, Monitor, Sparkles, Globe } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/primitives/card";
import { Container } from "@/components/ui/primitives/container";

const CATEGORIES = [
  { id: "accounts", label: "Accounts", icon: CheckCircle },
  { id: "gaming", label: "Gaming", icon: Zap },
  { id: "telco", label: "Telco", icon: Smartphone },
  { id: "software", label: "Software", icon: Monitor },
  { id: "skins", label: "Skins", icon: Sparkles },
  { id: "crypto", label: "Crypto", icon: Globe },
];

export function CategoryExplore() {
  return (
    <Container className="px-4 space-y-14">
      <Card
        radius={40}
        smoothing={1}
        border="default"
        padding="lg"
        innerClassName="bg-[#0A0A0A] space-y-8"
        className="shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white">Explore by Category</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/category/${cat.id}`} className="block group h-full">
                <Card
                  as="div"
                  radius={24}
                  smoothing={0.8}
                  border="subtle"
                  className="h-40 transition-colors hover:stroke-white/[0.12]"
                  innerClassName="flex flex-col items-center justify-center gap-4 h-full bg-[#1C1C1E] group-hover:bg-[#222224] transition-colors"
                >
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300">
                    <cat.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">{cat.label}</span>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </Card>
    </Container>
  );
}
