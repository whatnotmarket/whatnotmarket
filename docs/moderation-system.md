# Moderation System Overview

## Scopo
Questo documento descrive l'architettura del sistema di moderazione contenuti pubblici/semi-pubblici implementato nel progetto, con focus su pipeline, decisioni, persistenza audit e integrazione con le API.

## Architettura ad alto livello
Entry point principale:
- `src/lib/moderation/moderation.service.ts` (`moderateContent`)

Componenti principali:
- Rule engine deterministico: `src/lib/moderation/moderation.rules.ts`
- Layer AI: `src/lib/moderation/moderation.ai.service.ts` + adapter provider
- Decision engine finale: logica in `moderation.service.ts`
- Skip policy: `src/lib/moderation/moderation.skip.ts`
- Config e soglie: `src/lib/moderation/moderation.config.ts`, `src/lib/moderation/moderation.ai.config.ts`
- Audit/eventi: `src/lib/moderation/moderation.audit.ts`

## Pipeline di moderazione

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

Versione operativa reale (semplificata):

```text
API Route / Server Action
  -> moderateContent(input)
    -> target validation (ALLOWED_TARGETS)
    -> shouldSkipModeration(input)?
      -> yes: allow + reason code skip + audit
      -> no:
        -> evaluateRuleBasedModeration(input)
        -> hard-rule-block?
          -> yes: AI saltata
          -> no: moderateWithAI(...)
        -> merge result (score, reason codes, severity, decision)
        -> writeModerationAudit(...)
          -> moderation_events
          -> moderation_reviews_queue (solo decision=review)
```

## Flusso completo: submission -> decision
1. Una route API (es. `src/app/api/requests/create/route.ts`) invia `targetType`, `text`, `actorId`, `entityId`, `context` a `moderateContent`.
2. `moderateContent` valida che `targetType` sia ammesso.
3. `shouldSkipModeration()` verifica esclusioni policy (inbox/private).
4. Se non skippata:
- viene eseguito il rules engine con score/reason codes deterministici;
- viene valutato hard block da regole severe;
- il layer AI viene eseguito solo se consentito.
5. Decision engine combina:
- suggested decision delle regole,
- reason-code based decision,
- decision AI (se invocata),
- confidenza AI (con downgrade block->review se sotto soglia).
6. Risultato finale contiene:
- `decision`, `severity`, `score`, `reasonCodes`, `sanitizedText`,
- metadati AI (`invoked`, provider, categorie, confidence, skip reason),
- `userMessage` pronto per UI/API.
7. Audit persistito in Supabase.

## Decision engine: regole di priorita
Implementato in `moderation.service.ts`.

Priorita principali:
- Reason code hard-block o score >= `blockScore` -> `block`
- Reason code review o score >= `reviewScore` -> `review`
- Score >= `flagScore` o almeno un reason code -> `flag`
- Nessun segnale -> `allow`

Ulteriori regole:
- Se esiste hard rule block (`hardRuleBlockReasonCodes` o rule score >= 90), AI non viene invocata.
- Se AI propone `block` ma confidence < `aiConfidenceThreshold`, la decisione viene ridotta a `review`.
- Il messaggio utente viene scelto da `decisionMessages` con variante `blockPartial` per contatti esterni.

## Target moderati
Validati da `ALLOWED_TARGETS` in `moderation.service.ts`:
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

Target non consentito:
- decision immediata `block`
- reason code `PUBLIC_CONTENT_POLICY_VIOLATION`
- AI non invocata
- evento audit scritto

## Skip logic (overview)
`shouldSkipModeration()` in `src/lib/moderation/moderation.skip.ts` salta moderazione quando:
- route inbox/private (`/inbox`, `/api/inbox`, `/api/chat/messages`, `/api/dm`, `/api/messages/private`)
- `endpointTag` contiene `inbox` o `private`
- `routeGroup === "inbox"`
- `context.isPrivateMessage === true`

Output in skip:
- decision `allow`
- reason codes includono `INBOX_ROUTE_EXCLUDED` + `AI_SKIPPED_INBOX_ROUTE`
- AI marcata `skippedByPolicy=true`
- audit comunque registrato (`moderation_events`)

## Integrazione col sito (punti principali)
Moderazione contenuti pubblici:
- `src/app/api/requests/create/route.ts`
- `src/app/api/requests/[id]/update/route.ts`
- `src/app/api/comments/submit/route.ts`
- `src/app/api/reviews/submit/route.ts`
- `src/app/api/profile/public/update/route.ts`
- `src/app/api/public/forms/submit/route.ts`
- `src/app/api/trust/report/route.ts`
- `src/app/api/offers/create/route.ts`
- `src/app/actions/content-moderation.server.ts`

Messaggistica privata:
- `src/app/api/chat/messages/route.ts` usa trust chat safety (`src/lib/trust/services/chat-safety.ts`) e non passa da `moderateContent`.

Global chat:
- `src/app/api/global-chat/messages/route.ts` usa policy dedicata `src/lib/chat/global-chat-moderation.ts`.

## Audit, review queue ed eventi
Persistenza moderation service:
- `moderation_events` (sempre)
- `moderation_reviews_queue` (solo quando `decision === "review"`)

Campi principali audit (`moderation.audit.ts`):
- target/entity/actor
- decision/severity/score
- reason codes/matched rules
- route
- `original_excerpt` e `sanitized_excerpt`
- metadata AI (`providerName`, categories, confidence, skippedReason)

## Reason codes: panoramica
Reason codes moderation (set completo):
- `SPAM_LINK_PATTERN`, `TOO_MANY_LINKS`, `EXTERNAL_CONTACT`
- `PHONE_NUMBER_DETECTED`, `EMAIL_DETECTED`, `TELEGRAM_HANDLE_DETECTED`, `WHATSAPP_REFERENCE`
- `OFF_PLATFORM_PAYMENT`, `SCAM_KEYWORDS`
- `HATE_SPEECH_SIGNAL`, `HARASSMENT_SIGNAL`, `THREAT_SIGNAL`, `SEXUAL_CONTENT_SIGNAL`
- `DUPLICATE_TEXT_PATTERN`, `BANNED_KEYWORD`, `SUSPICIOUS_MARKETING_PATTERN`
- `AI_MODERATION_FLAGGED`, `AI_MODERATION_BLOCKED`
- `AI_SCAM_SIGNAL`, `AI_SPAM_SIGNAL`, `AI_HARASSMENT_SIGNAL`, `AI_HATE_SIGNAL`, `AI_THREAT_SIGNAL`
- `AI_SEXUAL_TEXT_SIGNAL`, `AI_OFF_PLATFORM_CONTACT_SIGNAL`, `AI_OFF_PLATFORM_PAYMENT_SIGNAL`
- `AI_PHISHING_SIGNAL`, `AI_SUSPICIOUS_LISTING_LANGUAGE`, `AI_BORDERLINE_REVIEW`
- `AI_CONFIDENCE_LOW`, `AI_PROVIDER_ERROR`, `AI_SKIPPED_INBOX_ROUTE`
- `PUBLIC_CONTENT_POLICY_VIOLATION`, `INBOX_ROUTE_EXCLUDED`

Definizioni centrali:
- `src/lib/moderation/moderation.types.ts`
- `src/lib/moderation/moderation.reason-codes.ts`

## File structure (moderation)

```text
src/
  lib/
    moderation/
      moderation.service.ts
      moderation.rules.ts
      moderation.config.ts
      moderation.skip.ts
      moderation.audit.ts
      moderation.reason-codes.ts
      moderation.types.ts
      moderation.ai.config.ts
      moderation.ai.prompts.ts
      moderation.ai.service.ts
      moderation.ai.types.ts
      moderation.ai.adapters/
        openai.ts
        perspective.ts
        custom.ts
```

## Estensione rapida
- Nuova regola deterministica: aggiungere pattern/config in `moderation.config.ts`, applicazione in `moderation.rules.ts`, reason code in `moderation.types.ts` e `moderation.reason-codes.ts`.
- Nuovo provider AI: nuovo adapter in `moderation.ai.adapters/`, registrazione in `resolveAIProvider()` (`moderation.ai.service.ts`).
- Nuove soglie: `moderation.config.ts` e/o `moderation.ai.config.ts`.
- Nuovo target moderabile: aggiungere tipo in `ModerationTargetType`, poi whitelist in `ALLOWED_TARGETS` e `enabledTargets` AI.

## Debug rapido
1. Verificare output route/API (`decision`, `reasonCodes`, `message`).
2. Verificare `moderation_events`:
- score, matched rules, reason codes, metadata.ai.
3. Se review attesa ma assente, controllare insert su `moderation_reviews_queue`.
4. Se AI non invocata, controllare `ai.skippedReason`:
- `inbox_route`, `excluded_route`, `text_too_short`, `disabled`, `hard_rule_block`, `target_not_enabled`.
5. Se mismatch decisionale, ricostruire:
- rule score,
- reason code block/review sets,
- confidence AI vs `aiConfidenceThreshold`.


