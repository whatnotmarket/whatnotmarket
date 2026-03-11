# Configuration Guide

## Overview
Questa guida raccoglie tutte le configurazioni modificabili per:
- moderation rules + AI
- trust/anti-scam policies
- abuse guard e rate limits

## File map
Configurazioni principali:
- `src/lib/moderation/moderation.config.ts`
- `src/lib/moderation/moderation.ai.config.ts`
- `src/lib/trust/config.ts`
- `src/lib/rate-limit.ts`

Reason codes:
- `src/lib/moderation/moderation.reason-codes.ts`
- `src/lib/trust/reason-codes.ts`

## Moderation config
File: `src/lib/moderation/moderation.config.ts`

### Thresholds
```ts
thresholds: {
  flagScore: 10,
  reviewScore: 25,
  blockScore: 50,
}
```

### Limits
```ts
limits: {
  maxTextLength: 8000,
  maxAllowedLinks: 2,
}
```

### Pattern set
Regex principali:
- URL
- email
- phone
- Telegram/WhatsApp/Discord/Instagram
- scam/phishing
- threat/harassment/hate/sexual
- duplicate token

### Decision mapping
- `blockReasonCodes` -> forza block
- `reviewReasonCodes` -> forza review
- `decisionMessages` -> microcopy UI

## AI moderation config
File: `src/lib/moderation/moderation.ai.config.ts`

### Runtime toggles
- `enabled`
- `provider`
- `enabledTargets`
- `excludedRoutes`

### AI thresholds
- `minTextLengthForAI`
- `aiConfidenceThreshold`
- `reviewThreshold`
- `blockThreshold`

### Performance
- `aiTimeoutMs`
- `retries`

### Provider settings
- `openai.apiKey`, `openai.endpoint`, `model`
- `perspective.apiKey`, `perspective.endpoint`
- `custom.endpoint`, `custom.apiKey`

## Trust & anti-scam config
File: `src/lib/trust/config.ts`

### Risk level boundaries
Per user/listing/conversation:
```ts
riskLevels: {
  lowMax: 24,
  mediumMax: 49,
  highMax: 74,
}
```

### Policy thresholds
User:
- warnAt: 25
- limitAt: 40
- reviewAt: 60
- suspendAt: 85

Listing:
- warningAt: 25
- pendingReviewAt: 45
- restrictedAt: 70
- removedAt: 90

Conversation:
- warningAt: 20
- softBlockAt: 45
- hardBlockAt: 70

### Onboarding security
- `newAccountWindowHours`
- `strictWindowHours`
- `dailyMessageLimitForNewAccount`
- `dailyListingLimitForNewAccount`
- `dailyOfferLimitForNewAccount`
- `blockExternalContactsForNewAccounts`
- `requirePhoneForHighRiskActions`

## Rate limiting config
File: `src/lib/rate-limit.ts`

`RATE_LIMIT_CONFIGS` contiene limiti per action (`request_create`, `offer_create`, `comment_submit`, ecc.).

Per cambiare un limite:
1. cerca action in `RateLimitAction`
2. aggiorna `RATE_LIMIT_CONFIGS[action]`
3. verifica route che usano `checkRateLimitDetailed`

## Environment variables
Variabili principali usate dal layer moderation/AI:

```bash
MODERATION_AI_ENABLED=true
MODERATION_PROVIDER=openai
MODERATION_OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=...
MODERATION_OPENAI_ENDPOINT=https://api.openai.com/v1/chat/completions

PERSPECTIVE_API_KEY=...
PERSPECTIVE_ENDPOINT=https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze

MODERATION_CUSTOM_PROVIDER_URL=
MODERATION_CUSTOM_PROVIDER_API_KEY=

MODERATION_AI_TIMEOUT_MS=6000
MODERATION_AI_RETRIES=1
MODERATION_AI_MIN_TEXT_LENGTH=24
MODERATION_AI_CONFIDENCE_THRESHOLD=0.62
MODERATION_AI_REVIEW_THRESHOLD=45
MODERATION_AI_BLOCK_THRESHOLD=78
MODERATION_AI_ENABLED_TARGETS=listing_title,listing_description,comment,review
MODERATION_AI_EXCLUDED_ROUTES=/inbox,/api/inbox,/api/chat/messages,/api/dm,/api/messages/private
```

## Common change scenarios
### A) Rendere il sistema piu severo
- abbassa `blockScore` e `reviewScore` in `moderation.config.ts`
- aggiungi reason codes in `blockReasonCodes`
- abbassa `MODERATION_AI_BLOCK_THRESHOLD`

### B) Ridurre falsi positivi
- alza `reviewScore`/`blockScore`
- riduci `scoreImpact` delle regole rumorose
- alza `MODERATION_AI_CONFIDENCE_THRESHOLD`

### C) Disabilitare AI temporaneamente
- `MODERATION_PROVIDER=none` oppure `MODERATION_AI_ENABLED=false`
- il sistema continua in mode rules-only

### D) Abilitare AI solo su target critici
- set `MODERATION_AI_ENABLED_TARGETS` con subset (es. listing + review)

## Governance recommendations
- fare change piccoli e misurabili
- tracciare impatto su `moderation_events` e `moderation_reviews_queue`
- aggiornare docs + reason codes in ogni modifica rilevante
- testare sempre:
  - `npx tsc --noEmit`
  - `npx eslint src/lib/moderation src/lib/trust`
  - `npm run test:security`
