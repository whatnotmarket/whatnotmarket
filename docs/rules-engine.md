# Rules Engine

## Obiettivo
Questo documento copre le regole deterministiche del sistema di moderazione e dove modificarle.

File principale:
- `src/lib/moderation/moderation.rules.ts`

Config regex/keyword/soglie:
- `src/lib/moderation/moderation.config.ts`

Reason code registry:
- `src/lib/moderation/moderation.reason-codes.ts`
- `src/lib/moderation/moderation.types.ts`

## Come funziona
`evaluateRuleBasedModeration(input)`:
1. normalizza testo (`normalizeText`)
2. conta match regex (`countRegexMatches`)
3. aggiunge match con `addMatch` (id, severity, scoreImpact, reasonCode)
4. calcola score totale (cap a 100)
5. derivazione severity (`severityFromScore`) e decision suggerita (`decisionFromScore`)
6. restituisce `sanitizedText` con redazione dati sensibili

## Soglie decisione (rule layer)
- `flagScore = 10`
- `reviewScore = 25`
- `blockScore = 50`

Config: `MODERATION_CONFIG.thresholds`.

## Regole deterministiche implementate

### Link detection
- Cosa rileva: URL esterni (`http`, `https`, `www`)
- Dove: `MODERATION_CONFIG.patterns.urlRegex`
- Trigger:
  - `linksCount > 0` -> reason code `SPAM_LINK_PATTERN`, impatto 10
  - `linksCount > maxAllowedLinks` (`2`) -> `TOO_MANY_LINKS`, impatto 20
- Effetto: flag/review in base a score/ragione

Esempio:
- Input: `Guarda https://example.com e https://foo.com e https://bar.com`
- Output tipico: `TOO_MANY_LINKS`

### Email detection
- Cosa rileva: indirizzi email
- Dove: `patterns.emailRegex`
- Trigger: `EMAIL_DETECTED`, severity high, impatto 18
- Effetto: contribuisce anche a `EXTERNAL_CONTACT`

### Phone detection
- Cosa rileva: numeri telefono
- Dove: `patterns.phoneRegex`
- Trigger: `PHONE_NUMBER_DETECTED`, impatto 18
- Effetto: contribuisce anche a `EXTERNAL_CONTACT`

### Telegram / WhatsApp / contact handles
- Cosa rileva:
  - Telegram (`telegram`, `t.me`, `@handle`)
  - WhatsApp (`whatsapp`, `wa.me`)
- Dove: `patterns.telegramRegex`, `patterns.whatsappRegex`
- Trigger:
  - `TELEGRAM_HANDLE_DETECTED` (20)
  - `WHATSAPP_REFERENCE` (20)
  - aggregato `EXTERNAL_CONTACT` (22) se presente email/phone/telegram/whatsapp
- Effetto: tipicamente review o block parziale

### External contact detection (aggregata)
- Cosa rileva: presenza complessiva di canali contatto esterni nel contenuto pubblico
- Dove: logica aggregata in `moderation.rules.ts` (`if (emailCount + phoneCount + telegramCount + whatsappCount > 0)`)
- Trigger: `EXTERNAL_CONTACT`
- Effetto: reason code di review; in decision engine puo produrre messaggio `blockPartial`

### Scam/off-platform payment keywords
- Cosa rileva: keyword tipo caparra, anticipo, pagamento esterno, gift card, western union
- Dove: `patterns.scamRegex`
- Trigger:
  - `SCAM_KEYWORDS` (24)
  - `OFF_PLATFORM_PAYMENT` (22)
- Effetto: review/block secondo score e ragioni

### Phishing detection
- Cosa rileva: seed phrase, private key, wallet recovery, claim airdrop, ecc.
- Dove: `patterns.phishingRegex`
- Trigger: `PUBLIC_CONTENT_POLICY_VIOLATION`, severity critical, impatto 35
- Effetto: spesso block diretto (reason code hard-block)

### Hate speech detection
- Cosa rileva: pattern hate speech
- Dove: `patterns.hateSpeechRegex`
- Trigger: `HATE_SPEECH_SIGNAL`, impatto 45
- Effetto: hard block reason code

### Threat detection
- Cosa rileva: minacce esplicite
- Dove: `patterns.threatRegex`
- Trigger: `THREAT_SIGNAL`, impatto 45
- Effetto: hard block

### Harassment detection
- Cosa rileva: insulti/harassment
- Dove: `patterns.harassmentRegex`
- Trigger: `HARASSMENT_SIGNAL`, impatto 25
- Effetto: review/block secondo combinazione segnali

### Sexual explicit textual content
- Cosa rileva: testo sessualmente esplicito
- Dove: `patterns.sexualExplicitRegex`
- Trigger: `SEXUAL_CONTENT_SIGNAL`, impatto 45
- Effetto: hard block

### Duplicate text pattern
- Cosa rileva: token ripetuto molte volte
- Dove: `patterns.duplicateTokenRegex`
- Trigger: `DUPLICATE_TEXT_PATTERN`, impatto 12
- Effetto: flag/review anti-spam

### Suspicious marketing pattern
- Cosa rileva: claim promozionali anomali (`guadagno garantito`, `100% legit`, ecc.)
- Dove: `patterns.suspiciousMarketingRegex`
- Trigger: `SUSPICIOUS_MARKETING_PATTERN`, impatto 12

### Banned keyword filter
- Cosa rileva: keyword bannate esplicite
- Dove: `MODERATION_CONFIG.keywords.banned`
- Trigger: `BANNED_KEYWORD`, impatto 35
- Effetto: hard block

### Vague listing heuristic
- Cosa rileva: testo corto/vago tipo `contattami`, `scrivimi`, `solo seri`
- Dove: regola euristica finale in `moderation.rules.ts`
- Trigger: `SCAM_KEYWORDS` con impatto 10

## Redazione contenuto sensibile
`redactSensitiveContent()` sostituisce con placeholder:
- email -> `[email-hidden]`
- phone -> `[phone-hidden]`
- link -> `[link-hidden]`
- handle social/messenger -> `[handle-hidden]`

Questo `sanitizedText` viene usato in storage/response quando opportuno.

## Reason codes: documentazione completa

### Reason codes deterministic moderation
- `SPAM_LINK_PATTERN` -> link esterno rilevato.
- `TOO_MANY_LINKS` -> numero link oltre limite configurato.
- `EXTERNAL_CONTACT` -> combinazione segnali contatto esterno su contenuto pubblico.
- `PHONE_NUMBER_DETECTED` -> numero telefono rilevato.
- `EMAIL_DETECTED` -> email rilevata.
- `TELEGRAM_HANDLE_DETECTED` -> riferimento Telegram/handle.
- `WHATSAPP_REFERENCE` -> riferimento WhatsApp.
- `OFF_PLATFORM_PAYMENT` -> richiesta/pattern pagamento fuori piattaforma.
- `SCAM_KEYWORDS` -> keyword scam/deposito/off-platform.
- `HATE_SPEECH_SIGNAL` -> hate speech.
- `HARASSMENT_SIGNAL` -> harassment.
- `THREAT_SIGNAL` -> minaccia.
- `SEXUAL_CONTENT_SIGNAL` -> contenuto sessuale esplicito testuale.
- `DUPLICATE_TEXT_PATTERN` -> pattern testo duplicato.
- `BANNED_KEYWORD` -> keyword vietata esplicita.
- `SUSPICIOUS_MARKETING_PATTERN` -> marketing fraudolento/sospetto.
- `PUBLIC_CONTENT_POLICY_VIOLATION` -> violazione policy ad alta gravita.
- `INBOX_ROUTE_EXCLUDED` -> moderazione skip per route inbox/private.

### Reason codes AI moderation
- `AI_MODERATION_FLAGGED` -> AI ha prodotto `flag` o `review`.
- `AI_MODERATION_BLOCKED` -> AI ha prodotto `block`.
- `AI_SCAM_SIGNAL` -> categoria AI scam.
- `AI_SPAM_SIGNAL` -> categoria AI spam.
- `AI_HARASSMENT_SIGNAL` -> categoria AI harassment.
- `AI_HATE_SIGNAL` -> categoria AI hate speech.
- `AI_THREAT_SIGNAL` -> categoria AI threat.
- `AI_SEXUAL_TEXT_SIGNAL` -> categoria AI sexual textual content.
- `AI_OFF_PLATFORM_CONTACT_SIGNAL` -> AI rileva tentativo contatto esterno.
- `AI_OFF_PLATFORM_PAYMENT_SIGNAL` -> AI rileva pagamento esterno.
- `AI_PHISHING_SIGNAL` -> AI rileva phishing.
- `AI_SUSPICIOUS_LISTING_LANGUAGE` -> linguaggio listing sospetto.
- `AI_BORDERLINE_REVIEW` -> rischio ambiguo ma sospetto.
- `AI_CONFIDENCE_LOW` -> confidenza AI sotto soglia.
- `AI_PROVIDER_ERROR` -> errore provider/parse/timeout.
- `AI_SKIPPED_INBOX_ROUTE` -> AI non invocata per route private/inbox.

## Come modificare una regola
Checklist minima:
1. Aggiornare regex/keyword/soglia in `moderation.config.ts`.
2. Aggiungere applicazione della regola in `moderation.rules.ts` con `addMatch(...)`.
3. Se nuovo reason code:
- aggiungerlo in `ModerationReasonCode` (`moderation.types.ts`)
- aggiungerlo in `MODERATION_REASON_CODE_LIST` e `MODERATION_REASON_CODES`.
4. Se reason code deve forzare block/review, aggiornare:
- `MODERATION_CONFIG.blockReasonCodes`
- `MODERATION_CONFIG.reviewReasonCodes`
5. Verificare output API e scrittura audit.

## Esempio pratico: nuova regola
Obiettivo: intercettare keyword `escrow bypass`.

```ts
// moderation.config.ts
patterns: {
  ...,
  escrowBypassRegex: /\b(?:escrow bypass|skip escrow)\b/gi,
}
```

```ts
// moderation.rules.ts
const escrowBypassCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.escrowBypassRegex);
if (escrowBypassCount > 0) {
  addMatch(matches, {
    id: "rule_escrow_bypass",
    label: "Tentativo bypass escrow",
    severity: "high",
    scoreImpact: 24,
    reasonCode: MODERATION_REASON_CODES.OFF_PLATFORM_PAYMENT,
  });
}
```

## Debug rules engine
- Verificare `matchedRules` e `reasonCodes` nel risultato moderation.
- Controllare `moderation_events.matched_rules` e `moderation_events.reason_codes`.
- Se una regex non scatta:
  - verificare flag `g/i`,
  - verificare normalizzazione testo,
  - verificare se input e stato troncato da `maxTextLength`.

## Reason codes matrix completa (Moderation)

| Reason code | Significato | Quando viene generato | Sistema |
|---|---|---|---|
| `SPAM_LINK_PATTERN` | Link esterni sospetti | Match `urlRegex` con link entro limite | Rule engine (`moderation.rules.ts`) |
| `TOO_MANY_LINKS` | Troppi link nel testo | Match `urlRegex` con count > `maxAllowedLinks` | Rule engine |
| `EXTERNAL_CONTACT` | Tentativo contatto esterno | Somma email/telefono/telegram/whatsapp > 0 | Rule engine |
| `PHONE_NUMBER_DETECTED` | Numero di telefono rilevato | Match `phoneRegex` | Rule engine |
| `EMAIL_DETECTED` | Email rilevata | Match `emailRegex` | Rule engine |
| `TELEGRAM_HANDLE_DETECTED` | Handle/riferimento Telegram | Match `telegramRegex` | Rule engine |
| `WHATSAPP_REFERENCE` | Riferimento WhatsApp | Match `whatsappRegex` | Rule engine |
| `OFF_PLATFORM_PAYMENT` | Pagamento esterno | Match pattern scam/off-platform | Rule engine |
| `SCAM_KEYWORDS` | Linguaggio scam | Match `scamRegex` o heuristica listing vago | Rule engine |
| `HATE_SPEECH_SIGNAL` | Hate speech | Match `hateSpeechRegex` | Rule engine |
| `HARASSMENT_SIGNAL` | Harassment/insulti | Match `harassmentRegex` | Rule engine |
| `THREAT_SIGNAL` | Minaccia | Match `threatRegex` | Rule engine |
| `SEXUAL_CONTENT_SIGNAL` | Contenuto sessuale esplicito | Match `sexualExplicitRegex` | Rule engine |
| `DUPLICATE_TEXT_PATTERN` | Pattern ripetitivo spam | Match `duplicateTokenRegex` | Rule engine |
| `BANNED_KEYWORD` | Keyword esplicitamente vietata | Match in `keywords.banned` | Rule engine |
| `SUSPICIOUS_MARKETING_PATTERN` | Claim marketing fraudolento | Match `suspiciousMarketingRegex` | Rule engine |
| `AI_MODERATION_FLAGGED` | Segnale AI non bloccante | Decision AI = `flag`/`review` | AI layer (`moderation.ai.service.ts`) |
| `AI_MODERATION_BLOCKED` | Blocco deciso da AI | Decision AI = `block` | AI layer |
| `AI_SCAM_SIGNAL` | Classificazione scam AI | Categoria AI `scam` | AI adapter mapping |
| `AI_SPAM_SIGNAL` | Classificazione spam AI | Categoria AI `spam` | AI adapter mapping |
| `AI_HARASSMENT_SIGNAL` | Classificazione harassment AI | Categoria AI `harassment` | AI adapter mapping |
| `AI_HATE_SIGNAL` | Classificazione hate speech AI | Categoria AI `hate_speech` | AI adapter mapping |
| `AI_THREAT_SIGNAL` | Classificazione minaccia AI | Categoria AI `threat` | AI adapter mapping |
| `AI_SEXUAL_TEXT_SIGNAL` | Classificazione sessuale AI | Categoria AI `sexual_textual_content` | AI adapter mapping |
| `AI_OFF_PLATFORM_CONTACT_SIGNAL` | Contatto esterno AI | Categoria AI `off_platform_contact_attempt` | AI adapter mapping |
| `AI_OFF_PLATFORM_PAYMENT_SIGNAL` | Pagamento esterno AI | Categoria AI `off_platform_payment_request` | AI adapter mapping |
| `AI_PHISHING_SIGNAL` | Phishing AI | Categoria AI `phishing` | AI adapter mapping |
| `AI_SUSPICIOUS_LISTING_LANGUAGE` | Listing language sospetto AI | Categoria `suspicious_listing_language` / `suspicious_public_profile_content` | AI adapter mapping |
| `AI_BORDERLINE_REVIEW` | Caso ambiguo ad alta incertezza | Categoria AI `risky_but_uncertain` | AI adapter mapping |
| `AI_CONFIDENCE_LOW` | Confidenza AI bassa | Decision AI non allow con confidence < soglia | AI normalizer |
| `AI_PROVIDER_ERROR` | Errore provider/parsing | Timeout, HTTP error, payload invalido | AI adapter/service |
| `AI_SKIPPED_INBOX_ROUTE` | AI saltata per policy private route | route privata/inbox/excluded | AI service / skip policy |
| `PUBLIC_CONTENT_POLICY_VIOLATION` | Violazione policy grave o target invalido | phishing deterministico o target non ammesso | Rule engine / service guard |
| `INBOX_ROUTE_EXCLUDED` | Moderazione skip su inbox/private | `shouldSkipModeration()` true | Skip policy (`moderation.skip.ts`) |


