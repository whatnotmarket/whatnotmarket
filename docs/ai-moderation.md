# AI Moderation

## Ambito
Il layer AI di moderazione e implementato in `src/lib/moderation/moderation.ai.service.ts` e viene usato per classificare rischi semantici su contenuti pubblici/semi-pubblici.

## Modelli/provider supportati
Configurati in `src/lib/moderation/moderation.ai.config.ts`:
- `openai` (default model: `gpt-4.1-mini`)
- `perspective` (Google Perspective API)
- `custom` (endpoint HTTP custom)
- `none` (AI disabilitata)

Adapter pattern:
- interfaccia comune `ModerationProvider` in `moderation.ai.types.ts`
- adapter concreti:
  - `src/lib/moderation/moderation.ai.adapters/openai.ts`
  - `src/lib/moderation/moderation.ai.adapters/perspective.ts`
  - `src/lib/moderation/moderation.ai.adapters/custom.ts`
- selezione runtime via `resolveAIProvider()`.

## Dove viene chiamata
Chiamata esclusivamente da `moderateContent()`:
- file: `src/lib/moderation/moderation.service.ts`
- funzione: `moderateWithAI(...)`
- step: dopo rule-based moderation, prima decision finale.

## Contenuti analizzati da AI
Target abilitati (default):
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

Nota: la lista e overrideabile con env `MODERATION_AI_ENABLED_TARGETS`.

## Contenuti esclusi (skip policy)
AI non viene utilizzata su:
- `/inbox`
- chat private
- direct messages
- private conversations

Implementazione:
- `isInboxRoute()` in `src/lib/moderation/moderation.skip.ts`
- check skip AI in `shouldSkipAI()` in `src/lib/moderation/moderation.ai.service.ts`
- route escluse default (`MODERATION_AI_EXCLUDED_ROUTES`):
  - `/inbox`
  - `/api/inbox`
  - `/api/chat/messages`
  - `/api/dm`
  - `/api/messages/private`

In skip policy, `ModerationResult.ai` espone:
- `invoked=false`
- `skippedByPolicy=true`
- `skippedReason` (`inbox_route` o `excluded_route`)
- reason code `AI_SKIPPED_INBOX_ROUTE`

## Prompt templates
File: `src/lib/moderation/moderation.ai.prompts.ts`

- `buildModerationSystemPrompt()`
  - impone output JSON puro
  - definisce categorie rischio da rilevare
  - impone decision set: `allow|flag|review|block`
- `buildModerationUserPrompt(input)`
  - serializza payload JSON con:
    - targetType, route, language, text, metadata
    - allowedCategories

## Output schema JSON
Definito da `aiClassifierOutputSchema` in `src/lib/moderation/moderation.ai.types.ts`.

Campi principali:
- `decision`: `allow | flag | review | block`
- `score`: `0..100`
- `severity`: `low | medium | high | critical`
- `categories`: array categorie AI
- `reasonCodes`: array stringhe (filtrate su reason code validi)
- `confidence`: `0..1`
- `explanation`: string breve
- opzionali: `sanitizedText`, `shouldReview`, `shouldBlock`

Categorie supportate:
- `spam`
- `scam`
- `off_platform_contact_attempt`
- `off_platform_payment_request`
- `phishing`
- `harassment`
- `hate_speech`
- `threat`
- `sexual_textual_content`
- `abusive_promotion`
- `suspicious_listing_language`
- `suspicious_public_profile_content`
- `risky_but_uncertain`

## Mapping categorie -> reason codes
Ogni adapter mappa categorie in reason code (`AI_*`).
Esempi:
- `scam` -> `AI_SCAM_SIGNAL`
- `off_platform_contact_attempt` -> `AI_OFF_PLATFORM_CONTACT_SIGNAL`
- `off_platform_payment_request` -> `AI_OFF_PLATFORM_PAYMENT_SIGNAL`
- `phishing` -> `AI_PHISHING_SIGNAL`
- `risky_but_uncertain` -> `AI_BORDERLINE_REVIEW`

## Soglie di rischio AI
Config in `moderation.ai.config.ts`:
- `aiConfidenceThreshold` (default `0.62`)
- `reviewThreshold` (default `45`)
- `blockThreshold` (default `78`)
- `minTextLengthForAI` (default `24`)

Logica importante:
- se decision AI non `allow` ma confidence sotto soglia:
  - aggiunge `AI_CONFIDENCE_LOW`
  - downgrade `block` -> `review`
- in `moderation.service.ts`, anche una `block` AI puo essere convertita in `review` con confidence bassa.

## Esempio richiesta AI (OpenAI adapter)

```json
{
  "model": "gpt-4.1-mini",
  "temperature": 0,
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "...system prompt..." },
    { "role": "user", "content": "{\"targetType\":\"listing_description\",\"route\":\"/api/requests/create\",\"text\":\"Scrivimi su Telegram per pagare fuori piattaforma\",\"allowedCategories\":[...]}" }
  ]
}
```

## Esempio risposta AI valida

```json
{
  "decision": "review",
  "score": 72,
  "severity": "high",
  "categories": ["off_platform_contact_attempt", "off_platform_payment_request"],
  "reasonCodes": ["AI_OFF_PLATFORM_CONTACT_SIGNAL", "AI_OFF_PLATFORM_PAYMENT_SIGNAL"],
  "confidence": 0.81,
  "explanation": "Richiesta di spostare contatto e pagamento fuori piattaforma",
  "shouldReview": true,
  "shouldBlock": false
}
```

## Error handling provider
Comportamento standard:
- timeout/retry gestiti via config (`aiTimeoutMs`, `retries`)
- payload invalido o errore HTTP/provider:
  - fallback su risultato allow
  - reason code `AI_PROVIDER_ERROR`
  - `explanation` con dettaglio errore

## Come cambiare provider attivo
Variabili principali:
- `MODERATION_AI_ENABLED=true|false`
- `MODERATION_PROVIDER=openai|perspective|custom|none`
- `MODERATION_OPENAI_MODEL=...`
- chiavi API provider (`OPENAI_API_KEY`, `PERSPECTIVE_API_KEY`, ecc.)

## Debug AI
1. Controllare `result.ai` in risposta moderation (`invoked`, `providerName`, `categories`, `confidence`, `skippedReason`).
2. Controllare `moderation_events.metadata.ai`.
3. Se `AI_PROVIDER_ERROR`, verificare endpoint, API key, timeout, formato JSON.
4. Se AI sembra non lavorare, verificare skip reason (`inbox_route`, `excluded_route`, `hard_rule_block`, `text_too_short`).


