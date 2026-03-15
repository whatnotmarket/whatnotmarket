import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Homepage Draft",
  description: "Work-in-progress redesign for the OpenlyMarket homepage.",
};

export default function NewHomePage() {
  return (
    <main className="min-h-screen w-full bg-background px-6 py-10 text-foreground md:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-border bg-card p-6 md:p-10">
        <p className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          New Home Sandbox
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">TEST SE FUNZIONA</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Route di lavoro: <span className="font-semibold text-foreground">/new-home</span>. Quando il redesign e pronto, puoi
          sostituire la pagina iniziale puntando <code>src/app/page.tsx</code> a questa route.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Torna alla home attuale
          </Link>
          <Link
            href="/homepage"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Pagina /homepage attuale
          </Link>
        </div>
      </section>
    </main>
  );
}
