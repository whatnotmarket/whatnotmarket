# Configuration Guide

## Panoramica
Le configurazioni del sistema moderation/security/anti-scam sono distribuite in moduli distinti.

File principali:
- Moderation core: `src/lib/moderation/moderation.config.ts`
- AI moderation: `src/lib/moderation/moderation.ai.config.ts`
- Trust/Safety config: `src/lib/trust/config.ts`
- Mapping reason code: `src/lib/moderation/moderation.reason-codes.ts`, `src/lib/trust/reason-codes.ts`

## 1) Moderation thresholds e severity
File: `moderation.config.ts`

Configurazioni:
- `thresholds.flagScore`
- `thresholds.reviewScore`
- `thresholds.blockScore`
- `severityRank` (`none`, `low`, `medium`, `high`, `critical`)

Esempio:

```ts
export const MODERATION_CONFIG = {
  thresholds: {
    flagScore: 10,
    reviewScore: 25,
    blockScore: 50,
  },
  ...
}
```

Quando modificare:
- Alzare `blockScore` se troppi falsi positivi bloccano contenuti validi.
- Abbassare `reviewScore` se vuoi aumentare campionamento manuale.

## 2) Rule limits e pattern
File: `moderation.config.ts`

Blocchi configurabili:
- `limits.maxTextLength`
- `limits.maxAllowedLinks`
- `patterns.*Regex`
- `keywords.banned`
- `blockReasonCodes`
- `reviewReasonCodes`

Impatto:
- Cambiare regex cambia il perimetro dei segnali deterministici.
- Cambiare set block/review reason codes impatta direttamente la decisione finale.

## 3) AI configuration
File: `moderation.ai.config.ts`

Flag principali:
- `MODERATION_AI_ENABLED`
- `MODERATION_PROVIDER=openai|perspective|custom|none`
- `MODERATION_OPENAI_MODEL`
- `MODERATION_AI_TIMEOUT_MS`
- `MODERATION_AI_RETRIES`
- `MODERATION_AI_MIN_TEXT_LENGTH`
- `MODERATION_AI_CONFIDENCE_THRESHOLD`
- `MODERATION_AI_REVIEW_THRESHOLD`
- `MODERATION_AI_BLOCK_THRESHOLD`
- `MODERATION_AI_ENABLED_TARGETS` (lista CSV)
- `MODERATION_AI_EXCLUDED_ROUTES` (lista CSV)

Provider settings:
- OpenAI:
  - `OPENAI_API_KEY`
  - `MODERATION_OPENAI_ENDPOINT`
- Perspective:
  - `PERSPECTIVE_API_KEY`
  - `PERSPECTIVE_ENDPOINT`
- Custom:
  - `MODERATION_CUSTOM_PROVIDER_URL`
  - `MODERATION_CUSTOM_PROVIDER_API_KEY`

## 4) Trust/Security thresholds
File: `src/lib/trust/config.ts`

Configurazioni chiave:
- `scoring.user|listing|conversation.riskLevels`
- `policies.user` (`warnAt`, `limitAt`, `reviewAt`, `suspendAt`)
- `policies.listing` (`warningAt`, `pendingReviewAt`, `restrictedAt`, `removedAt`)
- `policies.conversation` (`warningAt`, `softBlockAt`, `hardBlockAt`)
- onboarding limits:
  - `dailyMessageLimitForNewAccount`
  - `dailyListingLimitForNewAccount`
  - `dailyOfferLimitForNewAccount`
  - `blockExternalContactsForNewAccounts`

## 5) Abuse guard configuration
File: `src/lib/security/abuse-guards.ts`

Elementi configurabili via env:
- `ABUSE_SIGNAL_SALT`

Scoring/decision thresholds:
- in `src/lib/security/abuse-scoring.ts` (logica hardcoded a pesi)

## 6) Moderation toggles nel codice applicativo
Pattern usato nelle route:
- call `moderateContent(...)`
- branch su `shouldBlock` / `shouldReview`
- se review: impostazione status `pending_review` e visibilita ridotta se disponibile

Esempio reale: `src/app/api/requests/create/route.ts`.

## Come modificare: blocchi automatici
1. Aggiorna `blockReasonCodes` in `moderation.config.ts`.
2. Se necessario, aggiorna i `scoreImpact` in `moderation.rules.ts`.
3. Verifica se `hardRuleBlockReasonCodes` (AI config) deve includere il nuovo reason code.

## Come modificare: review thresholds
1. Rule-level: `MODERATION_CONFIG.thresholds.reviewScore`.
2. AI-level: `MODERATION_AI_REVIEW_THRESHOLD`.
3. Trust listing/conversation policy:
- `TRUST_SAFETY_CONFIG.policies.listing.pendingReviewAt`
- `TRUST_SAFETY_CONFIG.policies.conversation.softBlockAt`

## Come modificare: categorie abilitate
AI categories:
- enum in `moderation.ai.types.ts` (`MODERATION_AI_CATEGORIES`)
- mapping category->reason code dentro adapter (`openai.ts`, `custom.ts`, `perspective.ts`)

Trust categories (report):
- payload `category` in `src/app/api/trust/report/route.ts`
- priorita/livello in `computePriorityFromCategory`, `computeRiskLevelFromCategory`

## Come cambiare provider AI attivo
Config rapida:

```env
MODERATION_AI_ENABLED=true
MODERATION_PROVIDER=openai
MODERATION_OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=...
```

Per passare a custom:

```env
MODERATION_PROVIDER=custom
MODERATION_CUSTOM_PROVIDER_URL=https://your-provider/moderate
MODERATION_CUSTOM_PROVIDER_API_KEY=...
```

## Esempio completo `moderation.config.ts`

```ts
export const MODERATION_CONFIG = {
  thresholds: { flagScore: 10, reviewScore: 25, blockScore: 50 },
  limits: { maxTextLength: 8000, maxAllowedLinks: 2 },
  patterns: {
    urlRegex: /\b(?:https?:\/\/|www\.)[^\s]+/gi,
    emailRegex: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    phoneRegex: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g,
  },
  ...
}
```

## Checklist post-config change
1. Eseguire lint e typecheck.
2. Testare almeno:
- caso allow
- caso review
- caso block
- caso skip inbox/private
3. Verificare persistenza eventi:
- `moderation_events`
- `moderation_reviews_queue`
- `trust_risk_events` / `trust_moderation_cases` (se coinvolto trust).


