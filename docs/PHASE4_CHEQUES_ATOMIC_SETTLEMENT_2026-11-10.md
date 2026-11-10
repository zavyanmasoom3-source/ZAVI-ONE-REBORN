# ZAVI ONE / ZAVI ONE ADMIN — Stage 4, cheques and financial settlement
Date: 2026-11-10
Branch: dev
Status: **LIVE SERVER RPC DEPLOYED; REAL MONEY-PAGE CLIENT CONNECTED IN DEV; PHYSICAL RELEASE CERTIFICATION PENDING**

## Original production schema blockers — historical pre-deployment audit

- \`public.zavi_cheques\` exists, owner SELECT/INSERT only. Constraint
  \`zavi_cheque_initial_pending\` **requires pending** and prevents any clearing.
- It lacks a settled-amount column and a server-side, atomic settlement RPC.
- \`public.zavi_cheque_events\` originally lacks operation UUID and immutable
  financial posting fields. Existing online accounts use
  \`zavi_workspaces.payload.tx\`, not an independent journal as the visible
  accounting ledger. A shadow-only cheque journal would not update cashbox,
  supplier payable or customer receivable.
- At this initial audit checkpoint, production had not yet been modified. This
  statement is historical; see **Live server deployment** below for the new
  actual schema and permission changes. No financial row writes were performed.

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

## Original release acceptance gates (current verification follows below)

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

**Historical checkpoint (before deployment):** no migration had yet been applied.
This is superseded by the deployment verification below. No stable APK is claimed.


## Stage 4 security follow-up — RLS registration guard

A second review found a real staging hazard: removing the original pending-only
CHECK while keeping the old owner INSERT RLS policy (ownership only) would have
allowed a normal owner INSERT with a forged \`cleared\` or
\`partially_cleared\` cheque, bypassing balanced accounting posts.

The staging SQL now replaces the owner INSERT policy with one requiring
\`status='pending'\`, zero settled amount and null clearing/linked transaction
timestamps. The synthetic fixture reproduces the original workspace, cheque
and event RLS policies, and explicitly rejects forged cleared and partially
cleared client INSERT operations.

**42770256781 PASSED** (SHA \`cbf5b8d26e100ef0dc0c8a80bd9f0acb41b31f7a\`):
PostgreSQL 17 settlement, original RLS + hardened insertion, two-session
concurrency and lost ACK, and complete caller-transaction rollback.

A previous **read-only** production check confirmed the old pending-only
constraint. This was accurate *before* the live installation described below.


## Live server deployment and browser-backed accounting client — 2026-11-10

**Actual primary Supabase project**: selected from the original published
\`apps/one/cloud-config.js\`. The migration was applied using the Supabase
migration service as \`stage4_atomic_cheque_settlement_preuse\`
(version \`20261110070048\`), from the exactly committed reviewed source:
\`supabase/migrations/20261110_stage4_cheque_atomic_server.sql\`.

The migration refuses to run if any cheque/event exists, if the unexpected
original pending-only constraint is missing, or if Stage 4 RPC is already
installed. It locks the cheque registry while checking the preconditions.
Direct production preflight (PostgreSQL 17.11) found **zero existing cheque
rows**, **zero audit event rows**, the expected old CHECK, and no prior RPC.
The migration returned \`success:true\`.

**Independent post-deployment read-back from live pg_catalog**:
- Public \`zavi_stage4_cheque_apply\` exists, is SECURITY DEFINER with pinned
  empty search_path and checks the owner, workspace and active subscription.
- \`zavi_stage4_cheque_balance\` exists; private helper execution is blocked
  for ordinary authenticated/anonymous clients.
- Original pending-only CHECK is replaced by amount/status invariants and
  a stricter owner-only INSERT RLS policy requiring *pending*, zero settled,
  no clearing timestamp and no linked transaction.
- \`anon\` cannot EXECUTE the RPC; authenticated can call it, but the
  function itself enforces workspace ownership and active subscription.
- Clients lack direct UPDATE of \`zavi_cheques\` and INSERT to event and
  posting tables. Immutable postings are readable only under owner RLS.
- Immediately after migration: **0 cheques, 0 events, 0 postings, 6 existing
  workspaces**. No workspace payload, sales transaction or user ledger
  was touched by migration SQL.
- The guarded **pre-use-only** rollback is at
  \`supabase/rollback/20261110_stage4_cheque_preuse_only.sql\`; CI proves
  it refuses after posted activity and restores original constraints before
  activity. Never run this rollback after real settlements.

**Actual client integration**:
- \`apps/one/zavi-cheques-v1.js\` and \`zavi-cheques-v1.css\` render in the
  existing Money route, with owner-scoped lists, 3 locales, real registration
  \`POST /rest/v1/zavi_cheques\`, real settlement
  \`POST /rest/v1/rpc/zavi_stage4_cheque_apply\`, and responsive theme-safe UI.
- Supports deposit, partial/full settle, bounce, cancel. Real ISO currencies
  from the existing currency catalog and manual FX rate for cross-currency
  settlements. Registration can create **pending** only and has no cash effect.
- Offline operations are *intents*, not payments. Per owner+workspace durable
  localStorage queue holds a stable random operation UUID. On reconnect,
  server confirmation with matching operation UUID is required before removal.
  Timeout, ambiguous acknowledgment or 403/404 leaves the request pending;
  no optimistic cash/receivable mutation occurs.
- \`cloud.js\` now reconciles the server's new workspace revision while
  refusing to overwrite any local pending/conflicting invoices.
- The real module is part of the service worker's offline app assets.
  This is source-level integration on \`dev\`, **not** proof installed
  devices have received the updated package.

**Reproducible evidence**:
- [Stage 4 PostgreSQL 17 and pre-use rollback gate](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42772166626) — **SUCCESS**.
  Includes real PostgreSQL locks with independent connections, same-key
  replay, dropped ACK, balanced postings and rollback, fortified production
  migration guard.
- [Stage 4 real Money-page and whole-app integrity browser gate](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42772166713) — **SUCCESS**.
  Tests actual rendered UI and intercepted synthetic HTTP, queue retention,
  matching vs invalid server acknowledgments, cash unchanged without server
  approval, existing accounting integrity, 3-device mock and offline bundles.
- Additional ISO calendar validation and full currency catalog changes
  committed on dev; check the latest CI run for the final source SHA before
  describing it as green.

### What remains unverified before Stage 4 can be called 100% release-ready

A live authenticated owner on a dedicated test workspace must exercise real
Supabase JWT authorization, create a pending cheque, settle in partial and full
payments and verify actual cash, customer and supplier balances. Also test the
same operation from two separate authenticated Android devices, offline queue
restart, lost network ACK, backed-up restore, and installed APK/WebView
persistence. No owner test credentials or physical two-device test setup is
available in this conversation. There is also no live successful financial
posting in production (deliberately), so do **not** confuse deployed source,
isolated QA and real customer financial certification.

The module must not be called a stable Release, and Stage 4 must not be marked
100% certified until those acceptance gates are evidenced.
