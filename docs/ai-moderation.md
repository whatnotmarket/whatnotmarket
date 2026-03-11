# AI Moderation Layer

## Purpose
Questo documento descrive il layer AI usato dalla moderazione contenuti pubblici/semi-pubblici.

Principio operativo:
- AI come supporto semantico
- rules deterministic come base obbligatoria
- decisione finale ibrida (rules + AI)

## Critical exclusions
AI moderation NON viene utilizzata su:
- `/inbox`
- chat private
- direct messages
- private conversations

Questa esclusione e implementata in doppio punto:
- `src/lib/moderation/moderation.skip.ts`
- `src/lib/moderation/moderation.ai.service.ts` (`shouldSkipAI` + `excludedRoutes`)

## Where AI is called
Entry point:
- `src/lib/moderation/moderation.service.ts`

Quando `moderateContent()` riceve contenuto pubblico:
1. esegue rules deterministic
2. valuta `hardRuleBlock`
3. chiama `moderateWithAI()` solo se policy lo consente

Contenuti tipicamente analizzati da AI:
- creazione annuncio
- update annuncio
- commenti
- recensioni
- profilo pubblico/bio
- form pubblici
- report testuali

## Provider support and adapter pattern
Interface comune:
- `ModerationProvider` in `src/lib/moderation/moderation.ai.types.ts`

Adapter implementati:
- OpenAI: `src/lib/moderation/moderation.ai.adapters/openai.ts`
- Perspective: `src/lib/moderation/moderation.ai.adapters/perspective.ts`
- Custom: `src/lib/moderation/moderation.ai.adapters/custom.ts`
- None/fallback: gestito da `resolveAIProvider()` in `moderation.ai.service.ts`

Resolver:
- `src/lib/moderation/moderation.ai.service.ts`

## Prompt templates
File:
- `src/lib/moderation/moderation.ai.prompts.ts`

Funzioni:
- `buildModerationSystemPrompt()`
- `buildModerationUserPrompt(input)`

Caratteristiche prompt:
- classificatore, non conversational
- output JSON only
- supporto italiano/inglese/slang/evasion patterns
- categorie rischio predefinite

## AI categories
Categorie supportate (`MODERATION_AI_CATEGORIES`):
- spam
- scam
- off_platform_contact_attempt
- off_platform_payment_request
- phishing
- harassment
- hate_speech
- threat
- sexual_textual_content
- abusive_promotion
- suspicious_listing_language
- suspicious_public_profile_content
- risky_but_uncertain

## Output schema JSON
Validato con Zod in `moderation.ai.types.ts` (`aiClassifierOutputSchema`):

```json
{
  "decision": "allow | flag | review | block",
  "score": 0,
  "severity": "low | medium | high | critical",
  "categories": ["spam", "scam"],
  "reasonCodes": ["AI_SPAM_SIGNAL"],
  "confidence": 0.78,
  "explanation": "short internal explanation",
  "sanitizedText": "optional",
  "shouldReview": false,
  "shouldBlock": false
}
```

## AI request example
OpenAI adapter invia payload simile a:

```json
{
  "model": "gpt-4.1-mini",
  "temperature": 0,
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "... moderation instructions ..." },
    { "role": "user", "content": "{\"targetType\":\"listing_description\",\"route\":\"/api/requests/create\",\"text\":\"...\"}" }
  ]
}
```

## AI response example

```json
{
  "decision": "review",
  "score": 72,
  "severity": "high",
  "categories": ["scam", "off_platform_payment_request"],
  "reasonCodes": ["AI_SCAM_SIGNAL", "AI_OFF_PLATFORM_PAYMENT_SIGNAL"],
  "confidence": 0.82,
  "explanation": "Possible off-platform payment redirection",
  "shouldReview": true,
  "shouldBlock": false
}
```

## Invocation policy (cost/performance)
In `shouldSkipAI()`:
- skip se hard block rules gia presente
- skip se route esclusa/inbox/private
- skip se provider disabilitato
- skip se target non abilitato
- skip se testo corto e innocuo

Razionale:
- ridurre costo/latency
- evitare chiamate AI inutili
- mantenere robustezza anche con provider down

## Thresholds and confidence
Config centrale:
- `src/lib/moderation/moderation.ai.config.ts`

Chiavi principali:
- `aiConfidenceThreshold`
- `reviewThreshold`
- `blockThreshold`
- `minTextLengthForAI`
- `aiTimeoutMs`
- `retries`

Comportamento importante:
- se AI propone `block` ma confidence < threshold, il sistema puo degradare a `review`

## Error handling and fallback
- timeout/retry gestiti in adapter
- parse JSON robusto con `tryParseJsonObject`
- payload invalidi -> fallback safe
- provider error -> reason code `AI_PROVIDER_ERROR`
- sistema continua con rules-only, non interrompe il flusso

## Privacy and minimization
Il layer AI invia solo metadati minimi (`pickSafeAIMetadata`), ad esempio:
- category
- contentType
- locale/language
- formType

Non invia dati non necessari all'analisi semantica.

## Reason codes specific to AI
- `AI_MODERATION_FLAGGED`
- `AI_MODERATION_BLOCKED`
- `AI_SCAM_SIGNAL`
- `AI_SPAM_SIGNAL`
- `AI_HARASSMENT_SIGNAL`
- `AI_HATE_SIGNAL`
- `AI_THREAT_SIGNAL`
- `AI_SEXUAL_TEXT_SIGNAL`
- `AI_OFF_PLATFORM_CONTACT_SIGNAL`
- `AI_OFF_PLATFORM_PAYMENT_SIGNAL`
- `AI_PHISHING_SIGNAL`
- `AI_SUSPICIOUS_LISTING_LANGUAGE`
- `AI_BORDERLINE_REVIEW`
- `AI_CONFIDENCE_LOW`
- `AI_PROVIDER_ERROR`
- `AI_SKIPPED_INBOX_ROUTE`

## Quick extension guide
### Add a new provider
1. Crea nuovo adapter in `moderation.ai.adapters/`
2. Implementa `moderate(input): Promise<ModerationProviderResult>`
3. Registra provider in `resolveAIProvider()`
4. Aggiungi config/env in `moderation.ai.config.ts`

### Add a new category mapping
1. Aggiungi categoria in `MODERATION_AI_CATEGORIES`
2. Aggiorna mapping category->reason code nei singoli adapter
3. Aggiorna `blockReasonCodes`/`reviewReasonCodes` se necessario

## Non-goal reminder
Questo layer AI non sostituisce il rules engine.
E un layer di classificazione semantica sopra controlli deterministic.
