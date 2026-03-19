"use client";

import { useMemo, useState, type FormEvent } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function MaintenanceEarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [lastConfirmedEmail, setLastConfirmedEmail] = useState("");

  const isBusy = state === "loading";
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const isEmailValid = useMemo(
    () => EMAIL_PATTERN.test(normalizedEmail) && normalizedEmail.length <= 320,
    [normalizedEmail]
  );
  const canSubmit = useMemo(() => isEmailValid && !isBusy, [isEmailValid, isBusy]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid) {
      setState("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (normalizedEmail === lastConfirmedEmail) {
      setState("error");
      setMessage("This email is already in early access.");
      return;
    }

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
        if (response.status === 409) {
          setMessage("This email is already in early access.");
          return;
        }

        setMessage(result?.error || "Unable to submit right now. Please try again shortly.");
        return;
      }

      setState("success");
      setMessage(result.message || "Thanks, you're in. We'll contact you soon.");
      setLastConfirmedEmail(normalizedEmail);
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
        <div className="maintenance-early-access-input-wrap">
          <input
            id="maintenance-early-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
            placeholder="name@domain.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="maintenance-early-access-input"
            required
            disabled={isBusy}
            aria-invalid={state === "error"}
            aria-describedby="maintenance-early-status"
          />
          <button type="submit" className="maintenance-early-access-cta" disabled={!canSubmit}>
            {isBusy ? "Submitting..." : "Get Early Access"}
          </button>
        </div>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="maintenance-early-access-honeypot"
          aria-hidden="true"
        />
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
