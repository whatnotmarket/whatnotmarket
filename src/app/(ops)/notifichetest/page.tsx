"use client";

import { useState } from "react";
import {
  adminToast,
  authToast,
  dealsToast,
  marketToast,
  paymentsToast,
  profileToast,
  toast,
  type ScopedToast,
} from "@/lib/domains/notifications";

type ScopeKey = "global" | "auth" | "admin" | "market" | "payments" | "profile" | "deals";

const scopes: Array<{ key: ScopeKey; label: string; api: ScopedToast; description: string }> = [
  { key: "global", label: "Global", api: toast, description: "Posizione base condivisa" },
  { key: "auth", label: "Auth", api: authToast, description: "Login/onboarding" },
  { key: "admin", label: "Admin", api: adminToast, description: "Dashboard e tooling admin" },
  { key: "market", label: "Market", api: marketToast, description: "Listing, richieste, promo" },
  { key: "payments", label: "Payments", api: paymentsToast, description: "Checkout e wallet" },
  { key: "profile", label: "Profile", api: profileToast, description: "Profilo utente" },
  { key: "deals", label: "Deals", api: dealsToast, description: "Deal room e dispute" },
];

const actionButtonClass =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800";

export default function NotificheTestPage() {
  const [activeScope, setActiveScope] = useState<ScopeKey>("global");
  const selected = scopes.find((scope) => scope.key === activeScope) ?? scopes[0];
  const api = selected.api;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Notifiche Test</h1>
          <p className="text-zinc-400">
            Playground dedicato per provare stile, posizione e comportamento notifiche.
          </p>
          <p className="text-sm text-zinc-500">
            Le modifiche ai file in <code>src/lib/notifications</code> si riflettono qui e in tutto il sito.
          </p>
        </header>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {scopes.map((scope) => (
            <button
              key={scope.key}
              type="button"
              onClick={() => setActiveScope(scope.key)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                activeScope === scope.key
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
              }`}
            >
              <p className="font-semibold">{scope.label}</p>
              <p className="text-xs text-zinc-400">{scope.description}</p>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-4 text-sm text-zinc-400">
            Scope attivo: <span className="font-semibold text-white">{selected.label}</span>
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              className={actionButtonClass}
              onClick={() => api.success("Operazione completata con successo")}
            >
              Success
            </button>

            <button
              type="button"
              className={actionButtonClass}
              onClick={() => api.error("Si Ã¨ verificato un errore di test")}
            >
              Error
            </button>

            <button
              type="button"
              className={actionButtonClass}
              onClick={() => api.info("Info di test per controllare il layout")}
            >
              Info
            </button>

            <button
              type="button"
              className={actionButtonClass}
              onClick={() => api.warning("Avviso: verifica il comportamento warning")}
            >
              Warning
            </button>

            <button
              type="button"
              className={actionButtonClass}
              onClick={() =>
                api.promise(
                  new Promise<{ tx: string }>((resolve) => {
                    window.setTimeout(() => resolve({ tx: "0xabc123" }), 1400);
                  }),
                  {
                    loading: "Invio in corso...",
                    success: (result) => `Confermato: ${result.tx}`,
                    error: "Errore promise",
                  }
                )
              }
            >
              Promise Success
            </button>

            <button
              type="button"
              className={actionButtonClass}
              onClick={() =>
                api.promise(
                  new Promise<never>((_resolve, reject) => {
                    window.setTimeout(() => reject(new Error("Rifiutata")), 1400);
                  }),
                  {
                    loading: "Invio in corso...",
                    success: "Non dovrebbe apparire",
                    error: (error) =>
                      error instanceof Error ? `Promise Error: ${error.message}` : "Promise Error",
                  }
                )
              }
            >
              Promise Error
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              className="rounded-lg border border-red-800 bg-red-900/40 px-3 py-2 text-sm text-red-100 transition hover:bg-red-900/60"
              onClick={() => api.clear()}
            >
              Pulisci notifiche scope attivo
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

