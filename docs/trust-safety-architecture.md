# Trust & Safety Architecture

## Goal
Aggressive anti-scam system for marketplace flows:
- account onboarding and auth
- listing publication
- direct and global chat
- reports and moderation
- admin enforcement and auditability

Principle: **assume bad intent until trust is built**.

## Core modules

### Risk scoring
- `src/lib/trust/scoring/user-risk.ts`
- `src/lib/trust/scoring/listing-risk.ts`
- `src/lib/trust/scoring/conversation-risk.ts`

### Policy engine
- `src/lib/trust/policy/engine.ts`

### Detection
- `src/lib/trust/detection.ts`
- regex/keywords from `src/lib/trust/config.ts`

### Services
- `src/lib/trust/services/user-risk-service.ts`
- `src/lib/trust/services/listing-safety.ts`
- `src/lib/trust/services/chat-safety.ts`
- `src/lib/trust/services/onboarding-security.ts`
- `src/lib/trust/services/auth-security.ts`
- `src/lib/trust/services/reports.ts`
- `src/lib/trust/services/trust-store.ts`
- `src/lib/trust/services/review-integrity.ts`

### Async worker
- `src/lib/trust/workers/recalculate-risk.ts`
- trigger endpoint: `POST /api/admin/trust/recalculate`

## Database
Migration:
- `supabase/migrations/20260311170000_trust_safety_core.sql`

New tables:
- `trust_account_states`
- `trust_device_signals`
- `trust_account_links`
- `trust_risk_events`
- `trust_risk_snapshots`
- `trust_reports`
- `trust_moderation_cases`
- `trust_moderation_actions`
- `trust_security_events`
- `trust_review_integrity_events`
- `trust_audit_logs`

Also extends `requests` with:
- `safety_status`
- `visibility_state`
- `moderation_notes`
- `trust_reason_codes`
- `last_risk_score`

`requests_select_public` policy is hardened to show only `published` listings to public users (owners/admin still see their own).

## Sync controls (blocking path)
- listing publish (`POST /api/requests/create`)
  - onboarding guard
  - user risk evaluation
  - listing risk evaluation
  - policy decision: `published | pending_review | restricted | removed`
- chat message send (`POST /api/chat/messages`, `POST /api/global-chat/messages`)
  - onboarding guard
  - conversation scoring
  - hard block/soft block/warn
  - redaction for contact leakage when needed
- auth verification (`wallet`, `telegram`, `invite`)
  - security event log
  - ban evasion linkage check
  - progressive trust state updates

## Async controls
- bulk trust recalculation worker
- periodic correlation and account-link updates
- moderation queue prioritization by score and reason codes

## API surface

### User endpoints
- `POST /api/trust/report` create report with target and evidence
- `GET /api/trust/me` retrieve own trust/risk state

### Admin endpoints
- `GET /api/admin/trust/review-queue`
- `POST /api/admin/trust/cases/[caseId]/action`
- `POST /api/admin/trust/recalculate`

## Frontend integration helpers
- `src/components/trust/TrustSafetyNotice.tsx`
- `src/hooks/use-trust-api-error.ts`

Use these to present security warnings in Italian with consistent UX.

## Reason codes
All reason codes are centralized in:
- `src/lib/trust/reason-codes.ts`

Examples:
- `NEW_ACCOUNT_HIGH_ACTIVITY`
- `EXTERNAL_CONTACT_IN_LISTING`
- `OFF_PLATFORM_PAYMENT_REQUEST`
- `DUPLICATE_IMAGE_SIGNAL`
- `MASS_OUTREACH_PATTERN`
- `MULTI_ACCOUNT_DEVICE_MATCH`
- `SUSPICIOUS_PRICE_DEVIATION`
- `RAPID_PROFILE_MUTATION`

## Rollout plan

### Phase 1 - MVP Safety
- enforce onboarding guard + chat/link blocking + listing pending review
- capture risk snapshots/events
- basic report endpoint + admin queue

### Phase 2 - Advanced Detection
- device linkage + ban evasion correlation
- stronger conversation pattern detection
- auto-priority moderation with case actions

### Phase 3 - Mature Trust Platform
- weighted review integrity
- recurring risk worker and anomaly batches
- tighter category-specific policy thresholds and adaptive friction
