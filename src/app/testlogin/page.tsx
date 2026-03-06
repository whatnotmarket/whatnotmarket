import { headers } from "next/headers";
import { AppKitButton } from "@reown/appkit/react";
import { AppKitProvider } from "@/reown/AppKitProvider";

export const dynamic = "force-dynamic";

export default async function TestLoginPage() {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <h1 className="text-3xl font-bold">AppKit Test Login</h1>
        <p className="text-zinc-400 text-sm">
          Questo è un test isolato per Reown AppKit (WalletConnect v2). Usa questo flusso solo su questa pagina.
        </p>

        <AppKitProvider cookies={cookies}>
          <div className="inline-flex">
            <AppKitButton />
          </div>
        </AppKitProvider>
      </div>
    </div>
  );
}
