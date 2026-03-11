# Content Moderation System (Public/Semi-Public Only)

## Scope
This moderation stack applies to public and semi-public content only.

Excluded by design:
- `/inbox`
- private messages
- direct messages
- endpoints/services dedicated to private inbox messaging

## Core module
- `src/lib/moderation/moderation.types.ts`
- `src/lib/moderation/moderation.reason-codes.ts`
- `src/lib/moderation/moderation.config.ts`
- `src/lib/moderation/moderation.rules.ts`
- `src/lib/moderation/moderation.providers.ts`
- `src/lib/moderation/moderation.audit.ts`
- `src/lib/moderation/moderation.service.ts`

### Entry point
- `moderateContent(input)` in `moderation.service.ts`

### Skip helper
- `isInboxRoute(pathname)`
- `shouldSkipModeration(input)`

## Decision outcomes
- `allow`
- `flag`
- `review`
- `block`

## Audit tables
- `moderation_events`
- `moderation_reviews_queue`

Migration:
- `supabase/migrations/20260311183000_content_moderation_system.sql`

## Integrated handlers
- Listing create: `POST /api/requests/create`
- Listing update: `PATCH /api/requests/[id]/update`
- Public profile update: `POST /api/profile/public/update`
- Review submit: `POST /api/reviews/submit`
- Comment submit: `POST /api/comments/submit`
- Public form submit: `POST /api/public/forms/submit`
- Report text moderation: `POST /api/trust/report`

## Server action example
- `src/app/actions/content-moderation.server.ts`
