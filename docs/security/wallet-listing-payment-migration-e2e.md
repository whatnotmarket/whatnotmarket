# Wallet/Listing Payment Hardening E2E Validation

Scope: validate `supabase/migrations/20260311005000_wallet_and_listing_payment_insert_hardening.sql` in a real environment (staging/prod-like), including RLS + trigger enforcement on `wallets` and `listing_payments`.

## Preconditions
- Migration `20260311005000_wallet_and_listing_payment_insert_hardening.sql` applied.
- Two real test users:
  - `payer_user` with verified wallet `W1` on chain `C`.
  - `payee_user` with verified wallet `W2` on chain `C`.
- `W1 != W2`.
- Service role API available for controlled backend-path checks.
- At least one listing ID that can be used for payment creation tests.

## Test Matrix

### 1) Wallet write hardening (`public.wallets`)
1. Authenticated non-admin tries direct insert into `wallets`.
   - Expected vulnerable signal: insert succeeds.
   - Expected correct behavior: fail with `wallet_mutations_require_admin` (trigger) or RLS denial.
2. Authenticated non-admin tries direct update on existing wallet row.
   - Expected vulnerable signal: update succeeds.
   - Expected correct behavior: fail with `wallet_mutations_require_admin`.
3. Admin user inserts/updates wallet.
   - Expected correct behavior: succeeds.
4. Service role inserts/updates wallet (backend path).
   - Expected correct behavior: succeeds (trigger allows `auth.uid() is null`).

### 2) Listing payment insert guard (`public.listing_payments`)
1. Insert with `status != pending`.
   - Expected correct behavior: fail `listing_payment_insert_status_must_be_pending`.
2. Insert with `tx_hash_in` or `tx_hash_out` non-null.
   - Expected correct behavior: fail `listing_payment_insert_hashes_must_be_null`.
3. Insert with `payer_user_id == payee_user_id`.
   - Expected correct behavior: fail `listing_payment_insert_self_payment_forbidden`.
4. Insert with same payer/target wallet address.
   - Expected correct behavior: fail `listing_payment_insert_wallets_must_differ`.
5. Insert with empty idempotency key.
   - Expected correct behavior: fail `listing_payment_insert_idempotency_required`.
6. Insert where payer wallet is not verified/bound to payer user.
   - Expected correct behavior: fail `listing_payment_insert_invalid_payer_wallet`.
7. Insert where payee wallet is not verified/bound to payee user.
   - Expected correct behavior: fail `listing_payment_insert_invalid_payee_wallet`.
8. Authenticated user inserts payment where `payer_user_id != auth.uid()` and not admin.
   - Expected correct behavior: fail `listing_payment_insert_only_payer_allowed`.
9. Valid insert (all constraints respected).
   - Expected correct behavior: succeeds.

### 3) API E2E: `/api/listing-payments/create`
1. Valid payload with verified payer/payee wallets and `Idempotency-Key`.
   - Expected: `200`, `idempotent: false`, `status: pending`.
2. Replay same `Idempotency-Key` (same payer).
   - Expected: `200`, `idempotent: true`, same payment row.
3. Payload with self-directed payee.
   - Expected: `400`, explicit error.
4. Payload with unverified payer wallet.
   - Expected: `400`, explicit error.
5. Payload with mismatched `payeeUserId` vs target wallet owner.
   - Expected: `400`, explicit error.

### 4) API E2E: `/api/listing-payments/fund` + `/api/listing-payments/cancel`
1. Submit valid `txHashIn` on pending payment.
   - Expected: `200`, payment updated, escrow action written.
2. Re-submit same `txHashIn`.
   - Expected: idempotent success, no second divergent state.
3. Submit different `txHashIn` after first hash exists.
   - Expected: `409` with guard reason.
4. Cancel pending payment by payer.
   - Expected: `200`, `status: cancelled`.
5. Cancel non-pending payment.
   - Expected: `409`.

## SQL Spot Checks (Post-Run)
```sql
-- Ensure no non-pending inserts slipped in.
select id, status, tx_hash_in, tx_hash_out
from public.listing_payments
where status <> 'pending' and created_at > now() - interval '1 day';

-- Ensure no self-payment rows slipped in.
select id, payer_user_id, payee_user_id
from public.listing_payments
where payer_user_id = payee_user_id
  and created_at > now() - interval '30 day';

-- Ensure wallet-bound consistency for recent inserts.
select lp.id
from public.listing_payments lp
left join public.wallets w_payer
  on w_payer.user_id = lp.payer_user_id
 and lower(w_payer.address) = lower(lp.payer_wallet_address)
 and lower(w_payer.chain) = lower(lp.chain)
 and w_payer.verified_at is not null
left join public.wallets w_payee
  on w_payee.user_id = lp.payee_user_id
 and lower(w_payee.address) = lower(lp.target_wallet_address)
 and lower(w_payee.chain) = lower(lp.chain)
 and w_payee.verified_at is not null
where lp.created_at > now() - interval '30 day'
  and (w_payer.id is null or w_payee.id is null);
```

## Operational Notes
- Run this suite in a dedicated staging dataset, then rerun a reduced subset in production with low-volume synthetic accounts.
- Capture API request/response IDs and DB errors in a shared report for audit traceability.
- If any negative test succeeds, treat as blocker before enabling wider rollout.
