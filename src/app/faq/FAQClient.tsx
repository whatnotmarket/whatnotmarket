"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  HelpCircle, 
  ChevronDown, 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Wallet,
  Search
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyMap } from "@/lib/copy-system";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQItemComponent = ({ item }: { item: FAQItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className={cn("font-medium transition-colors", isOpen ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
          {item.question}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180 text-white")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-zinc-400 leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function FAQClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buyer" | "seller">("buyer");
  
  const header = copy['header'] || {};
  const tabs = copy['tabs'] || {};

  // Construct FAQs from flat copy map
  const buyerFAQs: FAQItem[] = [
    {
        question: copy['buyer_q1']?.question || "Come funziona SwaprMarket?",
        answer: copy['buyer_q1']?.answer || "SwaprMarket è un marketplace 'Request-First'. Invece di sfogliare infinite liste di prodotti, pubblichi una richiesta specifica ('Cerco un account Netflix', 'Cerco uno script Python') e i venditori qualificati ti inviano offerte su misura."
    },
    {
        question: copy['buyer_q2']?.question || "I miei fondi sono al sicuro?",
        answer: copy['buyer_q2']?.answer || "Assolutamente sì. Utilizziamo un sistema di Escrow rigoroso. Quando paghi, i fondi vengono bloccati in un conto sicuro e vengono rilasciati al venditore solo dopo che hai confermato la ricezione del prodotto o servizio."
    },
    // Add more static fallbacks if needed, matching original file or seed
    {
        question: "Posso acquistare prodotti da altri siti (es. Amazon)?",
        answer: "Sì, grazie alla nostra funzione 'Smart Search'. Incolla il link del prodotto che desideri da qualsiasi e-commerce, paga in crypto, e noi lo acquisteremo e spediremo per te, proteggendo la tua privacy."
    },
    {
        question: "Quali criptovalute accettate?",
        answer: "Supportiamo le principali criptovalute per garantire flessibilità e privacy: Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Monero (XMR) e Tether (USDT)."
    },
    {
        question: "Cosa succede se il venditore non consegna?",
        answer: "Se il venditore non consegna entro i termini stabiliti o il prodotto non è conforme, puoi aprire una disputa. I fondi in Escrow verranno congelati e, se verifichiamo l'inadempienza, ti verranno rimborsati al 100%."
    }
  ];

  const sellerFAQs: FAQItem[] = [
    {
        question: copy['seller_q1']?.question || "Come divento un venditore?",
        answer: copy['seller_q1']?.answer || "Per diventare venditore devi superare una procedura di verifica. È richiesta una fee d'ingresso una tantum di $20 e, per i livelli superiori, un deposito di sicurezza (Vendor Bond) per garantire la tua affidabilità."
    },
    // Add more static fallbacks
    {
        question: "Cos'è il Vendor Bond?",
        answer: "Il Vendor Bond è un deposito in criptovalute che rimane bloccato come garanzia. Serve a proteggere gli acquirenti da truffe o comportamenti scorretti. Se operi onestamente, i fondi rimangono tuoi."
    },
    {
        question: "Quanto costa vendere sulla piattaforma?",
        answer: "Oltre alla fee d'ingresso ($20), la piattaforma trattiene una piccola commissione su ogni transazione completata. Non ci sono costi fissi mensili a meno che tu non scelga di promuovere le tue inserzioni con i piani 'Sponsored Listings'."
    },
    {
        question: "Come funzionano le Sponsored Listings?",
        answer: "Puoi aumentare la tua visibilità acquistando pacchetti di sponsorizzazione (es. $25/mese). Le tue offerte appariranno in cima alle ricerche e nelle sezioni in evidenza, aumentando le probabilità di vendita."
    },
    {
        question: "Quando ricevo i miei pagamenti?",
        answer: "I fondi vengono rilasciati dal sistema Escrow al tuo wallet immediatamente dopo che l'acquirente ha confermato la ricezione dell'ordine o dopo il periodo di sblocco automatico se non ci sono contestazioni."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1000px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {header.back_button || "Indietro"}
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
                {header.title || "Domande Frequenti"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "Tutto quello che devi sapere per usare SwaprMarket al meglio."}
              </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => setActiveTab("buyer")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border",
                  activeTab === "buyer" 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <ShoppingBag className={cn("w-5 h-5", activeTab === "buyer" ? "text-black" : "text-zinc-500")} />
                <span className="font-bold">{tabs.buyer || "Acquirenti"}</span>
              </button>
              
              <button
                onClick={() => setActiveTab("seller")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border",
                  activeTab === "seller" 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <Store className={cn("w-5 h-5", activeTab === "seller" ? "text-black" : "text-zinc-500")} />
                <span className="font-bold">{tabs.seller || "Venditori"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-8"
          >
            <Squircle 
              radius={32} 
              smoothing={1} 
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="space-y-2">
                  {(activeTab === "buyer" ? buyerFAQs : sellerFAQs).map((faq, index) => (
                    <FAQItemComponent key={index} item={faq} />
                  ))}
                </div>
              </div>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
