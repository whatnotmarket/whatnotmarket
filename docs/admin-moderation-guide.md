# Admin Moderation Guide

## A chi e destinata
Guida operativa per admin della piattaforma (anche non tecnici) per gestire contenuti segnalati, review e blocchi.

## Come funziona la moderazione (versione admin)
Ogni contenuto pubblico passa da controlli automatici:
1. Regole automatiche (link sospetti, contatti esterni, parole scam, contenuti abusivi).
2. Analisi AI (solo su aree pubbliche, non su inbox/private).
3. Decisione finale:
- `allow` -> pubblicato
- `flag` -> pubblicato ma segnato internamente
- `review` -> in coda di revisione
- `block` -> non pubblicato

## Cosa succede quando un contenuto viene bloccato
- L'utente riceve un messaggio di policy violation.
- Il contenuto non viene pubblicato/salvato nello stato pubblico previsto.
- L'evento viene registrato in audit (`moderation_events`).

Tipico esempio API:

```json
{
  "ok": false,
  "code": "PUBLIC_CONTENT_POLICY_VIOLATION",
  "error": "Il contenuto inviato non rispetta le linee guida della piattaforma.",
  "reasonCodes": ["HATE_SPEECH_SIGNAL"]
}
```

## Cosa succede quando un contenuto va in review
- Il contenuto viene messo in stato `pending_review` (quando il flusso lo supporta).
- Viene registrato in `moderation_reviews_queue`.
- Nei flussi trust puo essere aperto un case in `trust_moderation_cases`.

## Come leggere i reason codes
I reason code spiegano il motivo esatto del trigger.

Esempi comuni:
- `EXTERNAL_CONTACT` -> rilevato contatto esterno nel testo.
- `OFF_PLATFORM_PAYMENT` -> richiesta pagamento fuori piattaforma.
- `AI_SCAM_SIGNAL` -> AI ha classificato contenuto come scam.
- `SPAM_LINK_PATTERN` -> pattern link spam.
- `INBOX_ROUTE_EXCLUDED` -> skip policy su route privata.

## Dove vedere la review queue
Endpoint admin:
- `GET /api/admin/trust/review-queue`

Contiene:
- priorita
- risk score / risk level
- reason codes
- stato case (`open`, `in_review`, `resolved`, `dismissed`)

## Azioni admin disponibili sui case
Endpoint:
- `POST /api/admin/trust/cases/[caseId]/action`

Azioni principali:
- `assign_case`
- `dismiss_case`
- `resolve_case`
- `request_kyc`
- `suspend_user` / `unsuspend_user`
- `shadow_limit_user`
- `restrict_listing` / `publish_listing` / `remove_listing`

## Come analizzare audit logs
Sorgenti principali:
- `moderation_events` (eventi moderation)
- `moderation_reviews_queue` (review moderation)
- `trust_risk_events` (eventi rischio trust)
- `trust_moderation_cases` (casi aperti)
- `trust_moderation_actions` (azioni admin)
- `trust_audit_logs` (audit trust)

Timeline account:
- `GET /api/admin/trust/account/[userId]/timeline`

## Gestione falsi positivi
Procedura consigliata:
1. Aprire il case / evento.
2. Controllare reason codes e score.
3. Verificare estratto originale vs sanitizzato.
4. Se falso positivo:
- chiudere/dismiss case
- ripristinare contenuto (es. `publish_listing`)
- aggiungere note nel case action
5. Aprire ticket tecnico per affinare:
- regex/keyword rule
- threshold review/block
- mapping reason code

## Esempi operativi

### Moderation event

```json
{
  "target_type": "listing_description",
  "decision": "review",
  "score": 62,
  "reason_codes": [
    "EXTERNAL_CONTACT",
    "AI_OFF_PLATFORM_CONTACT_SIGNAL",
    "AI_MODERATION_FLAGGED"
  ],
  "route": "/api/requests/create"
}
```

### User flagged

```json
{
  "entity_type": "user",
  "risk_score": 68,
  "risk_level": "high",
  "action": "PENDING_REVIEW",
  "reason_codes": [
    "HIGH_REPORT_RATE",
    "HIGH_MESSAGE_VELOCITY",
    "REPEAT_OFFENDER_PATTERN"
  ]
}
```

### Listing blocked

```json
{
  "entity_type": "listing",
  "action": "BLOCK",
  "listing_safety_status": "removed",
  "visibility_state": "shadowed",
  "reason_codes": [
    "OFF_PLATFORM_PAYMENT_REQUEST",
    "EXTERNAL_CONTACT_IN_LISTING"
  ]
}
```

## Note importanti
- AI non viene usata su inbox/private chat/direct messages.
- La global chat usa un modulo di moderazione separato.
- I case trust e la review moderation sono due pipeline diverse ma complementari.

## Escalation rapida (playbook)
- Rischio critico ricorrente: `suspend_user` + `request_kyc`.
- Listing ad alto rischio ma non certo: `restrict_listing` + `in_review`.
- Evidenza insufficiente: `dismiss_case` con nota obbligatoria.


