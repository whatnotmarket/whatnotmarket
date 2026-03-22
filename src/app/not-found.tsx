import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black text-white p-4 text-center">
      <div className="space-y-6 max-w-md w-full">
        <div className="flex justify-center text-[120px] font-black leading-none tracking-tighter select-none">
          <span className="text-zinc-800">404</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pagina non trovata</h2>
          <p className="text-zinc-400">
            La pagina che stai cercando potrebbe essere stata rimossa, rinominata o non e temporaneamente disponibile.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <Link
            href="/"
            className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-12 rounded-xl text-base inline-flex items-center justify-center transition-colors"
          >
            Ritorna alla Home Page
          </Link>

          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 pt-4 border-t border-white/5">
            <span>Hai bisogno di supporto?</span>
            <a
              href="mailto:support@openly.market"
              className="text-zinc-300 hover:text-white underline underline-offset-4 transition-colors"
            >
              support@openly.market
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
