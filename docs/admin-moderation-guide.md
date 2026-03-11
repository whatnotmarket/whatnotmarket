# Admin Moderation Guide

## Audience
Questa guida e pensata per admin operativi (non necessariamente tecnici).

## In 60 secondi: come funziona
1. Un utente invia contenuto.
2. Il sistema fa controlli automatici.
3. Il contenuto viene:
   - pubblicato (`allow`/`flag`)
   - inviato in verifica (`review`)
   - bloccato (`block`)
4. Ogni decisione viene salvata in log audit.

## Cosa succede quando un contenuto viene bloccato
- L'utente riceve un messaggio semplice (es. violazione linee guida).
- L'evento viene registrato in `moderation_events`.
- In caso Trust ad alto rischio possono aprirsi case admin.

## Cosa succede quando un contenuto va in review
- Il contenuto non viene pubblicato subito (dipende dalla route).
- Viene messo in coda in `moderation_reviews_queue`.
- Gli admin vedono il caso in review queue e decidono.

## Dove guardare lato admin
### Review queue
Endpoint:
- `GET /api/admin/trust/review-queue`

Ritorna:
- `priority`
- `riskScore`
- `riskLevel`
- `reasonCodes`
- `summary`

### Eseguire azione su case
Endpoint:
- `POST /api/admin/trust/cases/[caseId]/action`

Azioni comuni:
- `resolve_case`
- `dismiss_case`
- `assign_case`
- `request_kyc`
- `suspend_user`
- `restrict_listing`
- `publish_listing`
- `remove_listing`

### Timeline utente
Endpoint:
- `GET /api/admin/trust/account/[userId]/timeline`

Mostra:
- risk events
- security events
- report ricevuti/inviati
- moderation cases collegate

## Esempi operativi
### Esempio: Moderation event

```json
{
  "target_type": "listing_description",
  "decision": "review",
  "severity": "high",
  "score": 68,
  "reason_codes": ["OFF_PLATFORM_PAYMENT", "AI_SCAM_SIGNAL"],
  "route": "/api/requests/create",
  "skipped_because_inbox": false
}
```

### Esempio: User flagged (trust)

```json
{
  "entity_type": "user",
  "risk_score": 74,
  "risk_level": "high",
  "reason_codes": ["HIGH_REPORT_RATE", "MULTI_ACCOUNT_DEVICE_MATCH"],
  "action": "PENDING_REVIEW",
  "blocked": false
}
```

### Esempio: Listing blocked

```json
{
  "entity_type": "listing",
  "risk_score": 93,
  "risk_level": "critical",
  "reason_codes": ["SUSPICIOUS_PRICE_DEVIATION", "OFF_PLATFORM_PAYMENT_REQUEST"],
  "action": "BLOCK",
  "listingSafetyStatus": "removed"
}
```

## Come leggere i reason codes
I reason codes spiegano perche il sistema ha preso una decisione.

Regola pratica:
- 1 code isolato -> caso spesso semplice
- molti code insieme -> pattern rischio composito
- code AI + code rules -> segnale forte

## Reason codes catalog (Moderation layer)

| Reason code | Significato | Quando viene generato | Sistema |
|---|---|---|---|
| SPAM_LINK_PATTERN | Link esterni presenti | URL rilevato | Rules moderation |
| TOO_MANY_LINKS | Troppi link | Link oltre limite | Rules moderation |
| EXTERNAL_CONTACT | Contatto esterno | Email/phone/handle esterni | Rules moderation |
| PHONE_NUMBER_DETECTED | Numero telefono | Numero nel testo | Rules moderation |
| EMAIL_DETECTED | Email nel testo | Pattern email | Rules moderation |
| TELEGRAM_HANDLE_DETECTED | Telegram handle | `telegram`, `t.me`, `@...` | Rules moderation |
| WHATSAPP_REFERENCE | WhatsApp reference | `whatsapp`, `wa.me` | Rules moderation |
| OFF_PLATFORM_PAYMENT | Pagamento fuori piattaforma | Keyword pagamento esterno | Rules moderation |
| SCAM_KEYWORDS | Keyword scam | Pattern scam tipici | Rules moderation |
| HATE_SPEECH_SIGNAL | Hate speech | Pattern hate rilevato | Rules moderation |
| HARASSMENT_SIGNAL | Harassment | Insulti/aggressioni | Rules moderation |
| THREAT_SIGNAL | Minaccia | Pattern minaccia | Rules moderation |
| SEXUAL_CONTENT_SIGNAL | Sexual text | Pattern sessuale esplicito | Rules moderation |
| DUPLICATE_TEXT_PATTERN | Testo duplicato | Ripetizione token | Rules moderation |
| BANNED_KEYWORD | Keyword vietata | Match su blacklist | Rules moderation |
| SUSPICIOUS_MARKETING_PATTERN | Promo abusiva | Claim marketing sospetto | Rules moderation |
| AI_MODERATION_FLAGGED | AI segnala rischio | Decision AI `flag/review` | AI moderation |
| AI_MODERATION_BLOCKED | AI blocca | Decision AI `block` | AI moderation |
| AI_SCAM_SIGNAL | Segnale scam AI | Categoria AI scam | AI moderation |
| AI_SPAM_SIGNAL | Segnale spam AI | Categoria AI spam | AI moderation |
| AI_HARASSMENT_SIGNAL | Segnale harassment AI | Categoria AI harassment | AI moderation |
| AI_HATE_SIGNAL | Segnale hate AI | Categoria AI hate speech | AI moderation |
| AI_THREAT_SIGNAL | Segnale threat AI | Categoria AI threat | AI moderation |
| AI_SEXUAL_TEXT_SIGNAL | Segnale sexual AI | Categoria AI sexual text | AI moderation |
| AI_OFF_PLATFORM_CONTACT_SIGNAL | Contatto esterno AI | Categoria AI off-platform contact | AI moderation |
| AI_OFF_PLATFORM_PAYMENT_SIGNAL | Pagamento esterno AI | Categoria AI off-platform payment | AI moderation |
| AI_PHISHING_SIGNAL | Phishing AI | Categoria AI phishing | AI moderation |
| AI_SUSPICIOUS_LISTING_LANGUAGE | Linguaggio listing sospetto | Categoria AI suspicious listing | AI moderation |
| AI_BORDERLINE_REVIEW | Borderline | Caso ambiguo da review | AI moderation |
| AI_CONFIDENCE_LOW | Confidence bassa | Confidence AI sotto threshold | AI moderation |
| AI_PROVIDER_ERROR | Errore provider AI | Timeout/retry/error payload | AI moderation |
| AI_SKIPPED_INBOX_ROUTE | AI non eseguita | Route inbox/private esclusa | AI skip policy |
| PUBLIC_CONTENT_POLICY_VIOLATION | Violazione policy | Target non valido o phishing severo | Moderation service |
| INBOX_ROUTE_EXCLUDED | Inbox esclusa | Skip su `/inbox`/private | Skip logic |

## Reason codes catalog (Trust/Security layer)

| Reason code | Significato | Quando viene generato | Sistema |
|---|---|---|---|
| NEW_ACCOUNT_HIGH_ACTIVITY | Account nuovo con attivita alta | Finestra new/strict account | User/Listing/Conversation risk |
| UNVERIFIED_EMAIL | Email non verificata | User signals | User risk |
| UNVERIFIED_PHONE | Telefono non verificato | User signals | User risk |
| EXCESSIVE_DEVICE_COUNT | Troppi device | Device count elevato | User risk |
| LOGIN_ANOMALY | Login anomali | Eventi sicurezza sospetti | User risk |
| HIGH_LISTING_VELOCITY | Troppi listing in poco tempo | Listing velocity | User/Listing risk |
| HIGH_MESSAGE_VELOCITY | Troppi messaggi | Message velocity | User risk |
| HIGH_REPORT_RATE | Molte segnalazioni | Report ricevuti | User risk |
| HIGH_BLOCK_RATE | Molti blocchi conversazione | Message blocks | User risk |
| RAPID_PROFILE_MUTATION | Modifiche profilo rapide | Mutazioni frequenti | User risk |
| GEO_DEVICE_MISMATCH | Geo/device mismatch | Eventi sicurezza | User risk |
| VPN_PROXY_TOR_SIGNAL | VPN/proxy/TOR sospetto | Security events | User risk |
| DISPUTE_HISTORY_SPIKE | Dispute/refund anomali | Storico pagamenti/deals | User risk |
| KYC_REQUIRED_FOR_VOLUME | KYC necessario | Volume alto senza KYC | User risk |
| MULTI_ACCOUNT_DEVICE_MATCH | Device condiviso sospetto | Match device multi-account | User risk |
| REPEAT_OFFENDER_PATTERN | Pattern recidivo | Account gia sospeso/bannato o rischio alto | User/Conversation risk |
| SUSPICIOUS_PRICE_DEVIATION | Prezzo troppo basso | Deviazione mediana categoria | Listing risk |
| DUPLICATE_LISTING_TEMPLATE | Template listing duplicato | Similarity elevata/cross city | Listing risk |
| DUPLICATE_IMAGE_SIGNAL | Immagine duplicata | Confidenza duplicazione alta | Listing risk |
| COPY_PASTE_DESCRIPTION_PATTERN | Descrizione copia/incolla | Similarity/vaghezza testo | Listing risk |
| EXTERNAL_CONTACT_IN_LISTING | Contatti esterni nel listing | Pattern contact in listing | Listing risk |
| OFF_PLATFORM_PAYMENT_REQUEST | Pagamento fuori piattaforma | Pattern payment esterno | Listing/Conversation risk |
| EXTERNAL_LINK_IN_CHAT | Link esterno in chat | URL in messaggio | Conversation risk |
| EXTERNAL_CONTACT_IN_CHAT | Contatti esterni in chat | Email/phone/handle in chat | Conversation risk |
| TELEGRAM_WHATSAPP_REDIRECT | Redirect canali esterni | Invito Telegram/WhatsApp | Conversation risk |
| DEPOSIT_REQUEST_SIGNAL | Richiesta caparra | Keyword deposito/anticipo | Conversation risk |
| URGENCY_MANIPULATION_SIGNAL | Urgenza artificiale | Pattern pressione psicologica | Conversation risk |
| MASS_OUTREACH_PATTERN | Messaggi verso molti utenti | Outreach fanout alto | Conversation risk |
| REPEATED_SCAM_TEMPLATE | Template scam ripetuto | Messaggi uguali ripetuti | Conversation risk |
| CHAT_PHISHING_PATTERN | Phishing in chat | Pattern phishing | Conversation risk |
| BAN_EVASION_LINKED_ACCOUNT | Possibile ban evasion | Match IP/device con account rischiosi | Auth security |
| ACCOUNT_TAKEOVER_SIGNAL | Possibile account takeover | Eventi login anomali (estendibile) | Auth security |
| REVIEW_BURST_PATTERN | Burst recensioni | Troppe review ravvicinate | Review integrity |
| REVIEW_LOW_TRUST_WEIGHT | Reviewer low trust | Account nuovo/rischioso | Review integrity |
| REVIEW_WITHOUT_VALID_INTERACTION | Review senza interazione valida | Nessun deal/conversation valida | Review integrity |
| EXCESSIVE_SIGNUP_ATTEMPTS | Troppi tentativi signup | Abuse middleware | Auth abuse |
| EXCESSIVE_PASSWORD_RESET_ATTEMPTS | Troppi reset password | Abuse middleware | Auth abuse |
| ABUSE_GUARD_TRIGGERED | Abuse guard attivo | Snapshot anomalo IP/device | Abuse guard |

## Gestione falsi positivi
Playbook consigliato:
1. Apri evento in `moderation_events` o `trust_risk_events`.
2. Verifica `reason_codes`, `risk_score`, `route`, `metadata.ai`.
3. Se serve, esegui `dismiss_case` con nota chiara.
4. Se pattern si ripete su utenti buoni:
   - abbassa severita regola
   - alza threshold review/block
   - riduci peso signal nel risk scoring
5. Traccia decisione in `trust_moderation_actions`.

## Best practices per admin
- non basarsi su un solo reason code
- considerare storico utente (timeline)
- distinguere abuso intenzionale da errore utente
- usare `request_kyc` prima di sospensione permanente nei casi dubbi
- documentare sempre note di case action
