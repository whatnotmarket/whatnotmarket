import { InstallClient } from "@/components/features/install/InstallClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Install OpenlyMarket App on iPhone and Android",
  description:
    "Follow the official OpenlyMarket installation guide to add the app on iPhone and Android with the best PWA setup and home-screen experience.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function InstallPage() {
  return <InstallClient />;
}


