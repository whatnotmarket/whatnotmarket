# Moderation System Overview

## Scope and goals
Questo documento descrive il layer di moderazione centralizzato per contenuti pubblici e semi-pubblici.

Obiettivi principali:
- ridurre spam, scam, abuso e contenuti non conformi
- applicare decisioni consistenti (`allow`, `flag`, `review`, `block`)
- mantenere audit trail completo
- consentire estensione rapida (nuove regole, provider AI, nuove policy)

Ambito coperto dal layer `moderateContent()`:
- listing (titolo, descrizione)
- profilo pubblico (bio, username, full name)
- commenti pubblici
- recensioni
- form pubblici
- testo delle segnalazioni
- contenuti marketplace pubblici

Esclusione tassativa:
- route `/inbox`
- direct messages / private messaging
- endpoint privati chat/DM

La skip logic e centralizzata in:
- `src/lib/moderation/moderation.skip.ts`
- `src/lib/moderation/moderation.ai.service.ts` (anche per layer AI)

## High-level architecture
Percorso principale:

```text
User content
  -> moderateContent(input)
       -> shouldSkipModeration()
            -> (skip if inbox/private)
       -> evaluateRuleBasedModeration()
       -> moderateWithAI() [conditional]
       -> decision engine (merge rules + AI)
       -> writeModerationAudit()
       -> return ModerationResult
  -> API route decides DB behavior:
       allow/flag: publish or save
       review: queue/manual review state
       block: reject request
```

Flow richiesto (vista sintetica):

```text
User content
  ->
Rule-based moderation
  ->
AI moderation layer
  ->
Decision engine
  ->
Allow / Flag / Review / Block
```

## Core components (code map)
- Service orchestrator:
  - `src/lib/moderation/moderation.service.ts`
- Deterministic rules:
  - `src/lib/moderation/moderation.rules.ts`
- AI layer:
  - `src/lib/moderation/moderation.ai.service.ts`
  - `src/lib/moderation/moderation.ai.adapters/*`
  - `src/lib/moderation/moderation.ai.prompts.ts`
  - `src/lib/moderation/moderation.ai.config.ts`
- Skip logic:
  - `src/lib/moderation/moderation.skip.ts`
- Shared config/types/reason codes:
  - `src/lib/moderation/moderation.config.ts`
  - `src/lib/moderation/moderation.types.ts`
  - `src/lib/moderation/moderation.reason-codes.ts`
- Audit logging:
  - `src/lib/moderation/moderation.audit.ts`

## Pipeline details
### 1) Input validation and target gate
`moderateContent()` accetta solo target esplicitamente consentiti:
- `listing_title`
- `listing_description`
- `profile_bio`
- `username`
- `comment`
- `review`
- `public_form`
- `report_text`
- `marketplace_content`
- `generic_public_text`

Target non valido -> `block` con `PUBLIC_CONTENT_POLICY_VIOLATION`.

### 2) Skip policy (inbox/private)
`shouldSkipModeration(input)` verifica:
- pathname (`/inbox`, `/api/inbox`, `/api/chat/messages`, `/api/dm`, `/api/messages/private`)
- endpointTag contenente `inbox` o `private`
- `routeGroup === "inbox"`
- `context.isPrivateMessage === true`

Se skip:
- decision = `allow`
- reason code = `INBOX_ROUTE_EXCLUDED`
- AI reason code aggiuntivo = `AI_SKIPPED_INBOX_ROUTE`
- evento sempre loggato in `moderation_events`

### 3) Rule-based moderation
`evaluateRuleBasedModeration()`:
- normalizza testo
- applica regex/keywords
- produce score, severity, reason codes
- redige `sanitizedText` (redaction contatti/link)

### 4) AI moderation (conditional)
`moderateWithAI()` viene chiamata solo se policy lo consente.
Esempi di skip AI:
- route esclusa/inbox/private
- provider disabilitato
- target non abilitato
- testo troppo corto e non sospetto
- hard block deterministic gia rilevato

### 5) Decision engine
`moderation.service.ts` combina output rules + AI:
- precedence alta alle hard rules
- merge reason codes (dedupe)
- merge score (massimo tra rules e AI)
- scelta decisione piu restrittiva con downgrade da `block` a `review` se confidence AI bassa

### 6) Audit + review queue
`writeModerationAudit()` salva in:
- `moderation_events` (sempre)
- `moderation_reviews_queue` (solo se decision = `review`)

## Decision semantics
- `allow`: contenuto consentito
- `flag`: contenuto consentito ma tracciato per analytics/risk
- `review`: contenuto in verifica manuale o pubblicazione differita
- `block`: contenuto rifiutato

Messaggi utente (da `moderation.config.ts`):
- allow/flag: `Operazione completata.`
- review: `Il contenuto e stato inviato e sara verificato prima della pubblicazione.`
- block: `Il contenuto inviato non rispetta le linee guida della piattaforma.`
- blockPartial: `Alcuni elementi del testo non sono consentiti.`

## Integration points in API routes
Moderazione centralizzata gia integrata in:
- `src/app/api/requests/create/route.ts`
- `src/app/api/requests/[id]/update/route.ts`
- `src/app/api/offers/create/route.ts`
- `src/app/api/profile/public/update/route.ts`
- `src/app/api/reviews/submit/route.ts`
- `src/app/api/comments/submit/route.ts`
- `src/app/api/public/forms/submit/route.ts`
- `src/app/api/trust/report/route.ts`
- `src/app/actions/content-moderation.server.ts`

## Reason codes (moderation layer)
Catalogo reason codes del layer moderation (`src/lib/moderation/moderation.reason-codes.ts`):

| Code | Meaning | Source |
|---|---|---|
| SPAM_LINK_PATTERN | Link esterni rilevati | Rules |
| TOO_MANY_LINKS | Troppi link nel testo | Rules |
| EXTERNAL_CONTACT | Contatto esterno rilevato | Rules |
| PHONE_NUMBER_DETECTED | Numero telefono rilevato | Rules |
| EMAIL_DETECTED | Email rilevata | Rules |
| TELEGRAM_HANDLE_DETECTED | Handle/riferimento Telegram | Rules |
| WHATSAPP_REFERENCE | Riferimento WhatsApp | Rules |
| OFF_PLATFORM_PAYMENT | Richiesta pagamento esterno | Rules |
| SCAM_KEYWORDS | Keyword scam rilevate | Rules |
| HATE_SPEECH_SIGNAL | Segnale hate speech | Rules |
| HARASSMENT_SIGNAL | Segnale harassment | Rules |
| THREAT_SIGNAL | Segnale minaccia | Rules |
| SEXUAL_CONTENT_SIGNAL | Contenuto sessuale testuale | Rules |
| DUPLICATE_TEXT_PATTERN | Pattern testo duplicato | Rules |
| BANNED_KEYWORD | Keyword vietata | Rules |
| SUSPICIOUS_MARKETING_PATTERN | Marketing abusivo sospetto | Rules |
| AI_MODERATION_FLAGGED | AI ha segnalato rischio | AI |
| AI_MODERATION_BLOCKED | AI ha classificato block | AI |
| AI_SCAM_SIGNAL | Segnale scam AI | AI |
| AI_SPAM_SIGNAL | Segnale spam AI | AI |
| AI_HARASSMENT_SIGNAL | Segnale harassment AI | AI |
| AI_HATE_SIGNAL | Segnale hate speech AI | AI |
| AI_THREAT_SIGNAL | Segnale threat AI | AI |
| AI_SEXUAL_TEXT_SIGNAL | Segnale sexual text AI | AI |
| AI_OFF_PLATFORM_CONTACT_SIGNAL | Tentativo contatto esterno AI | AI |
| AI_OFF_PLATFORM_PAYMENT_SIGNAL | Off-platform payment AI | AI |
| AI_PHISHING_SIGNAL | Segnale phishing AI | AI |
| AI_SUSPICIOUS_LISTING_LANGUAGE | Linguaggio listing sospetto AI | AI |
| AI_BORDERLINE_REVIEW | Caso borderline da review | AI |
| AI_CONFIDENCE_LOW | Confidence AI sotto soglia | AI |
| AI_PROVIDER_ERROR | Errore provider AI | AI |
| AI_SKIPPED_INBOX_ROUTE | AI saltata per route esclusa/inbox | AI skip policy |
| PUBLIC_CONTENT_POLICY_VIOLATION | Violazione policy pubblica | Service |
| INBOX_ROUTE_EXCLUDED | Route inbox/private esclusa | Skip logic |

## Skip logic documentation
### Where
- `src/lib/moderation/moderation.skip.ts`
  - `isInboxRoute(pathname: string): boolean`
  - `shouldSkipModeration(input): { skip, skippedBecauseInbox, reasonCode }`
- `src/lib/moderation/moderation.ai.service.ts`
  - `shouldSkipAI(...)`

### How to modify
Per aggiungere nuove route private escluse:
1. Aggiorna `isInboxRoute()` in `moderation.skip.ts`
2. Aggiorna `MODERATION_AI_CONFIG.excludedRoutes` in `moderation.ai.config.ts`
3. Aggiorna eventuali `endpointTag` in route handlers
4. Aggiungi test in `tests/security/moderation-skip.test.ts`

## File structure documentation
Struttura reale attuale:

```text
src/
  lib/
    moderation/
      moderation.service.ts
      moderation.rules.ts
      moderation.skip.ts
      moderation.config.ts
      moderation.reason-codes.ts
      moderation.types.ts
      moderation.audit.ts
      moderation.ai.config.ts
      moderation.ai.types.ts
      moderation.ai.prompts.ts
      moderation.ai.service.ts
      moderation.ai.adapters/
        openai.ts
        perspective.ts
        custom.ts
```

Tabelle dati correlate:
- `moderation_events`
- `moderation_reviews_queue`
- `user_reviews`
- `public_comments`
- `public_form_submissions`

Migration:
- `supabase/migrations/20260311183000_content_moderation_system.sql`

## How to extend the system
### Add a new target type
1. Aggiungi il tipo in `ModerationTargetType` (`moderation.types.ts`)
2. Aggiungi il target nel set `ALLOWED_TARGETS` (`moderation.service.ts`)
3. Se serve AI su target, aggiungi in `MODERATION_AI_CONFIG.enabledTargets`
4. Integra il target in una route/server action

### Add a new deterministic rule
1. Definisci regex o check in `moderation.config.ts` o direttamente in `moderation.rules.ts`
2. Crea match con `id`, `severity`, `scoreImpact`, `reasonCode`
3. Aggiorna reason code list se necessario
4. Verifica threshold e outcome

### Add a new AI provider
1. Implementa adapter in `moderation.ai.adapters/`
2. Implementa `moderate(input)` che ritorna `ModerationProviderResult`
3. Aggiorna `resolveAIProvider()` in `moderation.ai.service.ts`
4. Aggiungi env/config in `moderation.ai.config.ts`

## Debugging guide (moderation)
### Caso: contenuto bloccato erroneamente
1. Cerca evento in `moderation_events` per `actor_id` + timeframe
2. Verifica `reason_codes` e `matched_rules`
3. Verifica `metadata.ai` (provider, categories, confidence)
4. Se AI e troppo aggressiva: alza `MODERATION_AI_CONFIDENCE_THRESHOLD` o `MODERATION_AI_BLOCK_THRESHOLD`
5. Se regola deterministic e troppo aggressiva: riduci `scoreImpact` o regex in `moderation.rules.ts`

### Caso: contenuto sospetto non rilevato
1. Verifica se la route e stata esclusa dalla skip logic
2. Verifica `targetType` usato nella route
3. Verifica se AI e stata invocata (`ai.invoked`)
4. Aggiungi regex/keyword nel rules engine o nuove categorie AI mapping

### Caso: provider AI non risponde
1. Controlla `AI_PROVIDER_ERROR` nei reason codes
2. Verifica env key/endpoint/timeout/retries
3. Il fallback e sempre rules-only (sistema non si ferma)

## Operational checklist
- aggiornare reason codes quando si aggiungono nuove regole
- mantenere centralizzata la skip policy inbox/private
- non integrare `moderateContent()` dentro route `/inbox` o DM
- monitorare daily volume in `moderation_reviews_queue`
- eseguire test sicurezza dopo ogni change (`npm run test:security`)
