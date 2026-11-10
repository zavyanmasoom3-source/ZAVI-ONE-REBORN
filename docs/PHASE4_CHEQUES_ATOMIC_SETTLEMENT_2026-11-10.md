# ZAVI ONE / ZAVI ONE ADMIN — Stage 4, cheques and financial settlement
Date: 2026-11-10
Branch: dev
Status: **STAGING SQL AND AUTOMATED CONTRACT QA PASSED; LIVE FEATURE NOT ENABLED**

## Authoritative production schema blockers, read-only confirmation

- \`public.zavi_cheques\` exists, owner SELECT/INSERT only. Constraint
  \`zavi_cheque_initial_pending\` **requires pending** and prevents any clearing.
- It lacks a settled-amount column and a server-side, atomic settlement RPC.
- \`public.zavi_cheque_events\` originally lacks operation UUID and immutable
  financial posting fields. Existing online accounts use
  \`zavi_workspaces.payload.tx\`, not an independent journal as the visible
  accounting ledger. A shadow-only cheque journal would not update cashbox,
  supplier payable or customer receivable.
- The production database was **NOT** modified in this stage. No live cheque,
  financial or customer rows were queried or written. No permissions on live
  production roles were changed.

## Stage 4 concrete code committed on dev

- \`supabase/staging/20261110_stage4_cheque_atomic_settlement.sql\` —
  **staging-only**, NOT under \`supabase/migrations\`. Creates the possible
  future migration contract in disposable PostgreSQL 17:
  - expands cheque status only in staging, tracks settled amount and consistency;
  - adds operation UUID and persistent request/result snapshot to cheque audit;
  - introduces immutable, balanced debit/credit postings with owner-only read RLS;
  - adds \`zavi_stage4_cheque_balance\` to reconcile the *real* workspace JSONB
    ledger semantics (sale, purchase, returns, loans, customer/supplier payments);
  - adds owner + active-subscription guarded SECURITY DEFINER RPC with an empty
    search_path; ordinary clients have **no direct UPDATE/DELETE rights**;
  - locks workspace then cheque, returns same result for identical UUID
    retries, refuses different payload with reused UUID;
  - supports deposit, partial/full settlement, bounce/reversal, cancellation;
  - converts foreign cheque amounts to the workspace base currency using
    explicit rate and 2-decimal PostgreSQL numeric rounding;
  - validates account and counterparty, remaining cheque value, outstanding
    receivable/payable, and aborts on insufficient balance;
  - adds a *server-confirmed* \`customer_payment\` or \`supplier_payment\` to
    \`payload.tx\` and increments CAS \`revision\` in the same transaction;
  - bounce preserves the historical payment tx but marks it voided, adds
    immutable reverse journal legs and restores the receivable/payable.
- \`scripts/test-stage4-cheque-postgres.sql\` — synthetic fixture and 7/180/
  365-independent financial assertions for owner, staff/foreign/anonymous,
  bad bank, FX, overpayment, retry, bounce and double entry.
- \`scripts/test-stage4-cheque-concurrency.sh\` — two independent PostgreSQL
  connections race different operation IDs against the same remaining value,
  and replay the same ID under concurrent or dropped-ACK conditions. One
  competing operation succeeds; no duplicate posting or revision is produced.
- \`scripts/test-stage4-cheque-transaction-rollback.sql\` — a successful
  posting inside a rolled-back caller transaction leaves no modified cheque,
  event, posting, payment or revision. Also asserts forbidden client grants.
- \`.github/workflows/stage4-cheque-contract.yml\` — runs the full staging
  contract against a throwaway PostgreSQL 17 container on dev changes;
  no secrets, user accounts or real Supabase data are used.

## Evidence

- GitHub Actions **42769340807 PASS** on commit \`04c8a19d\`: fixture
  registration, partial+full settlement, bounce, FX, authorization and audit.
- GitHub Actions **42769572623 PASS** on commit \`08d56e25\`: above plus
  real two-connection race, same-UUID replay, and lost-response retry.
- GitHub Actions **42769764194 PASS** on commit \`2e03085d\`: above plus
  transaction rollback, privilege regression and pure JavaScript contract.
- Existing migration-integrity CI continued passing on intermediate commits.
  These are **isolated staging results**, not live customer validation.

## Safety and remaining acceptance gates

1. Review rollback and reproducible schema-level backup in a dedicated
   **staging Supabase project**, including compatibility with installed
   subscription/auth/RLS functions, historical cheque rows and ledger shapes.
   A simple DOWN migration cannot blindly restore the pending-only
   constraint after cheques have been legitimately settled.
2. Test two real Supabase-authenticated tenants with different owner/staff
   roles; test Supabase grants, foreign workspaces, audit durability and
   expired subscription. The CI Auth function is synthetic and is not
   a substitute for real Supabase JWT authorization.
3. Compare the SQL debt/cash and return/FX rules with actual complex invoices
   and multi-currency data, including voiding, partial payment, outstanding
   limits and per-account currency. Test negative/large/rounding cases.
4. Implement **real customer UI** (received/issued cheques, dates, reminders,
   detail, deposit, partial/full clearance, bounce and cancellation) in
   Dari/Pashto/English, consistent in Light/Dark/Glass, and integrate the
   server RPC in the authenticated ZAVI ONE/ADMIN client. It is **not enabled**
   by this staging source.
5. Implement a durable per-workspace/device offline operation queue with
   UUIDs, confirmation/replay, revision conflict recovery and no optimistic
   cashbook posting. Complete multi-device real Android sale/cheque offline
   reconciliation and crash/reconnect tests.
6. Perform supported release signing, Android/Windows install/upgrade and
   balance reconciliation on real test hardware before marking Stage 4 complete.

**Production posture:** no cheque migration deployed, no accounting
records touched, no claimed stable APK. Do not remove the existing
\`zavi_cheque_initial_pending\` constraint until the above gates are passed.
