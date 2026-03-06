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
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Schema for Step 2
const applicationSchema = z.object({
  sellerName: z.string().min(3, "Il nome venditore deve essere di almeno 3 caratteri"),
  category: z.string().min(5, "Specifica cosa intendi vendere"),
  reviewsChannel: z.string().optional(),
  escrow: z.string().optional(),
  notes: z.string().min(1, "Questo campo è obbligatorio"),
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

export default function BecomeSellerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationFormValues | null>(null);

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
    // In a real app, this would be your bot username
    window.open("https://t.me/whatnotmarketbot?start=become-seller", "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
      <Navbar />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent opacity-50 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent hover:text-zinc-300 text-zinc-500 transition-colors -ml-2"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else router.back();
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step > 1 ? "Indietro" : "Torna alla Home"}
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Diventa Venditore
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                {step === 1 && "Unisciti ai nostri venditori verificati. Costruisci la tua reputazione e inizia a vendere in sicurezza."}
                {step === 2 && "Compila il modulo con le tue informazioni per iniziare il processo di verifica."}
                {step === 3 && "Copia il messaggio generato e invialo al nostro bot Telegram per completare la verifica."}
              </p>
            </motion.div>
            
            {/* Steps Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step >= s ? "w-8 bg-white" : "w-2 bg-zinc-800"
                  )} 
                />
              ))}
            </div>
          </div>

          {/* Right Column: Content */}
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
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-10 space-y-12"
                  >
                    
                    {/* Intro */}
                    <section className="space-y-4">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CheckCircle2 className="text-white" /> Venditori Verificati
                      </h2>
                      <p className="text-zinc-400 leading-relaxed">
                        Per mantenere un marketplace sicuro e affidabile, tutti i venditori devono completare un processo di verifica prima di poter pubblicare offerte.
                        Il nostro sistema è progettato per essere <strong>privacy-first</strong>: non richiediamo KYC obbligatorio. Invece, utilizziamo un modello basato su reputazione, storico delle vendite e responsabilità economica.
                      </p>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* Fee & Reputation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Wallet className="text-white w-5 h-5" /> Fee di ingresso
                        </h3>
                        <p className="text-sm text-zinc-400">
                          È richiesta una quota di ingresso <strong>non rimborsabile</strong> di <span className="text-white font-bold">$20</span>. Questa quota serve a:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Prevenire account spam o temporanei
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Garantire che i venditori siano seri
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Ridurre truffe e venditori opportunistici
                          </li>
                        </ul>
                        <p className="text-xs text-zinc-500 italic mt-2">
                          Dimostra che hai "skin in the game".
                        </p>
                      </section>

                      <section className="space-y-4 h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Users className="text-white w-5 h-5" /> Verifica Reputazione
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Chiediamo prove della tua reputazione commerciale esistente:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Transazioni su altri marketplace
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Feedback o recensioni verificate
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                            Profili pubblici di vendita
                          </li>
                        </ul>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Vendor Bond */}
                    <section className="space-y-6">
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                          <Lock className="w-6 h-6" /> Vendor Bond (Deposito di Sicurezza)
                        </h3>
                        <p className="text-zinc-300 mb-6 font-medium">
                          Per alcune categorie o venditori ad alto volume, è richiesto un deposito di sicurezza (Vendor Bond).
                          Questo serve a proteggere il marketplace da comportamenti fraudolenti.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3 h-full flex flex-col">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter">Come funziona</h4>
                            <div className="space-y-4 flex-1 flex flex-col">
                              <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex-1">
                                <div className="text-sm font-bold text-white mb-2">1. Deposito Iniziale</div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Per attivare l'account venditore, è necessario bloccare un importo minimo in criptovalute (USDT, BTC, XMR). Questo fondo rimane tuo ma viene bloccato come garanzia.
                                  <br />
                                  <span className="text-white font-semibold mt-2 block bg-white/5 p-2 rounded border border-white/5">Esempio: Starter Vendor = $200</span>
                                </p>
                              </div>
                              <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex-1">
                                <div className="text-sm font-bold text-white mb-2">2. Bond Dinamico</div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Il valore del bond richiesto aumenta proporzionalmente al volume delle tue vendite. Questo meccanismo serve a prevenire "exit scam" quando un venditore accumula ordini di grande valore.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 h-full flex flex-col">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter">Regole & Confisca</h4>
                            <div className="space-y-4 flex-1 flex flex-col">
                              <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex-1">
                                <div className="text-sm font-bold text-white mb-2">3. Limite Ordini</div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Il valore totale dei tuoi ordini attivi non può superare un multiplo del tuo bond. Se raggiungi il limite, devi aumentare il bond o completare gli ordini esistenti.
                                  <br />
                                  <span className="text-zinc-500 font-medium mt-2 block">Formula: Max Ordini = Bond × 3</span>
                                </p>
                              </div>
                              <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex-1">
                                <div className="text-sm font-bold text-white mb-2">4. Confisca</div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  In caso di comportamenti scorretti, il bond può essere confiscato per rimborsare gli acquirenti danneggiati.
                                  <span className="block mt-2 space-y-1">
                                    <span className="block text-white font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 w-fit">Scam = -100% Bond</span>
                                    <span className="block text-zinc-400">Ritardo grave o negligenza = -10% Bond</span>
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500 font-medium">
                          *Venditori con ottima reputazione (100+ vendite, 98% feedback) possono ottenere riduzioni del bond richiesto.
                          Il ritiro del bond è possibile solo senza ordini attivi e dopo un periodo di sicurezza.
                        </div>
                      </div>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* Trust Score & Levels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                       <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <TrendingUp className="text-white w-5 h-5" /> Trust Score
                        </h3>
                        <p className="text-sm text-zinc-400 font-medium">
                          Ogni venditore riceve un punteggio dinamico basato su:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {["Vendite completate", "Feedback positivi", "Volume transazioni", "Velocità risposta", "Dispute vinte"].map((item) => (
                                <span key={item} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
                                    {item}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-auto pt-2 font-medium">
                            Più alto è il punteggio, maggiore sarà la visibilità.
                        </p>
                      </section>

                      <section className="space-y-4 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 font-inter">
                          <Award className="text-white w-5 h-5" /> Livelli Venditore
                        </h3>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-semibold">Verified Seller</span>
                                <span className="text-zinc-500 text-xs font-medium">Accesso base</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-zinc-300 font-bold">Trusted Seller</span>
                                <span className="text-zinc-500 text-xs font-medium">Alto volume & feedback</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <span className="text-white font-extrabold">Top Vendor</span>
                                <span className="text-zinc-500 text-xs font-medium">Reputazione massima</span>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-auto pt-2 font-medium">
                            Livelli alti = Commissioni più basse e priorità.
                        </p>
                      </section>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    {/* Vantaggi Esclusivi */}
                    <section className="space-y-6">
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                          <Zap className="w-6 h-6 text-white" /> Vantaggi Esclusivi
                        </h3>
                        <p className="text-zinc-300 mb-6 font-medium">
                          Oltre a tutti i benefici standard, i venditori verificati sbloccano un sistema di notifiche intelligenti che massimizza le vendite.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex flex-col h-full">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white" /> Notifiche di Vendita
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                              Quando pubblichi un nuovo servizio o offerta, il nostro sistema invia automaticamente una notifica istantanea a tutti gli utenti che stanno cercando quel tipo di servizio.
                            </p>
                          </div>

                          <div className="bg-[#1C1C1E] p-4 rounded-lg border border-white/5 flex flex-col h-full">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-inter mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white" /> Matching Automatico
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                              Se un acquirente cerca un servizio che tu offri, riceverai una notifica immediata con la richiesta, permettendoti di rispondere prima della concorrenza.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="h-px w-full bg-white/5" />

                    {/* Privacy & CTA */}
                    <section className="text-center space-y-8 pt-4">
                      <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-2xl font-bold text-white">Marketplace Privacy-Focused</h2>
                        <p className="text-zinc-400">
                            Il nostro obiettivo è creare un ambiente sicuro senza compromettere la privacy.
                            Non richiediamo KYC obbligatorio e utilizziamo escrow per garantire le transazioni.
                        </p>
                      </div>

                      <div className="bg-[#2C2C2E] rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
                        <h3 className="text-xl font-bold text-white mb-2">Pronto a iniziare?</h3>
                        <p className="text-zinc-400 mb-6 text-sm">
                            Leggi attentamente le regole qui sopra. Se sei d'accordo, procedi al modulo di candidatura.
                        </p>
                        
                        <Button 
                            onClick={() => setStep(2)}
                            className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/5 rounded-xl"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 rotate-180" /> Procedi alla Candidatura
                        </Button>
                      </div>
                    </section>
                  </motion.div>
                )}

                {step === 2 && (
                   <motion.div 
                     key="step2"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-8 md:p-10 space-y-8"
                   >
                     <div className="text-center space-y-2 mb-8">
                       <h2 className="text-2xl font-bold text-white">Informazioni Venditore</h2>
                       <p className="text-zinc-400 text-sm">Compila i dettagli per la tua richiesta di verifica.</p>
                     </div>

                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Nome Venditore / Alias</label>
                            <Input 
                              {...register("sellerName")}
                              placeholder="Es. CryptoKing_99" 
                              className="bg-[#2C2C2E] border-white/10"
                            />
                            {errors.sellerName && <p className="text-red-400 text-xs">{errors.sellerName.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Cosa intendi vendere?</label>
                            <Input 
                              {...register("category")}
                              placeholder="Es. Account Netflix, Script Python, Servizi Social..." 
                              className="bg-[#2C2C2E] border-white/10"
                            />
                            <p className="text-xs text-zinc-500">Descrivi brevemente la tua offerta principale.</p>
                            {errors.category && <p className="text-red-400 text-xs">{errors.category.message}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Canale Telegram Recensioni (Opzionale)</label>
                                <Input 
                                  {...register("reviewsChannel")}
                                  placeholder="@canale_feedback" 
                                  className="bg-[#2C2C2E] border-white/10"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Escrow Utilizzato (Opzionale)</label>
                                <Input 
                                  {...register("escrow")}
                                  placeholder="Es. Escrow.com, Altro..." 
                                  className="bg-[#2C2C2E] border-white/10"
                                />
                             </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Altre informazioni utili</label>
                            <textarea 
                              {...register("notes")}
                              rows={4}
                              placeholder="Link a profili su altri forum, thread di vendita, ecc." 
                              className="flex w-full rounded-md border border-white/10 bg-[#2C2C2E] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            />
                            {errors.notes && <p className="text-red-400 text-xs">{errors.notes.message}</p>}
                          </div>
                        </div>

                        <div className="pt-4">
                           <Button 
                              type="submit"
                              className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-zinc-200 rounded-xl"
                           >
                              Continua
                           </Button>
                        </div>
                     </form>
                   </motion.div>
                )}

                {step === 3 && (
                   <motion.div 
                     key="step3"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="p-8 md:p-10 space-y-8 text-center"
                   >
                     <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <TelegramIcon className="w-10 h-10 text-blue-400 ml-1" />
                     </div>
                     
                     <div className="space-y-4">
                       <h2 className="text-2xl font-bold text-white">Verifica Informazioni</h2>
                       <p className="text-zinc-400">
                         Copia il messaggio qui sotto e invialo al nostro bot Telegram per avviare la verifica.
                       </p>
                       <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-md mx-auto">
                          <p className="text-xs text-red-300 flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Attenzione: Puoi effettuare una sola candidatura ogni 30 giorni. Se rifiutata, dovrai attendere prima di riprovare.
                          </p>
                       </div>
                     </div>

                     <div className="bg-[#0b0b0c] p-4 rounded-xl border border-white/10 text-left relative group">
                        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-inter">
                           {generateTelegramMessage()}
                        </pre>
                        <Button 
                           size="sm" 
                           variant="ghost" 
                           onClick={handleCopyToClipboard}
                           className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white"
                        >
                           <Copy className="w-4 h-4" />
                        </Button>
                     </div>

                     <div className="pt-4 space-y-4">
                        <Button 
                           onClick={() => {
                             handleCopyToClipboard();
                             setTimeout(handleOpenTelegram, 1000);
                           }}
                           className="w-full h-14 text-lg font-bold bg-[#0088cc] text-white hover:bg-[#0077b5] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#0088cc]/20 rounded-xl"
                        >
                           <TelegramIcon className="w-5 h-5 mr-2" /> Copia e Vai al Bot
                        </Button>
                        
                        <Button 
                           variant="ghost"
                           onClick={() => setStep(2)}
                           className="text-zinc-500 hover:text-white"
                        >
                           Modifica dati
                        </Button>
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>
            </Squircle>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
