"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  Lock, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  Zap,
  DollarSign,
  Copy,
  ExternalLink,
  Send
} from "lucide-react";
import { Navbar } from "@/components/app/navigation/Navbar";
import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { cn } from "@/lib/core/utils/utils";
import { marketToast as toast } from "@/lib/domains/notifications";
import { CopyMap } from "@/lib/app/content/copy-system";

// Schema for Step 2
const applicationSchema = z.object({
  sellerName: z.string().min(3, "Il nome venditore deve essere di almeno 3 caratteri"),
  category: z.string().min(5, "Specifica cosa intendi vendere"),
  reviewsChannel: z.string().optional(),
  escrow: z.string().optional(),
  notes: z.string().min(1, "Questo campo ÃƒÂ¨ obbligatorio"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const TelegramIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 100 100" 
        version="1.1" 
        xmlSpace="preserve" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        fill="currentColor"
        className={className}
    >
        <g>
            <path d="M88.723,12.142C76.419,17.238,23.661,39.091,9.084,45.047c-9.776,3.815-4.053,7.392-4.053,7.392 s8.345,2.861,15.499,5.007c7.153,2.146,10.968-0.238,10.968-0.238l33.62-22.652c11.922-8.107,9.061-1.431,6.199,1.431 c-6.199,6.2-16.452,15.975-25.036,23.844c-3.815,3.338-1.908,6.199-0.238,7.63c6.199,5.246,23.129,15.976,24.082,16.691 c5.037,3.566,14.945,8.699,16.452-2.146c0,0,5.961-37.435,5.961-37.435c1.908-12.637,3.815-24.321,4.053-27.659 C97.307,8.804,88.723,12.142,88.723,12.142z" />
        </g>
    </svg>
);

export function BecomeSellerClient({ copy }: { copy: CopyMap }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationFormValues | null>(null);

  const header = copy['header'] || {};
  const steps = copy['steps'] || {};
  const requirements = copy['requirements'] || {};
  const form = copy['form'] || {};
  const actions = copy['actions'] || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = (data: ApplicationFormValues) => {
    setApplicationData(data);
    setStep(3); // Step 3 is "Ready to send"
  };

  const generateTelegramMessage = () => {
    if (!applicationData) return "";
    return `Richiesta Venditore:

Nome: ${applicationData.sellerName}

Categoria: ${applicationData.category}

Canale Recensioni: ${applicationData.reviewsChannel || "N/A"}

Escrow Utilizzato: ${applicationData.escrow || "N/A"}

Note: ${applicationData.notes || "Nessuna nota"}

Richiedo verifica e istruzioni per il pagamento della fee.`;
  };

  const handleCopyToClipboard = () => {
    const message = generateTelegramMessage();
    navigator.clipboard.writeText(message);
    toast.success("Messaggio copiato negli appunti!");
  };

  const handleOpenTelegram = () => {
    const message = encodeURIComponent(generateTelegramMessage());
    window.open(`https://t.me/openlymarket_support?start=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-emerald-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1000px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header & Progress */}
          <div className="lg:sticky lg:top-32 self-start space-y-8">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {actions.back || "Indietro"}
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {header.title || "Diventa un Venditore"}
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {header.subtitle || "Unisciti al marketplace di nuova generazione. Nessuna censura, zero KYC, pagamenti in crypto."}
              </p>
            </motion.div>

            {/* Progress Steps */}
            <div className="space-y-6 pt-6 border-t border-white/5">
                {[
                    { id: 1, title: steps.step1_title || "Requisiti Base", desc: steps.step1_subtitle || "Cosa serve per iniziare" },
                    { id: 2, title: steps.step2_title || "Dettagli Applicazione", desc: steps.step2_subtitle || "Parlaci della tua attivitÃƒÂ " },
                    { id: 3, title: steps.step3_title || "Verifica", desc: steps.step3_subtitle || "Invia la richiesta" }
                ].map((s) => (
                    <div key={s.id} className={cn("flex gap-4 transition-opacity duration-300", step === s.id ? "opacity-100" : "opacity-40")}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border",
                            step === s.id ? "bg-white text-black border-white" : "bg-transparent text-white border-white/30"
                        )}>
                            {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">{s.title}</div>
                            <div className="text-xs text-zinc-400">{s.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Right Column: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
            <Squircle 
              radius={32} 
              smoothing={1} 
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden min-h-[600px] flex flex-col"
            >
                <div className="p-8 md:p-10 flex-1">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-white">{steps.step1_title || "Requisiti Base"}</h2>
                                    
                                    <div className="grid gap-4">
                                        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{requirements.fee_title || "Entry Fee: $20"}</h3>
                                                <p className="text-sm text-zinc-400 mt-1">{requirements.fee_desc || "Una tantum per filtrare lo spam e garantire serietÃƒÂ ."}</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{requirements.bond_title || "Vendor Bond (Opzionale)"}</h3>
                                                <p className="text-sm text-zinc-400 mt-1">{requirements.bond_desc || "Deposito di garanzia per accedere a livelli superiori e badge \"Verified\"."}</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{requirements.rules_title || "Rispetto delle Regole"}</h3>
                                                <p className="text-sm text-zinc-400 mt-1">{requirements.rules_desc || "Nessuna truffa, prodotti legali, rispetto della privacy degli utenti."}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-12 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-xl"
                                    onClick={() => setStep(2)}
                                >
                                    {actions.next || "Continua"}
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-white">{steps.step2_title || "Dettagli Applicazione"}</h2>
                                    
                                    <form id="application-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">{form.name_label || "Nome Venditore / Shop"}</label>
                                            <Input 
                                                {...register("sellerName")}
                                                placeholder="Es. CyberStore 2077" 
                                                className="bg-[#0A0A0A] border-white/10 h-12 text-white placeholder:text-zinc-600 focus:border-white/30"
                                            />
                                            {errors.sellerName && <p className="text-red-400 text-xs">{errors.sellerName.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">{form.category_label || "Categoria Principale"}</label>
                                            <Input 
                                                {...register("category")}
                                                placeholder="Es. Account Streaming, VPN, Software..." 
                                                className="bg-[#0A0A0A] border-white/10 h-12 text-white placeholder:text-zinc-600 focus:border-white/30"
                                            />
                                            {errors.category && <p className="text-red-400 text-xs">{errors.category.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">{form.reviews_label || "Canale Recensioni (Telegram/Forum)"}</label>
                                                <Input 
                                                    {...register("reviewsChannel")}
                                                    placeholder="Link o @username" 
                                                    className="bg-[#0A0A0A] border-white/10 h-12 text-white placeholder:text-zinc-600 focus:border-white/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-300">{form.escrow_label || "Hai giÃƒÂ  usato Escrow?"}</label>
                                                <Input 
                                                    {...register("escrow")}
                                                    placeholder="Si/No/Quale piattaforma" 
                                                    className="bg-[#0A0A0A] border-white/10 h-12 text-white placeholder:text-zinc-600 focus:border-white/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">{form.notes_label || "Note Aggiuntive"}</label>
                                            <textarea 
                                                {...register("notes")}
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-[120px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
                                                placeholder="Descrivi brevemente la tua esperienza e perchÃƒÂ© vuoi vendere su OpenlyMarket..."
                                            />
                                            {errors.notes && <p className="text-red-400 text-xs">{errors.notes.message}</p>}
                                        </div>
                                    </form>
                                </div>

                                <div className="flex gap-4">
                                    <Button 
                                        variant="outline"
                                        className="flex-1 h-12 text-base font-bold border-white/10 hover:bg-white/5"
                                        onClick={() => setStep(1)}
                                    >
                                        {actions.back || "Indietro"}
                                    </Button>
                                    <Button 
                                        className="flex-[2] h-12 text-base font-bold bg-white text-black hover:bg-zinc-200 rounded-xl"
                                        type="submit"
                                        form="application-form"
                                    >
                                        {actions.next || "Continua"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 mb-6">
                                        <TelegramIcon className="w-10 h-10 text-white" />
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold text-white">{steps.step3_title || "Invia Richiesta"}</h2>
                                    <p className="text-zinc-400 max-w-md mx-auto">
                                        Per completare la verifica, invia il messaggio pre-compilato al nostro supporto Telegram ufficiale. Un admin ti risponderÃƒÂ  con le istruzioni per il pagamento della fee.
                                    </p>

                                    <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/10 text-left relative group">
                                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                            {generateTelegramMessage()}
                                        </pre>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="absolute top-2 right-2 hover:bg-white/10 text-zinc-400 hover:text-white"
                                            onClick={handleCopyToClipboard}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button 
                                        className="w-full h-14 text-base font-bold bg-[#229ED9] hover:bg-[#1E88B9] text-white rounded-xl gap-3 shadow-lg shadow-blue-900/20"
                                        onClick={handleOpenTelegram}
                                    >
                                        <Send className="w-5 h-5" />
                                        {actions.send_telegram || "Invia Richiesta su Telegram"}
                                    </Button>
                                    
                                    <Button 
                                        variant="ghost"
                                        className="w-full text-sm text-zinc-500 hover:text-white"
                                        onClick={() => setStep(2)}
                                    >
                                        {actions.back || "Torna indietro e modifica"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}



