# Rules Engine Documentation

## Overview
Il rules engine deterministic e implementato in:
- `src/lib/moderation/moderation.rules.ts`
- configurazioni regex/keywords in `src/lib/moderation/moderation.config.ts`

Ruolo:
- controlli veloci e spiegabili
- assegnazione score/severity/reason codes
- redazione dati sensibili (`sanitizedText`)

Funzione principale:
- `evaluateRuleBasedModeration(input: ModerationInput)`

Output:
- `score` (0-100)
- `severity`
- `matchedRules[]`
- `reasonCodes[]`
- `suggestedDecision`
- `sanitizedText`

## Rule catalog

### Link detection
- Dove: `MODERATION_CONFIG.patterns.urlRegex`
- Cosa rileva: URL esterni (`http`, `https`, `www`)
- Reason code:
  - `SPAM_LINK_PATTERN` (link presenti)
  - `TOO_MANY_LINKS` (sopra `maxAllowedLinks`)
- Effetto: aumenta score e puo portare a review/block

### Email detection
- Dove: `patterns.emailRegex`
- Cosa rileva: indirizzi email
- Reason code: `EMAIL_DETECTED`
- Effetto: score alto, contributo a `EXTERNAL_CONTACT`

### Phone detection
- Dove: `patterns.phoneRegex`
- Cosa rileva: numeri di telefono
- Reason code: `PHONE_NUMBER_DETECTED`
- Effetto: score alto, contributo a `EXTERNAL_CONTACT`

### Telegram detection
- Dove: `patterns.telegramRegex`
- Cosa rileva: Telegram / `t.me` / handle tipo `@name`
- Reason code: `TELEGRAM_HANDLE_DETECTED`
- Effetto: score alto, spesso review

### WhatsApp detection
- Dove: `patterns.whatsappRegex`
- Cosa rileva: WhatsApp / `wa.me`
- Reason code: `WHATSAPP_REFERENCE`
- Effetto: score alto, spesso review

### Aggregated external contact
- Dove: `moderation.rules.ts` (somma email+phone+telegram+whatsapp)
- Cosa rileva: tentativo globale di spostare contatto fuori piattaforma
- Reason code: `EXTERNAL_CONTACT`
- Effetto: escalation forte verso review/block

### Scam keyword detection
- Dove: `patterns.scamRegex`
- Cosa rileva: caparra, anticipo, pagamento esterno, ecc.
- Reason code:
  - `SCAM_KEYWORDS`
  - `OFF_PLATFORM_PAYMENT`
- Effetto: score elevato, review molto probabile

### Phishing pattern detection
- Dove: `patterns.phishingRegex`
- Cosa rileva: seed phrase, private key, wallet recovery, claim airdrop
- Reason code: `PUBLIC_CONTENT_POLICY_VIOLATION`
- Effetto: criticita alta, possibile block

### Hate speech detection
- Dove: `patterns.hateSpeechRegex`
- Cosa rileva: pattern hate espliciti
- Reason code: `HATE_SPEECH_SIGNAL`
- Effetto: criticita alta, spesso block

### Threat detection
- Dove: `patterns.threatRegex`
- Cosa rileva: minacce esplicite
- Reason code: `THREAT_SIGNAL`
- Effetto: criticita alta, spesso block

### Harassment detection
- Dove: `patterns.harassmentRegex`
- Cosa rileva: insulti/aggressioni verbali
- Reason code: `HARASSMENT_SIGNAL`
- Effetto: score alto, review/block in base al contesto

### Sexual textual content
- Dove: `patterns.sexualExplicitRegex`
- Cosa rileva: contenuti sessuali espliciti testuali
- Reason code: `SEXUAL_CONTENT_SIGNAL`
- Effetto: criticita alta, block frequente

### Duplicate token pattern
- Dove: `patterns.duplicateTokenRegex`
- Cosa rileva: ripetizione artificiale della stessa parola
- Reason code: `DUPLICATE_TEXT_PATTERN`
- Effetto: rischio spam medio

### Suspicious marketing pattern
- Dove: `patterns.suspiciousMarketingRegex`
- Cosa rileva: claim promozionali abusivi
- Reason code: `SUSPICIOUS_MARKETING_PATTERN`
- Effetto: rischio medio

### Banned keyword exact match
- Dove: `MODERATION_CONFIG.keywords.banned`
- Cosa rileva: stringhe bloccate esplicitamente
- Reason code: `BANNED_KEYWORD`
- Effetto: criticita alta

### Vague listing micro-rule
- Dove: controllo inline in `moderation.rules.ts`
- Cosa rileva: pattern vaghi (`contattami`, `solo seri`, `no perditempo`) su testi corti
- Reason code: `SCAM_KEYWORDS`
- Effetto: rischio medio

## Scoring and decision in rules layer
Funzioni:
- `severityFromScore(score)`
- `decisionFromScore(score)`

Threshold base (da `moderation.config.ts`):
- `flagScore = 10`
- `reviewScore = 25`
- `blockScore = 50`

## Sanitization behavior
`redactSensitiveContent(text)` sostituisce:
- email -> `[email-hidden]`
- telefono -> `[phone-hidden]`
- url -> `[link-hidden]`
- handle esterni -> `[handle-hidden]`

Questo testo redatto viene usato in salvataggio pubblico quando necessario.

## How to modify a rule
Passi standard:
1. Aggiungi o aggiorna regex in `moderation.config.ts`
2. Aggiorna `evaluateRuleBasedModeration()`
3. Definisci reason code coerente (aggiungi in `moderation.types.ts` + `moderation.reason-codes.ts` se nuovo)
4. Allinea soglie in `MODERATION_CONFIG.thresholds` se necessario
5. Verifica audit output in `moderation_events`

## Example: add instagram handle hardening
Esempio pratico (se vuoi rendere piu severa detection Instagram):

```ts
// moderation.config.ts
instagramRegex: /\b(?:instagram|insta|ig:|@ig_[\w\d_]{3,})\b/gi,

// moderation.rules.ts
const instagramCount = countRegexMatches(lower, MODERATION_CONFIG.patterns.instagramRegex);
if (instagramCount > 0) {
  addMatch(matches, {
    id: "rule_instagram_reference",
    label: "Riferimento Instagram",
    severity: "high",
    scoreImpact: 18,
    reasonCode: MODERATION_REASON_CODES.EXTERNAL_CONTACT,
  });
}
```

## Debugging deterministic rules
Se una regola sembra sbagliare:
1. Prendi payload da `moderation_events.original_excerpt`
2. Verifica `matched_rules` e `reason_codes`
3. Esegui regex localmente sul testo normalizzato
4. Riduci o aumenta `scoreImpact` in modo controllato
5. Se falso positivo persistente, sposta il caso in `review` invece di `block`

## Cross-reference
Per il layer AI e combinazione finale, vedi:
- `docs/ai-moderation.md`
- `docs/moderation-system.md`
