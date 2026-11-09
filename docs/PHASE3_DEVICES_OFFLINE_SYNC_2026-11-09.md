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
