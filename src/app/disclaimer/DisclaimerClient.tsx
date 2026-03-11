"use client";

import { Navbar } from "@/components/Navbar";
import { CopyMap } from "@/lib/copy-system";

export function DisclaimerClient({ copy }: { copy: CopyMap }) {
  const content = copy['content'] || {};

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-[#1C1C1E] rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 font-sans">
            {content.title || "Disclaimer e Limitazione di ResponsabilitÃ "}
          </h1>
          <div className="prose prose-invert prose-lg max-w-none text-zinc-300 space-y-6">
            <p>
              {content.intro || "Benvenuto su OpenlyMarket. Prima di utilizzare i nostri servizi, ti preghiamo di leggere attentamente il seguente disclaimer."}
            </p>
            
            <h2 className="text-2xl font-bold text-white pt-4">{content.role_title || "Ruolo della Piattaforma"}</h2>
            <p>
              {content.role_text || "OpenlyMarket opera esclusivamente come un intermediario tecnologico. La nostra piattaforma Ã¨ un mezzo che permette agli utenti di pubblicare inserzioni per la vendita di beni o servizi. Non siamo proprietari, venditori, nÃ© gestori dei prodotti o servizi offerti nelle inserzioni."}
            </p>

            <h2 className="text-2xl font-bold text-white pt-4">{content.liability_title || "Nessuna ResponsabilitÃ  sui Contenuti e sulle Transazioni"}</h2>
            <p>
              {content.liability_text || "Di conseguenza, dichiariamo esplicitamente che:"}
            </p>
            <ul className="space-y-3">
              <li>
                {content.point1 || "Non siamo responsabili per le attivitÃ  svolte dagli utenti sul sito. Ogni utente Ã¨ direttamente e unicamente responsabile delle proprie azioni, delle informazioni fornite e delle obbligazioni contratte."}
              </li>
              <li>
                {content.point2 || "Non siamo responsabili per ciÃ² che gli utenti vendono. La qualitÃ , la sicurezza, la legalitÃ  e la veridicitÃ  degli articoli o servizi offerti sono di esclusiva responsabilitÃ  dell'utente che pubblica l'inserzione. Non effettuiamo alcuna verifica preventiva sui contenuti pubblicati."}
              </li>
              <li>
                {content.point3 || "Non siamo parte della transazione. Qualsiasi accordo, transazione o contratto stipulato tra gli utenti avviene direttamente tra di loro. OpenlyMarket non Ã¨ parte di tale rapporto e non assume alcuna responsabilitÃ  derivante da esso."}
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-white pt-4">{content.risk_title || "Utilizzo a Proprio Rischio"}</h2>
            <p>
              {content.risk_text || "L'utilizzo della nostra piattaforma implica l'accettazione che ogni interazione e transazione Ã¨ condotta a proprio rischio. Raccomandiamo agli utenti di adottare le dovute precauzioni e di agire con buonsenso durante la compravendita."}
            </p>

            <p className="pt-6 border-t border-white/10">
              {content.footer || "Utilizzando OpenlyMarket, accetti i termini di questo disclaimer e sollevi la piattaforma da qualsiasi responsabilitÃ  legata alle attivitÃ  degli utenti e ai contenuti delle inserzioni."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

