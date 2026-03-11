import type { Metadata } from "next";
import { InstallClient } from "@/components/install/InstallClient";

export const metadata: Metadata = {
  title: "Installa l'app | SwaprMarket",
  description:
    "Guida rapida per installare la PWA su iPhone e Android. Apri da telefono per un'installazione ottimizzata.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function InstallPage() {
  return <InstallClient />;
}
