# ZAVI ONE — Stage 3: primary devices, signed offline access and safe synchronization

Date: 2026-11-09
Branch: `dev`
Scope: ZAVI ONE Stage 3 only. No changes to accounting records, customer records, signing secrets, or the production Supabase schema.

## Verified application fixes

1. **Primary-device transfer fails closed.** `apps/one/device-activation.js` now stops immediately when `ZaviDevices652.guardTransfer` refuses a transfer; it shows the specific rejection and never sends the one-tap replacement RPC. The server was already refusing stale/pending previous-device reports, but the former client ignored that decision and submitted anyway.
2. **Previous-device sync age matches the real server rule.** `apps/one/zavi-devices-v652.js` now treats a fresh heartbeat with an old last-cloud-sync timestamp as unverified, matching the server's 15-minute relation between `last_report_at` and `last_sync_at`.
3. **Offline status never renders a prior owner's late result.** `apps/one/zavi-v6570-store-offline.js` scopes each asynchronous response to the active user/workspace and locale, discards stale replies, schedules a new load after switching accounts, and updates headings for Dari, Pashto and English.
4. **Effective offline duration respects the subscription.** The status panel now shows the lesser of the policy limit and the *server-reported effective offline expiry*, instead of misleadingly displaying the raw policy duration when it extends past the subscription's end.
5. **The offline service-worker cache is versioned** with the mandatory `zavi-one-design-tokens-unified-` prefix so an installed client can fetch the corrected scripts.

## New isolated regression tests

- `scripts/test-phase3-device-activation.cjs`: local/past-device pending, stale/unknown, server unavailable, staff denial, offline denial, server rejection, in-flight one-tap idempotence, and signed-lease sequencing. No live owner account or Supabase request.
- `scripts/test-phase3-device-freshness.cjs`: synthetic previous-device reports, stale/missing sync, future time, multiple active reports, revoked device and pending count; server contract comparison.
- `scripts/test-phase3-offline-status-browser.py`: live Chromium Settings card, three locales, delayed fake server response after changing owner/workspace, and 7 effective days from an older 180-day policy capped by subscription expiry.

The device tests run as part of `Migration integrity gate`; the Chromium status test runs as part of `REBORN PDF visual QA screenshots`. Existing cloud-sync QA also checks CAS, dropped ACKs, conflict and multi-device state with isolated fixtures.

## CI evidence and qualification

- `42670790940`: migration integration **success**, after primary-device fail-closed fix.
- `42671305611`: migration integration **success**, after sync-freshness fix.
- `42672579731`: visual QA **success**, with scoped offline-status fixture.
- `42672579893`: migration integration **success**.
- `42673237170`: visual QA **success** on code commit `69892ad9d9bd0d99a78b14be8c4028e85da73464`, including the effective offline-days check and correct cache identifier.
- On that same SHA, workflow-level results for `42673237397` (migration) and `42673237325` (transit) were reported as **failure** despite some individually passing steps; do not label them green until a fresh complete pass is confirmed.

## Production Supabase metadata/source audit (read-only)

Target project was resolved from the public app configuration, not inferred from another account. No user/customer row data was retrieved or modified.

- The deployed `zavi_v6580_owner_one_tap_transfer` function checks `auth.uid()` against the workspace owner, checks an active subscription, and refuses old-device pending or unverified sync reports. The device table has a unique partial index restricting each workspace to one active primary device.
- The deployed `zavi-offline-lease` Edge Function requires a verified user session, active subscription entitlement, authorized primary device, and enabled policy (7/180/365). It signs the lease with ES256 and caps its expiry at the subscription expiry.
- The server already has automatic offline-policy triggers on subscription and legacy term-license updates. **Observed consistency caveat:** the active cloud-subscription trigger currently sets the *raw* policy duration to 180 for a trial, although the signed lease expires no later than the trial subscription; the new read-only UI reports effective days, not the raw number. The underlying trigger was **not changed**.
- No emergency override of unsent transactions was implemented. The server refuses such transfer to protect the old offline-only ledger.

## Acceptance status

**Stage 3 source fixes and isolated browser/Node contract checks are progressing, but Stage 3 is NOT release-certified.** Outstanding items include a consistently successful full integration workflow at the final SHA, an authenticated end-to-end test with two distinct owner-device sessions and server denial/approval, a real signed lease on Android, physical offline sale and post-reconnect sync checks, and review of the trial policy's raw 180-day metadata. A disconnected old device may continue using a previously issued unexpired offline lease until it reconnects; instantaneous remote revocation cannot be guaranteed offline.

Do not proceed to Stage 4 or announce a stable APK based solely on this checkpoint.


## Stage 3 follow-up hardening and applied server changes — 2026-11-09

### Production policy: 7 / 180 / 365 days

The previously noted trial-policy inconsistency has now been fixed in the
**actual primary Supabase project** (selected from apps/one/cloud-config.js),
using the named schema migration phase3_trial_offline_policy. Committed source:
supabase/migrations/20261109_phase3_trial_offline_policy.sql.

- Trial 7 days, semiannual 180 days, annual/lifetime 365-day renewable
  policy; a trial-to-paid upgrade switches to the newly paid duration
- A separately configured seven-day limit on an **existing paid** plan
  remains unchanged by ordinary renewal updates
- The policy change does **not** extend subscriptions, issue ES256 tokens,
  enable archived customers, or mutate accounting rows
- Direct post-migration introspection verified deployed trial=7, upgraded
  plan handling, preserved manual paid limits and **zero trial mismatches**
- **42676403739 PASSED**: executes migration SQL against synthetic active,
  expired, suspended, archived, manual-override and upgraded subscriptions
  on disposable PostgreSQL 17

### Revocation must also be confirmed synced

Stage 3 security audit found that public.zavi_v652_owner_revoke_device checked
fresh heartbeat and zero pending, but **not last confirmed cloud sync**.
This differed from primary-device transfer and could mislead the owner.

- The customer app now uses isVerifiedSynced for both transfer eligibility
  and device revocation preflight in apps/one/zavi-devices-v652.js
- Production RPC updated with migration phase3_device_revoke_sync_guard,
  committed in supabase/migrations/20261109_phase3_device_revoke_sync_guard.sql
- Server requires workspace owner authentication, zero pending, recent
  heartbeat and last confirmed cloud sync within 15 minutes of the
  heartbeat; unknown/future/missing sync evidence fails closed
- Explicit authenticated owner guard and fixed empty search_path remain;
  repeated revocation is idempotent
- **42677108250 PASSED**: verifies both migrations on disposable PostgreSQL 17,
  including wrong-owner rejection, stale/future, pending and idempotent cases
- Direct post-migration introspection verified new live server function
- Only function definitions were replaced: no existing device,
  accounting, customer or subscription rows were updated

### Signed-lease verifier and browser QA

- **42676876385 PASSED**: actual app browser routes and Settings, scoped
  offline status, three locales and effective expiry
- scripts/test-phase3-signed-lease.cjs tests real client-side ES256
  verification code with a fixture signature-success stub, plus actual
  WebCrypto import of the pinned *public* P-256 JWK
- Verifies tenant/workspace/device claims, expired/future timestamps,
  subscription cutoff, denied write, invalid signature and 403-denial
  cache retention. It cannot prove a *live* signer matches the client key
- Existing CAS/dropped-ACK, three-device and offline shell tests remain in
  the Migration integrity gate, requiring a green run for final source QA

### Release boundary — real hardware tests are still required

Passing isolated tests is **not equivalent** to real on-device certification.
A dedicated test business, authorized owner accounts and Android devices
must validate actual Supabase Auth sessions, real server-approved/rejected
transfer, a live ES256 lease, offline sale/purchase persistence, reconnect
upload and no duplicate financial transactions. Such hardware and owner
credentials were **not** available during this chat. No APK was built,
installed or designated stable as part of Stage 3.

An unreachable previous device may retain a previously issued unexpired
offline lease until it reconnects or expires: remote instant revocation
cannot be guaranteed during a true disconnection.

The broader Supabase security-advisor scan also reports pre-existing
notices for public SECURITY DEFINER RPCs and some RLS tables with no
direct policies. These are not all proven vulnerabilities (owner-gated
RPCs and denied tables may be intentional), but Stage 3 does not claim
to certify every unrelated function and table.

## Stage 3 follow-up — 2026-11-10: legacy device-replacement bypass closed

A read-only production audit found that the current `zavi_v6580_owner_one_tap_transfer`
had the appropriate last-sync/pending checks, but delegated to the older public
`zavi_v41_owner_replace_device` RPC. That older RPC could also be called directly
by an authenticated owner and replaced the active device **without** its own
sync check. The separately billing-admin-gated `zavi_admin_replace_device`
had the same missing safety condition, including through the ADMIN UI.

- Replaced both existing RPC function definitions to enforce zero pending,
  a recent heartbeat and confirmed last sync (plus existing owner or billing
  admin checks). Existing signatures and success responses are retained.
- The migration is committed as
  `supabase/migrations/20261110_phase3_legacy_device_transfer_guard.sql`
  and its disposable PostgreSQL 17 test as
  `scripts/test-phase3-legacy-device-transfer.sql`.
- On commit `3455418d4bc063a70b0770739a7a3a4df215276c`,
  GitHub Actions `42766575548` (Stage 3 PostgreSQL policies) and
  `42766575484` (Migration integrity gate) completed **successfully**.
- Applied named migration `phase3_legacy_owner_admin_device_sync_guard`
  to the primary Supabase project. Read-back of the two deployed
  `pg_get_functiondef` definitions independently confirms both checks.
  Migration history now contains version `20261110061002`.
- No user/customer/financial/device rows were modified by this migration:
  it consists of two `CREATE OR REPLACE FUNCTION` statements and comments.
  Tests use synthetic data and roll back their transactions.

**Remaining release gate:** direct Android hardware testing with two distinct
authenticated owner devices, genuine live-signed ES256 lease, offline
sale/purchase, reconnect synchronization, and no duplicate financial postings.
A disconnected older device can retain a prior unexpired offline lease until
expiration/reconnection. Do not mark Stage 3 100% certified or ship stable
APKs until those on-device checks are evidenced.
