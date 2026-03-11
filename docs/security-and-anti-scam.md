# Security And Anti-Scam System

## Obiettivo
Il sistema combina moderation contenuti, trust scoring comportamentale e abuse protection infrastrutturale per ridurre scam, spam e abuso piattaforma.

## Componenti principali

### 1) Content moderation (public content)
- Core: `src/lib/moderation/moderation.service.ts`
- Rule engine: `src/lib/moderation/moderation.rules.ts`
- AI layer: `src/lib/moderation/moderation.ai.service.ts`
- Audit: `src/lib/moderation/moderation.audit.ts`

### 2) Trust scoring (user/listing/conversation)
- Config: `src/lib/trust/config.ts`
- Detection patterns: `src/lib/trust/detection.ts`
- Scoring:
  - `src/lib/trust/scoring/user-risk.ts`
  - `src/lib/trust/scoring/listing-risk.ts`
  - `src/lib/trust/scoring/conversation-risk.ts`
- Policy engine: `src/lib/trust/policy/engine.ts`
- Persistence events/cases: `src/lib/trust/services/trust-store.ts`

### 3) Abuse protection (rate/farm/fanout)
- Guard: `src/lib/security/abuse-guards.ts`
- Scoring: `src/lib/security/abuse-scoring.ts`
- Event store: `security_abuse_events`

## Copertura anti-scam richiesta

### Scam detection
Implementata in due livelli:
- deterministic moderation (`SCAM_KEYWORDS`, `OFF_PLATFORM_PAYMENT`)
- trust pattern detection (`suspiciousKeywordRegex`, phishing/external payment signals)

File chiave:
- `moderation.config.ts`
- `moderation.rules.ts`
- `trust/detection.ts`

### Spam detection
Segnali principali:
- `SPAM_LINK_PATTERN`, `TOO_MANY_LINKS`
- `DUPLICATE_TEXT_PATTERN`
- `MASS_OUTREACH_PATTERN` (conversation risk)
- duplicate message guard in global chat

File:
- `moderation.rules.ts`
- `trust/scoring/conversation-risk.ts`
- `src/app/api/global-chat/messages/route.ts`

### Suspicious listing detection
Segnali listing:
- deviazione prezzo (`SUSPICIOUS_PRICE_DEVIATION`)
- duplicazione testo/immagini
- keyword sospette
- descrizione vaga
- velocita pubblicazione

File:
- `trust/services/listing-safety.ts`
- `trust/scoring/listing-risk.ts`

### Off-platform payment detection
Segnali:
- regole moderation (`OFF_PLATFORM_PAYMENT`)
- AI (`AI_OFF_PLATFORM_PAYMENT_SIGNAL`)
- trust chat/listing (`OFF_PLATFORM_PAYMENT_REQUEST`, `DEPOSIT_REQUEST_SIGNAL`)

### Contact sharing detection
Segnali:
- phone/email/telegram/whatsapp/discord/instagram
- reason codes `EXTERNAL_CONTACT`, `EXTERNAL_CONTACT_IN_LISTING`, `EXTERNAL_CONTACT_IN_CHAT`
- redazione automatica in chat quando richiesto

### Mass messaging detection
Segnali:
- `massOutreachRecipientsLast6h`
- `repeatedTemplateCountLast6h`

Calcolo in:
- `collectConversationVelocitySignals()` (`chat-safety.ts`)
- score in `calculateConversationRiskScore()`

### Trust score logic
User trust:
- `riskScore` da `0..100` (piu alto = piu rischio)
- `trustScore` derivato = `100 - riskScore`
- stato account: `trusted | limited | under_review | suspended`

Persistenza:
- `trust_account_states`
- aggiornamento in `evaluateAndPersistUserRisk()`

## Decisioni e enforcement

### Conversation policy
`evaluateConversationRiskPolicy()`:
- `ALLOW`
- `ALLOW_WITH_WARNING`
- `LIMIT_ACTION` (`soft_block`, con redaction)
- `BLOCK` (`hard_block`)

### Listing policy
`evaluateListingRiskPolicy()`:
- `ALLOW`
- `ALLOW_WITH_WARNING`
- `PENDING_REVIEW`
- `SHADOW_LIMIT`
- `BLOCK`

### User policy
`evaluateUserRiskPolicy()`:
- `ALLOW`
- `ALLOW_WITH_WARNING`
- `LIMIT_ACTION`
- `PENDING_REVIEW`
- `SUSPEND`

## Shadow limitations
Implementazione effettiva sui listing:
- `visibility_state = "limited"` o `"shadowed"`
- `safety_status = "restricted"` / `"pending_review"` / `"removed"`

Punti di set:
- `src/app/api/requests/create/route.ts`
- `src/lib/trust/policy/engine.ts`
- action admin su listing (`restrict_listing`, `remove_listing`) in `.../cases/[caseId]/action/route.ts`

## Review queue
Due queue distinte:

1. Queue moderation contenuti (`moderation_reviews_queue`)
- creata da `writeModerationAudit()` quando decision = `review`

2. Queue trust cases (`trust_moderation_cases`)
- creata da:
  - listing/chat safety persistence (`createModerationCase`)
  - trust reports (`createTrustReport`)
- lettura admin: `src/app/api/admin/trust/review-queue/route.ts`

## Automatic blocking
Blocchi automatici avvengono quando:
- moderation decision finale = `block`
- trust conversation/listing/user policy restituisce `blocked=true`
- abuse guard (`evaluateAbuseSnapshot`) produce score >= 100

## Escalation rules
Escalation automatica a caso moderazione (`trust_moderation_cases`) quando:
- conversation decision richiede review/manual check o hard block
- listing decision richiede manual review
- report utente viene creato

Escalation manuale admin:
- endpoint `POST /api/admin/trust/cases/[caseId]/action`
- azioni: `suspend_user`, `request_kyc`, `restrict_listing`, `remove_listing`, ecc.

## Reason codes Trust/Security (principali)
- `EXTERNAL_CONTACT_IN_LISTING` -> contatti esterni dentro annuncio.
- `OFF_PLATFORM_PAYMENT_REQUEST` -> richiesta pagamento fuori piattaforma.
- `EXTERNAL_LINK_IN_CHAT` -> link esterno in chat.
- `EXTERNAL_CONTACT_IN_CHAT` -> contatto esterno in chat.
- `TELEGRAM_WHATSAPP_REDIRECT` -> spostamento chat su canali esterni.
- `DEPOSIT_REQUEST_SIGNAL` -> richiesta caparra/deposito sospetta.
- `MASS_OUTREACH_PATTERN` -> outreach massivo.
- `REPEATED_SCAM_TEMPLATE` -> template scam ripetuto.
- `CHAT_PHISHING_PATTERN` -> phishing in chat.
- `SUSPICIOUS_PRICE_DEVIATION` -> prezzo anomalo.
- `DUPLICATE_LISTING_TEMPLATE` / `COPY_PASTE_DESCRIPTION_PATTERN` / `DUPLICATE_IMAGE_SIGNAL`.
- `ABUSE_GUARD_TRIGGERED` -> evento anti-abuso.

Elenco completo: `src/lib/trust/reason-codes.ts`.

## Integrazioni route importanti
- Direct chat safety: `src/app/api/chat/messages/route.ts`
- Listing create/update: `src/app/api/requests/create/route.ts`, `src/app/api/requests/[id]/update/route.ts`
- Trust report ingestion: `src/app/api/trust/report/route.ts`
- Admin queue/action/timeline:
  - `src/app/api/admin/trust/review-queue/route.ts`
  - `src/app/api/admin/trust/cases/[caseId]/action/route.ts`
  - `src/app/api/admin/trust/account/[userId]/timeline/route.ts`

## Debugging operativo
1. Se messaggi bloccati:
- controllare response code (`CONVERSATION_MESSAGE_BLOCKED`, `PUBLIC_CONTENT_POLICY_VIOLATION`, `ACCOUNT_RISK_BLOCKED`)
- controllare reason codes e score.
2. Verificare tabelle:
- `moderation_events`
- `trust_risk_events`
- `trust_risk_snapshots`
- `trust_moderation_cases`
- `security_abuse_events`
3. Verificare policy output (`action`, `blocked`, `requiresManualReview`) nei servizi trust.
4. Verificare redazione testo (`redactedMessage`) in chat safety.

## Reason codes matrix completa (Trust/Security)

| Reason code | Significato | Quando viene generato | Sistema |
|---|---|---|---|
| `NEW_ACCOUNT_HIGH_ACTIVITY` | Attivita elevata su account nuovo | Account in finestra onboarding con attivita rilevante | User/Listing/Conversation risk scoring |
| `UNVERIFIED_EMAIL` | Email non verificata | `emailVerified=false` | User risk scoring |
| `UNVERIFIED_PHONE` | Telefono non verificato | `phoneVerified=false` | User risk scoring |
| `EXCESSIVE_DEVICE_COUNT` | Troppi device associati | `uniqueDeviceCountLast30d` sopra soglia | User risk scoring |
| `LOGIN_ANOMALY` | Login anomali | `anomalousLoginCountLast7d` sopra soglia | User risk scoring |
| `HIGH_LISTING_VELOCITY` | Troppi listing in poco tempo | `listingsCreatedLast24h`/`listingVelocityLast24h` sopra soglia | User/Listing risk scoring |
| `HIGH_MESSAGE_VELOCITY` | Troppi messaggi in poco tempo | `messagesSentLast24h` sopra soglia | User risk scoring |
| `HIGH_REPORT_RATE` | Alte segnalazioni ricevute | `reportsReceivedLast30d` sopra soglia | User risk scoring |
| `HIGH_BLOCK_RATE` | Molti blocchi conversazione | `suspiciousConversationBlocksLast30d` sopra soglia | User risk scoring |
| `RAPID_PROFILE_MUTATION` | Profilo modificato troppo spesso | `profileMutationsLast24h` sopra soglia | User risk scoring |
| `GEO_DEVICE_MISMATCH` | Incoerenza geo/device | `geoDeviceMismatchCountLast30d` sopra soglia | User risk scoring |
| `VPN_PROXY_TOR_SIGNAL` | Uso VPN/proxy/TOR sospetto | `vpnProxyTorEventsLast30d` sopra soglia | User risk scoring |
| `DISPUTE_HISTORY_SPIKE` | Spike dispute/refund | `disputeRate` o `refundRate` sopra soglia | User risk scoring |
| `KYC_REQUIRED_FOR_VOLUME` | Volume alto senza KYC | Account non verificato con listing elevati | User risk scoring |
| `MULTI_ACCOUNT_DEVICE_MATCH` | Device condiviso multipli account | `multiAccountDeviceMatchesLast30d` sopra soglia | User risk scoring |
| `REPEAT_OFFENDER_PATTERN` | Recidiva comportamentale | sender/account risk elevato o repeatOffender true | User/Conversation risk scoring |
| `SUSPICIOUS_PRICE_DEVIATION` | Prezzo listing anomalo | `priceDeviationPct` negativo oltre soglie | Listing risk scoring |
| `DUPLICATE_LISTING_TEMPLATE` | Template listing duplicato | Similarita testo alta / cross-city duplication | Listing risk scoring |
| `DUPLICATE_IMAGE_SIGNAL` | Immagini duplicate | `duplicateImageConfidence` sopra soglia | Listing risk scoring |
| `COPY_PASTE_DESCRIPTION_PATTERN` | Descrizione copia/incolla sospetta | Similarita testo media/alta o testo troppo corto/vago | Listing risk scoring |
| `EXTERNAL_CONTACT_IN_LISTING` | Contatto esterno nel listing | Link/email/phone/handle nel listing | Listing detection/scoring |
| `OFF_PLATFORM_PAYMENT_REQUEST` | Pagamento fuori piattaforma | Signal off-platform/deposito o keyword | Listing/Conversation scoring |
| `EXTERNAL_LINK_IN_CHAT` | Link esterno in chat | `containsExternalLink=true` | Conversation risk scoring |
| `EXTERNAL_CONTACT_IN_CHAT` | Contatto esterno in chat | email/phone/handle in messaggio | Conversation risk scoring |
| `TELEGRAM_WHATSAPP_REDIRECT` | Redirect verso app esterne | `offPlatformRedirectSignal=true` | Conversation risk scoring |
| `DEPOSIT_REQUEST_SIGNAL` | Richiesta caparra/anticipo | `depositOrAdvancePaymentSignal=true` | Conversation risk scoring |
| `URGENCY_MANIPULATION_SIGNAL` | Pressione/urgenza manipolativa | `urgencyManipulationSignal=true` | Conversation risk scoring |
| `MASS_OUTREACH_PATTERN` | Outreach massivo | `massOutreachRecipientsLast6h` sopra soglia | Conversation velocity/scoring |
| `REPEATED_SCAM_TEMPLATE` | Template scam ripetuto | `repeatedTemplateCountLast6h` sopra soglia | Conversation velocity/scoring |
| `CHAT_PHISHING_PATTERN` | Pattern phishing chat | `phishingSignal=true` | Conversation risk scoring |
| `BAN_EVASION_LINKED_ACCOUNT` | Possibile ban evasion | previsto in catalogo reason codes (non ancora emesso dai servizi attuali) | Trust reason code catalog |
| `ACCOUNT_TAKEOVER_SIGNAL` | Possibile account takeover | previsto in catalogo (non ancora emesso dai servizi attuali) | Trust reason code catalog |
| `REVIEW_BURST_PATTERN` | Burst recensioni anomalo | previsto in catalogo (pipeline review integrity) | Trust reason code catalog |
| `REVIEW_LOW_TRUST_WEIGHT` | Recensione da profilo low-trust | previsto in catalogo (pipeline review integrity) | Trust reason code catalog |
| `REVIEW_WITHOUT_VALID_INTERACTION` | Review senza interazione valida | previsto in catalogo (pipeline review integrity) | Trust reason code catalog |
| `EXCESSIVE_SIGNUP_ATTEMPTS` | Troppi signup da stesso IP | `signupAttemptsFromIpLast24h` sopra soglia | User risk scoring |
| `EXCESSIVE_PASSWORD_RESET_ATTEMPTS` | Troppi reset password | reason code catalog, associabile a security events dedicati | Trust reason code catalog |
| `ABUSE_GUARD_TRIGGERED` | Blocco anti-abuso attivato | evento anti-abuso ad alto punteggio | Abuse guard / security events |

Nota: i reason code "catalog only" sono definiti in `src/lib/trust/reason-codes.ts` e pronti per estensioni future anche se non sempre emessi nel flusso corrente.


