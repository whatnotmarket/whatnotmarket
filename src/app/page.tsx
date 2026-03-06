import { InviteForm } from "./invite-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black z-0 pointer-events-none" />
      
      <div className="z-10 w-full max-w-md flex flex-col items-center space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
            whatnot<span className="text-zinc-500">market</span>
          </h1>
          <p className="text-zinc-400 text-sm tracking-wide uppercase">
            Private Marketplace
          </p>
        </div>

        <InviteForm />
      </div>
    </main>
  );
}
