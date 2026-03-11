# Security and Anti-Scam System

## Objectives
Il sistema Trust & Safety e progettato per ridurre:
- account fake
- spam/scam
- annunci fraudolenti
- off-platform payment/contact
- abuse operativo (burst, mass messaging)
- ban evasion / account takeover

Filosofia operativa: frizione progressiva.
Utenti buoni hanno UX fluida; utenti rischiosi ricevono limiti crescenti.

## Architecture layers
### Layer 1: Prevenzione
- rate limiting (`src/lib/rate-limit.ts`)
- abuse guard IP/device (`src/lib/security/abuse-guards.ts`)
- onboarding guard per account nuovi (`src/lib/trust/services/onboarding-security.ts`)

### Layer 2: Rilevazione
- rule-based moderation pubblica (`src/lib/moderation/*`)
- chat/listing pattern detection (`src/lib/trust/detection.ts`)
- user/listing/conversation risk scoring (`src/lib/trust/scoring/*`)

### Layer 3: Policy enforcement
- user policy (`evaluateUserRiskPolicy`)
- listing policy (`evaluateListingRiskPolicy`)
- conversation policy (`evaluateConversationRiskPolicy`)

### Layer 4: Audit + moderation queue
- trust events/snapshots/cases/audit logs (`src/lib/trust/services/trust-store.ts`)
- moderation events + reviews queue (`src/lib/moderation/moderation.audit.ts`)

## Trust scoring
### User risk (`calculateUserRiskScore`)
Signals principali:
- account age
- email/phone verification
- device count
- anomalous login
- listing/message velocity
- reports and blocked conversations
- profile mutation velocity
- geo/device mismatch
- VPN/proxy/TOR hints
- dispute/refund rates
- signup attempts spikes
- multi-account device matches
- repeat offender pattern

### Listing risk (`calculateListingRiskScore`)
Signals principali:
- price deviation vs category median
- external contact in listing
- off-platform payment request
- duplicate image/text similarity
- listing velocity
- cross-category duplication
- suspicious keyword hits
- vague description

### Conversation risk (`calculateConversationRiskScore`)
Signals principali:
- external links/contact attempts
- redirect to Telegram/WhatsApp
- deposit/advance payment request
- urgency manipulation
- phishing language
- repeated template count
- mass outreach recipients

## Progressive limitations
### User-level actions
Da `evaluateUserRiskPolicy`:
- `ALLOW`
- `ALLOW_WITH_WARNING`
- `LIMIT_ACTION`
- `PENDING_REVIEW`
- `SUSPEND`

### Listing-level actions
Da `evaluateListingRiskPolicy`:
- `published`
- `pending_review`
- `restricted`
- `removed`

Visibility:
- `normal`
- `limited`
- `shadowed`

### Conversation-level actions
Da `evaluateConversationRiskPolicy`:
- warning only
- soft block + redaction
- hard block

## Shadow limitations and escalation
Shadow limitation avviene quando il rischio e alto ma non si vuole ban immediato.
Esempi:
- listing `restricted` con visibilita ridotta
- account `under_review` con funzioni limitate

Escalation automatica:
- creazione case in `trust_moderation_cases`
- inserimento eventi in `trust_risk_events`
- aggiornamento snapshot in `trust_risk_snapshots`

## Chat protections
### Direct chat and global chat safety
Servizio: `src/lib/trust/services/chat-safety.ts`
Usato in:
- `src/app/api/chat/messages/route.ts`
- `src/app/api/global-chat/messages/route.ts`

Controlli:
- message normalization
- velocity detection (template repetition, outreach fanout)
- risk scoring + policy
- redaction di contatti esterni quando richiesto
- blocco messaggi ad alto rischio

Nota importante:
- il layer AI di moderation contenuti pubblici non viene eseguito su `/inbox`
- la chat safety usa policy trust dedicate (separate dal layer AI pubblico)

## Listing protections
Servizio: `src/lib/trust/services/listing-safety.ts`

Flusso:
1. pattern detection testo
2. stima prezzo mediano categoria
3. segnali duplicazione testo
4. scoring listing
5. policy decision (publish/review/restrict/remove)
6. persistenza eventi + case

## Reporting and moderation operations
- user report API: `src/app/api/trust/report/route.ts`
- review queue admin: `src/app/api/admin/trust/review-queue/route.ts`
- case action admin: `src/app/api/admin/trust/cases/[caseId]/action/route.ts`
- account timeline admin: `src/app/api/admin/trust/account/[userId]/timeline/route.ts`

## Account takeover and ban evasion defense
Servizio: `src/lib/trust/services/auth-security.ts`

Funzioni:
- `recordAuthSecurityEvent`
- `detectBanEvasionRisk`

Controlli:
- match device/ip con account sospesi
- trust state downgrade a `under_review`/`suspended`
- audit log con reason code `BAN_EVASION_LINKED_ACCOUNT`

## Review integrity
Servizio: `src/lib/trust/services/review-integrity.ts`

Controlli:
- review senza interazione valida
- burst di recensioni
- peso ridotto per reviewer low trust

Output:
- risk score review
- queue/block decisions
- eventi su `trust_review_integrity_events`

## Data model and audit tables
Migration principali:
- `supabase/migrations/20260311170000_trust_safety_core.sql`
- `supabase/migrations/20260311183000_content_moderation_system.sql`

Tabelle chiave:
- `trust_account_states`
- `trust_device_signals`
- `trust_account_links`
- `trust_risk_events`
- `trust_risk_snapshots`
- `trust_reports`
- `trust_moderation_cases`
- `trust_moderation_actions`
- `trust_security_events`
- `trust_review_integrity_events`
- `trust_audit_logs` (immutability trigger)
- `moderation_events`
- `moderation_reviews_queue`

## Sync vs async controls
### Sync (request-time)
- moderation rules + AI (public content)
- onboarding/action guards
- chat safety decision
- listing validation pre-publish
- rate limit / abuse guard

### Async
- risk recalculation worker (`src/lib/trust/workers/recalculate-risk.ts`)
- admin review workflows
- moderation case lifecycle

## Operational recommendations
- monitorare:
  - spike in `trust_risk_events`
  - pending size in `trust_moderation_cases`
  - pending size in `moderation_reviews_queue`
- ricalcolare rischio periodicamente (admin recalculate endpoint)
- mantenere reason codes stabili per analytics longitudinali
