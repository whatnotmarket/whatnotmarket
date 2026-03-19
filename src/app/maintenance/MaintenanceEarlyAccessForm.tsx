"use client";

import { useMemo, useState, type FormEvent } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function MaintenanceEarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const isBusy = state === "loading";
  const canSubmit = useMemo(() => email.trim().length > 3 && !isBusy, [email, isBusy]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/maintenance/early-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          website: website.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        setState("error");
        setMessage(result?.error || "Unable to submit right now. Please try again shortly.");
        return;
      }

      setState("success");
      setMessage(result.message || "Thanks, you're in. We'll contact you soon.");
      setEmail("");
      setWebsite("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="maintenance-early-access" aria-labelledby="maintenance-early-access-title">
      <h2 id="maintenance-early-access-title" className="maintenance-early-access-title">
        Join Early Access
      </h2>
      <p className="maintenance-early-access-copy">
        Leave your email to unlock reduced buyer and seller transaction fees.
      </p>
      <form className="maintenance-early-access-form" onSubmit={onSubmit} noValidate>
        <label className="maintenance-early-access-label" htmlFor="maintenance-early-email">
          Email
        </label>
        <input
          id="maintenance-early-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@domain.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="maintenance-early-access-input"
          required
          disabled={isBusy}
          aria-describedby="maintenance-early-status"
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="maintenance-early-access-honeypot"
          aria-hidden="true"
        />
        <button type="submit" className="maintenance-early-access-cta" disabled={!canSubmit}>
          {isBusy ? "Submitting..." : "Get Early Access"}
        </button>
      </form>
      <p
        id="maintenance-early-status"
        className={`maintenance-early-access-status maintenance-early-access-status-${state}`}
        role="status"
        aria-live="polite"
      >
        {message || "\u00a0"}
      </p>
    </section>
  );
}
