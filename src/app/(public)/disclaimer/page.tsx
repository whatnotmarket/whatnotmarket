import { Navbar } from "@/components/app/navigation/Navbar";
/* eslint-disable react/no-unescaped-entities */
import { CrossClusterLinks } from "@/components/app/seo/CrossClusterLinks";

export default function DisclaimerPage() {
  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl mx-auto bg-[#1C1C1E] rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 font-sans">
            Disclaimer e Limitazione di ResponsabilitÃƒÂ 
          </h1>
          <div className="prose prose-invert prose-lg max-w-none text-zinc-300 space-y-6">
            <p>
              Benvenuto su OpenlyMarket. Prima di utilizzare i nostri servizi, ti preghiamo di leggere attentamente il seguente disclaimer.
            </p>
            
            <h2 className="text-2xl font-bold text-white pt-4">Ruolo della Piattaforma</h2>
            <p>
              OpenlyMarket opera esclusivamente come un intermediario tecnologico. La nostra piattaforma ÃƒÂ¨ un mezzo che permette agli utenti di pubblicare inserzioni per la vendita di beni o servizi. Non siamo proprietari, venditori, nÃƒÂ© gestori dei prodotti o servizi offerti nelle inserzioni.
            </p>

            <h2 className="text-2xl font-bold text-white pt-4">Nessuna ResponsabilitÃƒÂ  sui Contenuti e sulle Transazioni</h2>
            <p>
              Di conseguenza, dichiariamo esplicitamente che:
            </p>
            <ul className="space-y-3">
              <li>
                <strong>Non siamo responsabili per le attivitÃƒÂ  svolte dagli utenti sul sito.</strong> Ogni utente ÃƒÂ¨ direttamente e unicamente responsabile delle proprie azioni, delle informazioni fornite e delle obbligazioni contratte.
              </li>
              <li>
                <strong>Non siamo responsabili per ciÃƒÂ² che gli utenti vendono.</strong> La qualitÃƒÂ , la sicurezza, la legalitÃƒÂ  e la veridicitÃƒÂ  degli articoli o servizi offerti sono di esclusiva responsabilitÃƒÂ  dell'utente che pubblica l'inserzione. Non effettuiamo alcuna verifica preventiva sui contenuti pubblicati.
              </li>
              <li>
                <strong>Non siamo parte della transazione.</strong> Qualsiasi accordo, transazione o contratto stipulato tra gli utenti avviene direttamente tra di loro. OpenlyMarket non ÃƒÂ¨ parte di tale rapporto e non assume alcuna responsabilitÃƒÂ  derivante da esso.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-white pt-4">Utilizzo a Proprio Rischio</h2>
            <p>
              L'utilizzo della nostra piattaforma implica l'accettazione che ogni interazione e transazione ÃƒÂ¨ condotta a proprio rischio. Raccomandiamo agli utenti di adottare le dovute precauzioni e di agire con buonsenso durante la compravendita.
            </p>

            <p className="pt-6 border-t border-white/10">
              Utilizzando OpenlyMarket, accetti i termini di questo disclaimer e sollevi la piattaforma da qualsiasi responsabilitÃƒÂ  legata alle attivitÃƒÂ  degli utenti e ai contenuti delle inserzioni.
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-6">
          <CrossClusterLinks variant="disclaimer" />
        </div>
      </main>
    </div>
  );
}


