"use client";

import { Navbar } from "@/components/app/navigation/Navbar";
import { CrossClusterLinks } from "@/components/app/seo/CrossClusterLinks";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { Card } from "@/components/shared/ui/primitives/card";
import { Input } from "@/components/shared/ui/primitives/input";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/shared/ui/tabs";
import { cn } from "@/lib/core/utils/utils";
import { motion } from "framer-motion";
import {
ArrowLeft,
ChevronDown,
HelpCircle,
Search,
ShoppingBag,
Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useMemo,useState } from "react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_GROUPS: Record<"buyer" | "seller", FAQItem[]> = {
  buyer: [
    {
      id: "buyer-how",
      question: "Come funziona OpenlyMarket?",
      answer:
        "OpenlyMarket e un marketplace request-first: pubblichi una richiesta e ricevi offerte mirate da seller verificati.",
    },
    {
      id: "buyer-safe",
      question: "I miei fondi sono al sicuro?",
      answer:
        "Si. I fondi restano in escrow e vengono rilasciati solo dopo conferma di consegna o esito positivo del flusso di verifica.",
    },
    {
      id: "buyer-external",
      question: "Posso acquistare prodotti da altri siti?",
      answer:
        "Si, con Buy with Crypto: condividi il link del prodotto e gestisci l'acquisto in modo protetto tramite la piattaforma.",
    },
    {
      id: "buyer-crypto",
      question: "Quali criptovalute sono supportate?",
      answer:
        "Supportiamo le principali crypto disponibili nel checkout e nelle opzioni di pagamento abilitate sulla piattaforma.",
    },
    {
      id: "buyer-dispute",
      question: "Cosa succede se il seller non consegna?",
      answer:
        "Puoi aprire una disputa. I fondi restano protetti in escrow finche il caso non viene risolto.",
    },
  ],
  seller: [
    {
      id: "seller-start",
      question: "Come divento venditore?",
      answer:
        "Completi l'onboarding seller e i requisiti di fiducia richiesti dalla piattaforma per iniziare a pubblicare offerte.",
    },
    {
      id: "seller-bond",
      question: "Cos'e il Vendor Bond?",
      answer:
        "E un deposito di garanzia usato per aumentare affidabilita e tutela delle transazioni.",
    },
    {
      id: "seller-fees",
      question: "Quanto costa vendere?",
      answer:
        "Dipende dal piano e dalle commissioni transazionali. I costi attivi sono sempre visibili prima della conferma.",
    },
    {
      id: "seller-promoted",
      question: "Come funzionano le promozioni listing?",
      answer:
        "Con Promote Listings puoi aumentare visibilita delle tue offerte e migliorare la scoperta nelle aree ad alto traffico.",
    },
    {
      id: "seller-payout",
      question: "Quando ricevo i pagamenti?",
      answer:
        "I fondi vengono rilasciati dopo completamento del flusso escrow secondo stato ordine e policy.",
    },
  ],
};

const FAQ_TAB_LABELS: Record<"buyer" | "seller", string> = {
  buyer: "Per i Buyer",
  seller: "Per i Seller",
};

export function FaqPageClient({ nonce }: { nonce: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buyer" | "seller">("buyer");
  const [query, setQuery] = useState("");
  const [openItemId, setOpenItemId] = useState<string>("buyer-how");

  const currentFaqs = FAQ_GROUPS[activeTab];
  const filteredFaqs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return currentFaqs;
    return currentFaqs.filter(
      (item) =>
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
    );
  }, [currentFaqs, query]);

  const faqStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Object.values(FAQ_GROUPS)
        .flat()
        .map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
    }),
    []
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      <Script
        id="faq-schema"
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-teal-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1000px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button
              variant="ghost"
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                FAQ
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Risposte rapide su acquisti, vendite, escrow e sicurezza.
              </p>
            </motion.div>

            <div className="bg-[#1C1C1E] p-4 rounded-xl border border-white/5 space-y-3 mt-8">
              <p className="text-sm text-zinc-400">Non trovi la risposta?</p>
              <Button
                onClick={() => router.push("/contact")}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
              >
                Contatta Supporto
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full space-y-8"
          >
            <Squircle
              radius={32}
              smoothing={1}
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cerca una domanda..."
                    className="pl-10"
                  />
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    const next = value as "buyer" | "seller";
                    setActiveTab(next);
                    setOpenItemId(FAQ_GROUPS[next][0]?.id || "");
                  }}
                  className="space-y-6"
                >
                  <TabsList variant="line" className="w-full justify-start bg-transparent p-0">
                    <TabsTrigger value="buyer" className="h-10 px-3 text-zinc-400 data-active:text-white">
                      <ShoppingBag className="mr-1 h-4 w-4" />
                      {FAQ_TAB_LABELS.buyer}
                    </TabsTrigger>
                    <TabsTrigger value="seller" className="h-10 px-3 text-zinc-400 data-active:text-white">
                      <Store className="mr-1 h-4 w-4" />
                      {FAQ_TAB_LABELS.seller}
                    </TabsTrigger>
                  </TabsList>

                  {(Object.keys(FAQ_GROUPS) as Array<"buyer" | "seller">).map((group) => (
                    <TabsContent key={group} value={group} className="space-y-3 min-h-[320px]">
                      {filteredFaqs.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                          Nessun risultato per la ricerca corrente.
                        </div>
                      ) : (
                        filteredFaqs.map((item) => {
                          const isOpen = openItemId === item.id;
                          return (
                            <Card
                              key={item.id}
                              radius={14}
                              smoothing={1}
                              border="subtle"
                              innerClassName="bg-[#18181A] p-0"
                              className="overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenItemId((prev) => (prev === item.id ? "" : item.id))}
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                              >
                                <span className="text-sm font-bold text-white">{item.question}</span>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-zinc-400 transition-transform duration-200",
                                    isOpen && "rotate-180 text-white"
                                  )}
                                />
                              </button>
                              <motion.div
                                initial={false}
                                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-400">{item.answer}</p>
                              </motion.div>
                            </Card>
                          );
                        })
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </Squircle>

            <CrossClusterLinks variant="faq" className="mt-6" />
          </motion.div>
        </div>
      </main>
    </div>
  );
}


