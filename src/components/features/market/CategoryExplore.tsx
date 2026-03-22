"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Zap, Smartphone, Monitor, Sparkles, Globe, LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/shared/ui/primitives/card";
import { Container } from "@/components/shared/ui/primitives/container";
import { createClient } from "@/lib/infra/supabase/supabase";

// Map string icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  CheckCircle,
  Zap,
  Smartphone,
  Monitor,
  Sparkles,
  Globe,
};

interface Category {
  id: string;
  name: string;
  icon: string;
}

export function CategoryExplore() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_verified", true)
        .order("name", { ascending: true });

      if (!error && data) {
        // Sort specifically to match the desired order if needed, or just use DB order
        // For now, let's keep the specific order if the IDs match, otherwise append
        const desiredOrder = ["accounts", "gaming", "telco", "software", "skins", "crypto"];
        const sortedData = data.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.id);
          const indexB = desiredOrder.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedData);
      }
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  if (isLoading) {
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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-[#1C1C1E] rounded-[24px] animate-pulse" />
            ))}
          </div>
        </Card>
      </Container>
    );
  }

  if (categories.length === 0) return null;

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
          {categories.map((cat, i) => {
            const Icon = ICON_MAP[cat.icon] || Globe;
            return (
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
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">{cat.name}</span>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </Container>
  );
}


