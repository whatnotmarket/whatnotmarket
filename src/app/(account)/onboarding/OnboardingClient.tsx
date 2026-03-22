"use client";

import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { cn } from "@/lib/core/utils/utils";
import { authToast as toast } from "@/lib/domains/notifications";
import { entropyToMnemonic,validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { AnimatePresence,motion } from "framer-motion";
import Link from "next/link";
import { type FormEvent,useEffect,useMemo,useState } from "react";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Intent = "buy" | "sell" | "both";
type Availability = "idle" | "checking" | "available" | "unavailable";

type UsernameAvailabilityResponse = { ok: boolean; available: boolean; reason?: string; error?: string };
type RegisterResponse = { ok: boolean; identityUsername?: string; redirectTo?: string; error?: string };
type OnboardingClientProps = {
  initialSessionId: string;
  onboardingSessionToken: string;
};

const DISCOVERY = ["X / Twitter", "Word of mouth", "Telegram / Discord", "Search / Google", "Creator / influencer", "Other"] as const;
const CATEGORIES = ["Digital products", "Services", "Physical items", "Freelance work", "Other"] as const;

function randomInt(maxExclusive: number) {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return random[0] % maxExclusive;
}

function normalizeUsername(raw: string) {
  return String(raw || "").trim().toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9_-]/g, "").replace(/\./g, "_");
}

function shuffleSecure(values: string[]) {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function createDefaultWeb3Username() {
  const suffix = ["trade", "drift", "orbit", "vault", "node", "fox", "orca", "lynx", "nova", "pulse"];
  return `opnly${suffix[randomInt(suffix.length)]}${10 + randomInt(90)}`;
}

function generateSecurePassword(length = 22) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?";
  const all = upper + lower + digits + symbols;
  const pick = (chars: string) => chars[randomInt(chars.length)];
  const seed = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: Math.max(length, 20) - seed.length }, () => pick(all));
  return shuffleSecure([...seed, ...rest]).join("");
}

function createRecoveryPhrase() {
  const entropy = new Uint8Array(16);
  crypto.getRandomValues(entropy);
  return entropyToMnemonic(entropy, wordlist);
}

function pickIndexes(totalWords: number, count: number) {
  const indexes = new Set<number>();
  while (indexes.size < count) indexes.add(randomInt(totalWords) + 1);
  return Array.from(indexes).sort((a, b) => a - b);
}

function DotProgress({ step }: { step: Step }) {
  const active = step <= 2 ? 0 : step <= 5 ? 1 : 2;
  return (
    <div className="flex items-center justify-center gap-2 py-3.5">
      {[0, 1, 2].map((i) => <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i === active ? "bg-[#a79bf3]" : "bg-white/25")} />)}
    </div>
  );
}

function CardStep({ stepKey, title, subtitle, children }: { stepKey: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div key={stepKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-5 px-5 pb-5 pt-6 sm:px-7">
      <div className="space-y-2 text-center">
        <h1 className="text-[36px] font-semibold leading-[1.06] text-white sm:text-[42px]">{title}</h1>
        <p className="mx-auto max-w-[320px] text-[14px] leading-snug text-white/75 sm:text-[15px]">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  );
}

function Option({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("w-full rounded-2xl border px-4 py-3 text-left", active ? "border-[#a79bf3] bg-[#a79bf3]/20" : "border-white/15 bg-white/[0.04]")}>{label}</button>;
}

export function OnboardingClient({ initialSessionId, onboardingSessionToken }: OnboardingClientProps) {
  const [step, setStep] = useState<Step>(0);
  const [sessionId] = useState(initialSessionId);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [buyerInterest, setBuyerInterest] = useState("");
  const [sellerCategory, setSellerCategory] = useState("");
  const [discovery, setDiscovery] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameState, setUsernameState] = useState<Availability>("idle");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [savedPhrase, setSavedPhrase] = useState(false);
  const [hoverPhrase, setHoverPhrase] = useState(false);
  const [indexes, setIndexes] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showPerfect, setShowPerfect] = useState(false);
  const [acceptedSafety, setAcceptedSafety] = useState(false);
  const [identityUsername, setIdentityUsername] = useState("");
  const [redirectTo, setRedirectTo] = useState("/market");
  const [submitting, setSubmitting] = useState(false);

  const usernameBody = useMemo(() => normalizeUsername(usernameInput).replace(/^0x/, ""), [usernameInput]);
  const username = useMemo(() => `0x${usernameBody}`, [usernameBody]);
  const words = useMemo(() => phrase.split(" ").filter(Boolean), [phrase]);
  const missingOptions = useMemo(() => shuffleSecure(indexes.map((i) => words[i - 1]).filter(Boolean)), [indexes, words]);

  useEffect(() => {
    setPhrase(createRecoveryPhrase());
    setIndexes(pickIndexes(12, 3));
  }, []);

  async function persist(partial: Record<string, unknown>) {
    try {
      await fetch("/api/auth/internal/onboarding-progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, onboardingSessionToken, ...partial }) });
    } catch {}
  }

  async function checkUsernameAvailabilityValue(candidate: string) {
    try {
      const response = await fetch(`/api/auth/internal/username-availability?username=${encodeURIComponent(candidate)}`, { cache: "no-store" });
      const result = (await response.json().catch(() => null)) as UsernameAvailabilityResponse | null;
      return Boolean(response.ok && result?.available);
    } catch {
      return false;
    }
  }

  useEffect(() => {
    let canceled = false;
    (async () => {
      for (let i = 0; i < 20; i += 1) {
        const bodyCandidate = normalizeUsername(createDefaultWeb3Username()).replace(/^0x/, "");
        const candidate = `0x${bodyCandidate}`;
        if (await checkUsernameAvailabilityValue(candidate)) {
          if (!canceled) {
            setUsernameInput(bodyCandidate);
            setUsernameState("available");
          }
          return;
        }
      }
      if (!canceled) setUsernameInput(normalizeUsername(createDefaultWeb3Username()).replace(/^0x/, ""));
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (step !== 2 || usernameBody.length < 3) { setUsernameState("idle"); return; }
    const t = window.setTimeout(async () => {
      setUsernameState("checking");
      setUsernameState((await checkUsernameAvailabilityValue(username)) ? "available" : "unavailable");
    }, 260);
    return () => window.clearTimeout(t);
  }, [step, username, usernameBody]);

  const usernameReady = step === 2 && usernameBody.length >= 3 && usernameState === "available";

  function continuePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 10) return toast.error("Password must be at least 10 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    if (!validateMnemonic(phrase, wordlist)) return toast.error("Recovery phrase is not ready.");
    setStep(4);
  }

  async function completeRegistration(source: string) {
    if (!intent) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/internal/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, recoveryPhrase: phrase, userIntent: intent, buyerInterest: buyerInterest || undefined, sellerCategory: sellerCategory || undefined, discoverySource: source, onboardingSessionId: sessionId, onboardingSessionToken, accessMethod: "recovery_phrase", next: "/market" }),
      });
      const result = (await response.json().catch(() => null)) as RegisterResponse | null;
      if (!response.ok || !result?.ok) return toast.error(result?.error || "Unable to create account.");
      setIdentityUsername(result.identityUsername || username);
      setRedirectTo(result.redirectTo || "/market");
      setAcceptedSafety(false);
      await persist({ userIntent: intent, buyerInterest: buyerInterest || undefined, sellerCategory: sellerCategory || undefined, discoverySource: source, selectedAccessMethod: "recovery_phrase", completedIdentity: true });
      setStep(8);
    } finally {
      setSubmitting(false);
    }
  }

  function socialMock(provider: "google" | "apple") {
    void persist({ userIntent: intent || undefined, sellerCategory: sellerCategory || undefined, buyerInterest: buyerInterest || undefined, selectedAccessMethod: provider === "google" ? "google_mock" : "apple_mock", completedIdentity: false });
    setIdentityUsername(username || `social_${provider}_${1000 + randomInt(9000)}`);
    setRedirectTo("/market");
    setAcceptedSafety(false);
    setStep(8);
  }

  return (
    <main className="min-h-screen bg-[#c7c3df]">
      <header className="flex items-center justify-between px-7 py-7 text-black sm:px-10"><div className="h-7 w-7 rounded-full bg-black" /><button type="button" className="inline-flex items-center gap-1.5 text-[32px] font-medium"><span>?</span><span>Aiuto</span></button></header>
      <div className="flex items-center justify-center px-4 pb-14 pt-4 sm:pt-6">
        <section className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-black/40 bg-[#06070a] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10"><DotProgress step={step} /></div>
          <AnimatePresence mode="wait">
            {step === 0 && <CardStep stepKey="welcome" title="Trade privately. No email required." subtitle="Create a username identity and start trading in seconds."><div className="space-y-2 text-sm text-white/80"><p>Password = login</p><p>Recovery phrase = account recovery only</p></div><div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75"><p>2,300+ trades completed this week</p><p>Average escrow completion: 11 minutes</p></div><div className="space-y-2"><Button type="button" className="h-12 w-full rounded-2xl bg-[#a79bf3] text-[28px] font-semibold text-black" onClick={() => setStep(1)}>Get started</Button><Button type="button" className="h-11 w-full rounded-2xl bg-white text-black" onClick={() => socialMock("google")}>Continue with Google</Button><Button type="button" className="h-11 w-full rounded-2xl bg-white text-black" onClick={() => socialMock("apple")}>Continue with Apple</Button></div></CardStep>}
            {step === 1 && <CardStep stepKey="intent" title="What brings you to Openly?" subtitle="We'll personalize the marketplace for you."><div className="space-y-2"><Option active={intent === "buy"} label="Buy" onClick={() => setIntent("buy")} /><Option active={intent === "sell"} label="Sell" onClick={() => setIntent("sell")} /><Option active={intent === "both"} label="Both" onClick={() => setIntent("both")} /></div><p className="px-1 text-sm text-white/65">You can change this later in settings.</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(0)}>Back</Button><Button type="button" className="h-11 rounded-2xl bg-[#a79bf3] text-black" onClick={() => { if (!intent) return toast.error("Select buy, sell or both."); void persist({ userIntent: intent }); setStep(2); }}>Continue</Button></div></CardStep>}
            {step === 2 && <CardStep stepKey="username" title="Choose your username" subtitle="This will be your visible identity on the platform. You can change username later."><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!usernameReady) return; setStep(3); }}><div className="rounded-[16px] border border-white/10 bg-transparent px-4 py-2.5"><div className="flex items-center gap-2"><span className="text-[24px] text-white/90">@</span><span className="text-[24px] text-white/90">0x</span><Input value={usernameBody} onChange={(event) => setUsernameInput(normalizeUsername(event.target.value).replace(/^0x/, ""))} className="h-10 border-0 !bg-transparent p-0 text-[34px] font-medium text-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" /></div></div>{usernameState === "available" && <p className="px-1 text-sm text-[#20c67a]">Username valido</p>}{usernameState === "unavailable" && <p className="px-1 text-sm text-red-400">Username occupato</p>}{usernameState === "checking" && <p className="px-1 text-sm text-white/65">Checking availability...</p>}<p className="px-1 text-sm text-white/65">No email required. Your username is your identity.</p><div className="grid grid-cols-2 gap-2 pt-1"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(1)}>Indietro</Button><Button type="submit" className="h-11 rounded-2xl bg-[#a79bf3] text-black disabled:opacity-60" disabled={!usernameReady}>Continue</Button></div></form></CardStep>}
            {step === 3 && <CardStep stepKey="password" title="Create a password" subtitle="This is your normal login method."><form className="space-y-3" onSubmit={continuePassword}><div className="grid grid-cols-[1fr_auto_auto] gap-2"><Input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border-white/15 bg-[#121316] text-white" /><button type="button" onClick={() => { const g = generateSecurePassword(22); setPassword(g); setConfirm(g); toast.success("Secure password generated."); }} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#8f87f0]/40 bg-[#2a2145] text-[#b8b0f7]">?</button><button type="button" onClick={() => setShowPassword((v) => !v)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#121316]">{showPassword ? "?" : "?"}</button></div><div className="relative"><Input type={showConfirm ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-11 rounded-xl border-white/15 bg-[#121316] pr-12 text-white" /><button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70">{showConfirm ? "Hide" : "Show"}</button></div><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-10 rounded-xl border-[#8f87f0] bg-transparent text-[#b8b0f7]" onClick={async () => { if (!password) return; await navigator.clipboard.writeText(password); toast.success("Password copied."); }}>Copy</Button></div><p className="text-sm text-amber-200/90">Save this password somewhere safe.</p><p className="text-sm text-amber-200/90">Openly cannot reset your password.</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(2)}>Back</Button><Button type="submit" className="h-11 rounded-2xl bg-[#a79bf3] text-black">Continue</Button></div></form></CardStep>}
            {step === 4 && <CardStep stepKey="phrase" title="Your recovery phrase" subtitle="These 12 words allow you to recover your account if you lose access."><div className="space-y-3"><div className="relative" onMouseEnter={() => setHoverPhrase(true)} onMouseLeave={() => setHoverPhrase(false)}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{words.map((w, i) => <div key={`${w}-${i}`} className="rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-2 text-sm"><span className="mr-1.5 text-white/40">{i + 1}.</span><span className={cn(hoverPhrase ? "blur-0 opacity-100" : "select-none blur-md opacity-45")}>{w}</span></div>)}</div>{!hoverPhrase && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-full border border-white/25 bg-black/45 px-4 py-2 text-sm">Hover to reveal</div></div>}</div><button type="button" onClick={async () => { await navigator.clipboard.writeText(phrase); toast.success("Recovery phrase copied."); }} className="w-full rounded-md border border-white/15 bg-white/[0.04] py-2 text-sm">Copy phrase</button><p className="text-sm text-amber-200/90">Openly cannot recover your account without this phrase.</p><p className="text-sm text-amber-200/90">Never share it with anyone.</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={savedPhrase} onChange={(e) => setSavedPhrase(e.target.checked)} className="h-4 w-4" />I saved my recovery phrase</label><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(3)}>Back</Button><Button type="button" className="h-11 rounded-2xl bg-[#a79bf3] text-black" disabled={!savedPhrase} onClick={() => setStep(5)}>Continue</Button></div></div></CardStep>}
            {step === 5 && <CardStep stepKey="verify" title="Confirm your recovery phrase" subtitle="Select the missing words in the correct order."><div className="space-y-3"><div className="grid grid-cols-3 gap-2">{Array.from({ length: 12 }).map((_, idx) => { const index = idx + 1; if (indexes.includes(index)) return <button key={index} type="button" onClick={() => setAnswers((c) => { const n = { ...c }; delete n[index]; return n; })} className="h-11 rounded-xl border border-[#8f87f0] bg-[#0e0f14] px-2 text-left text-sm"><span className="text-white/55">{index}.</span> <span>{answers[index] || "....."}</span></button>; return <div key={index} className="h-11 rounded-xl border border-white/15 bg-white/[0.04] px-2 text-left text-sm text-white/45 blur-[2px]"><span>{index}. {words[idx] || "....."}</span></div>; })}</div><div className="grid grid-cols-3 gap-2">{missingOptions.map((opt) => <Button key={opt} type="button" variant="outline" className="h-10 rounded-xl border-[#8f87f0] bg-transparent text-[#9f93f0]" onClick={() => { if (Object.values(answers).includes(opt)) return; const next = indexes.find((i) => !answers[i]); if (!next) return; setAnswers((c) => ({ ...c, [next]: opt })); }}>{opt}</Button>)}</div><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(4)}>Back</Button><Button type="button" className="h-11 rounded-2xl bg-[#a79bf3] text-black" onClick={() => { const wrong = indexes.find((i) => String(answers[i] || "").trim().toLowerCase() !== words[i - 1]); if (wrong) return toast.error(`Word #${wrong} is incorrect.`); setShowPerfect(true); }}>Create account</Button></div></div></CardStep>}
            {step === 6 && <CardStep stepKey="personalize" title="One quick question" subtitle="Help us personalize your homepage right away."><div className="space-y-4">{(intent === "buy" || intent === "both") && <div className="space-y-2"><p className="text-sm text-white/80">What are you usually looking for?</p><div className="grid grid-cols-1 gap-2">{CATEGORIES.map((o) => <Option key={`b-${o}`} label={o} active={buyerInterest === o} onClick={() => setBuyerInterest(o)} />)}</div></div>}{(intent === "sell" || intent === "both") && <div className="space-y-2"><p className="text-sm text-white/80">What do you sell?</p><div className="grid grid-cols-1 gap-2">{CATEGORIES.map((o) => <Option key={`s-${o}`} label={o} active={sellerCategory === o} onClick={() => setSellerCategory(o)} />)}</div></div>}<div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => setStep(5)}>Back</Button><Button type="button" className="h-11 rounded-2xl bg-[#a79bf3] text-black" onClick={() => { if ((intent === "buy" || intent === "both") && !buyerInterest) return toast.error("Choose what you usually buy."); if ((intent === "sell" || intent === "both") && !sellerCategory) return toast.error("Choose what you sell."); void persist({ userIntent: intent || undefined, buyerInterest: buyerInterest || undefined, sellerCategory: sellerCategory || undefined }); setStep(7); }}>Continue</Button></div></div></CardStep>}
            {step === 7 && <CardStep stepKey="discovery" title="How did you hear about Openly?" subtitle="This helps us improve the platform."><div className="space-y-2">{DISCOVERY.map((o) => <Option key={o} label={o} active={discovery === o} onClick={() => setDiscovery(o)} />)}</div><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11 rounded-2xl border-white/20 bg-transparent text-white" onClick={() => void completeRegistration("Skipped")} disabled={submitting}>Skip</Button><Button type="button" className="h-11 rounded-2xl bg-[#a79bf3] text-black" onClick={() => void completeRegistration(discovery || "Skipped")} disabled={submitting}>{submitting ? "Creating..." : "Continue"}</Button></div></CardStep>}
            {step === 8 && <CardStep stepKey="success" title="You're ready" subtitle="Your identity is active."><div className="space-y-4"><div className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-3 text-center"><p className="text-xs uppercase tracking-[0.16em] text-white/50">Identity</p><p className="mt-1 text-[38px] font-semibold text-white">0x@{String(identityUsername || "").replace(/^0x/, "")}</p></div><div className="rounded-xl border border-amber-300/35 bg-amber-200/10 px-3 py-3 text-sm text-amber-100"><p className="mt-1">Openly will never contact you to ask for private keys or recovery phrases.</p><p className="mt-1">Never complete transactions outside the platform. Only on-platform trades are protected by escrow.</p></div><label className="flex items-start gap-2 px-1 text-sm text-white/85"><input type="checkbox" checked={acceptedSafety} onChange={(e) => setAcceptedSafety(e.target.checked)} className="mt-0.5 h-4 w-4" />I understand these security rules</label><Button asChild className="h-12 w-full rounded-2xl bg-[#a79bf3] text-[30px] font-semibold text-black" disabled={!acceptedSafety}><Link href={redirectTo}>Enter marketplace</Link></Button></div></CardStep>}
          </AnimatePresence>
        </section>
      </div>

      {showPerfect && <div className="fixed inset-0 z-40 flex items-center justify-center px-4"><div className="w-full max-w-[430px]"><div className="relative overflow-hidden rounded-[20px] border border-black/40 bg-[#06070a] text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]"><div className="border-b border-white/10"><DotProgress step={5} /></div><div className="relative px-5 pb-5 pt-6 sm:px-7"><div className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-[1px]" /><div className="relative z-10 rounded-2xl border border-white/10 bg-[#0a0c12]/95 p-6 text-white"><div className="mb-3 text-center text-5xl text-lime-400">?</div><h3 className="text-center text-5xl font-semibold">Perfect</h3><p className="mt-4 text-center text-[26px] leading-tight text-white/90">Your recovery phrase is correct.</p><p className="mt-2 text-center text-lg text-white/85">Remember: Never share this phrase with anyone.</p><Button type="button" className="mt-6 h-12 w-full rounded-xl bg-white text-[32px] font-medium text-black" onClick={() => { setShowPerfect(false); setStep(6); }}>Got it</Button></div></div></div></div></div>}
    </main>
  );
}


