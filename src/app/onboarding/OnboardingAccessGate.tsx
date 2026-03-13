"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OnboardingAccessGate() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function unlock() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("Wrong password.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to unlock onboarding right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#c7c3df] px-4 py-12">
      <div className="mx-auto mt-16 w-full max-w-[430px] rounded-[20px] border border-black/40 bg-[#06070a] p-6 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-semibold">Onboarding Private Access</h1>
        <p className="mt-2 text-sm text-white/70">This flow is temporarily protected while we finalize it.</p>
        <div className="mt-5 space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            className="h-11 rounded-xl border-white/15 bg-[#121316] text-white"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button
            type="button"
            className="h-11 w-full rounded-2xl bg-[#a79bf3] text-black"
            onClick={unlock}
            disabled={submitting || !password}
          >
            {submitting ? "Unlocking..." : "Unlock onboarding"}
          </Button>
        </div>
      </div>
    </main>
  );
}

