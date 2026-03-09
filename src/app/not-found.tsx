"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import BlurText from "@/components/ui/blur-text";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black text-white p-4 text-center">
      <div className="space-y-6 max-w-md w-full">
        {/* Large 404 Text */}
        <div className="flex justify-center text-[120px] font-black leading-none tracking-tighter select-none">
            <BlurText 
                text="404" 
                delay={150} 
                animateBy="letters" 
                direction="top" 
                className="text-zinc-800"
            />
        </div>
        
        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pagina non trovata</h2>
          <p className="text-zinc-400">
            La pagina che stai cercando potrebbe essere stata rimossa, rinominata o è temporaneamente non disponibile.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 pt-4">
          <Link href="/" passHref>
            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-12 rounded-xl text-base">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ritorna alla Home Page
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 pt-4 border-t border-white/5">
            <Mail className="h-4 w-4" />
            <span>Hai bisogno di supporto?</span>
            <a 
              href="mailto:support@swapr.market" 
              className="text-zinc-300 hover:text-white underline underline-offset-4 transition-colors"
            >
              support@swapr.market
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
