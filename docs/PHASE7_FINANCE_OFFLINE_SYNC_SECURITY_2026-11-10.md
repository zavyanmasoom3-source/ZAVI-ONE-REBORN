# ZAVI ONE — Stage 7: financial integrity, offline sync and device authorization

Date: 2026-11-10; canonical source: `zavyanmasoom3-source/ZAVI-ONE-REBORN`, branch `dev`.

**Status: actual client and server hardening committed, legacy RPC deployed, automated PostgreSQL 17, accounting/browser and source integrity tests PASSED. Genuine owner/nonowner JWT, Android hardware and production Release acceptance are NOT certified.**

## Issues detected in real source and database

1. **Offline accounting loss during maintenance reset:** `apps/one/cloud.js` assumed that any truthy historical `zaviMaintenanceResetAt` plus an advanced cloud revision authorized discarding a newer local pending sales/purchases snapshot. It silently cleared the owner-specific pending marker and selected the cloud snapshot without explicit confirmation. An old reset marker could therefore make fresh offline documents disappear from the active view.
2. **Legacy sync endpoint bypass:** live `public.zavi_v28_receive_sync_operation(...)` accepted new sync metadata from a workspace owner based on a legacy term-licence table without verifying the current registered primary device or the canonical subscription state (including archival). Duplicate operation IDs were already compared for idempotent ACK, which must stay intact.
3. **Direct cloud snapshot upload lacked a device preflight:** `cloud.js` uploaded to `zavi_workspaces` REST PATCH after client-side owner session and CAS checks, without first consulting the existing server-backed `zavi_v28_device_sync_authorization` RPC. A previously replaced device with an owner JWT could attempt an online upload.

## Fixes implemented in actual application

- `apps/one/cloud.js`: maintenance marker must be a strictly formatted, valid UTC timestamp newer than both the pending local snapshot and any durable pending marker. Unknown revision, malformed clock, prior/obsolete reset or invalid local data result in **preserve local pending + conflict**.
- Even with a genuinely later reset, the owner must independently confirm **twice**, including typing the exact workspace name. The **complete original local snapshot** is written into a tenant-specific quarantine key and its bytes read back before replacement. Only after successful activation of the new snapshot is the durable pending queue cleared. Refusal and quota/activation errors never claim synchronization success. Old account caches are not deleted.
- `apps/one/cloud.js`: the existing `afterSave` pending marker now preserves `local_updated_at`, `recorded_at` and source metadata so future ordering checks have durable evidence.
- `apps/one/cloud.js`: before every cloud CAS upload, look up the current locally scoped device identifier and request `zavi_v28_device_sync_authorization` using the current authenticated owner session and workspace. Require matching workspace/device identity, `device_allowed===true` **and** `sync_allowed===true`. Denial or network failure retains the local records and pending marker; it does not issue a PATCH.
- `supabase/migrations/20261110_stage7_sync_operation_device_entitlement_guard.sql`: preserve the existing legacy RPC signature and idempotent return contract; require real `auth.uid()` workspace ownership, canonical subscription validity via `private.zavi_subscription_is_active`, and registered `active`/unrevoked device for **new operations**. Bound operation payload sizes and deny malformed/future-dated payloads. Identical already-received operations can still receive a harmless `already_received` reply after revocation/expiry; attempts to reuse an operation ID with different financial content fail. No rows are deleted or modified.

## Verified real server migration (schema/function only)

Applied named migration `stage7_sync_operation_device_entitlement_guard` to primary Supabase and re-read its installed source and grants. The legacy RPC is now restricted to authenticated callers, and both active-device and canonical-subscription guards are installed.

Read-only before/after production catalog checkpoints remain:
- **6** workspaces;
- **60** device registration rows;
- **0** stored legacy sync operations;
- **1** recoverable customer archive record;
- **2** ADMIN audit events.

No customer subscription, device authorization, invoice, warehouse, payment, or original accounting row was mutated in production. The test-only PostgreSQL 17 data exists only on a disposable CI database.

## Automated evidence on the actual source

- [Stage 7 security regression, run 42781065240](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42781065240): **SUCCESS**. The gate directly tests the shipping `choose()` and pending marker semantics, the real `cloud.js` cloud retry logic, separate PostgreSQL 17 security fixture with owner/unrelated/no-token, revoked device, expired/archived subscription, idempotency and amount mismatch, plus three actual disposable browser profiles and ledger arithmetic.
- [Full migration integrity gate, run 42781064860](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42781064860): **SUCCESS**, 40 successful steps. Includes standard authentication, signature, customer-safety, pending-cloud, cashier and financial invariants.
- `scripts/test-stage7-reset-pending-integrity.cjs`: executes **the actual `choose()` function** with synthetic sales/purchases and verifies stale marker, denied consent, mismatched typed name, quota failure, activation failure, owner switch, quarantine recovery, and exact success order.
- `scripts/test-stage7-sync-operation-postgres.sql`: executes the real migration in disposable PG17 and confirms denied new records from revoked or unrelated devices, invalid/future values, expired/archived accounts, same-ID altered-money conflicts, and idempotent ACK after revocation.
- `scripts/test-cloud-three-device-browser.py`: added **Case 5**, authentic request to a disposable mock canonical device authorization endpoint. A revoked device cannot PATCH; the unsent sale and queue survive. After re-authorization, the same sale uploads **once**. Prior four collision, dropped ACK, delete/edit and clock skew cases remain.
- CI workflows `.github/workflows/stage7-finance-offline-security.yml` and `.github/workflows/migration-integrity.yml` enforce these tests automatically.

## Remaining security and release boundaries (do not misrepresent)

1. **Direct REST PATCH remains a privileged owner+subscription RLS path:** the primary workspace UPDATE policy enforces owner and active subscription, but does not itself enforce device-specific proof. The new client authorization preflight and hardened *legacy operation RPC* protect normal shipping clients and that separate RPC, respectively; they are **not equivalent to enforcing active-device authorization inside every direct PostgreSQL workspace UPDATE**. A malicious client with a still-valid owner token could bypass a client-side check. True server-side device-bound CAS with tamper-resistant proof, retiring raw client UPDATE, and compatibility checks for all existing accounting writers remains a release-level security task. Do not claim that device revocation cryptographically invalidates all existing owner JWTs or leases.
2. An entirely disconnected revoked device can continue to use an already-issued unexpired offline ES256 lease until its expiry. Instant remote revocation without communication is impossible.
3. A real owner and a separate non-owner disposable tenant must test authenticated HTTP RLS, refused foreign updates, device replacement, offline signed licence, live cheque settlement, and loss/retry. These tests have not been run against real user sessions; no customer finances were touched.
4. Source/browser and PostgreSQL tests do not substitute for Android 8–16 physical install, offline restart/storage, camera/thermal/WhatsApp, biometric and data-preserving upgrade.
5. The persistent owner signing Secrets from Stage 6 are still missing in GitHub Actions. No new signed APK or Windows installer was delivered or declared Release-ready here.

**Disposition:** Stage 7's concrete offline-loss and historical sync-bypass vulnerabilities were fixed and validated in source, isolated server tests and live function read-back. The broader system is **not 100% release-certified** until direct workspace update paths, genuine signed-in test sessions and on-device installation are independently verified.


## 2026-11-10 final server CAS hardening — code and production deployment

A second pass found that a client-only device-authorization preflight
was insufficient: a raw REST `PATCH zavi_workspaces` can bypass the
preflight if the caller still holds a valid owner JWT. This must not be
misreported as cryptographically-enforced device revocation.

**Non-destructive source and server additions:**

- Added `supabase/migrations/20261110_stage7_server_cas_device_guard.sql`:
  a new `public.zavi_stage7_workspace_cas(uuid,text,bigint,jsonb,text)`
  SECURITY DEFINER RPC, with pinned empty search path, explicit server owner
  UID check, active non-archived subscription, active unrevoked registered
  primary device, required financial arrays, 64-MiB payload bound and
  atomic `revision=expected` compare-and-swap. It can never update
  `owner_uid`, `id` or anything outside the selected workspace.
  The server owns `updated_at`.
- Replaced the **shipping** `apps/one/cloud.js` raw REST financial PATCH
  with a POST to the new server RPC, supplying workspace ID, expected
  revision, device ID and the full current snapshot. Existing conditional
  retry still queries the original workspace and checks the **whole
  payload** before acknowledging a lost HTTP response. Revisions never
  auto-merge conflicting offline financial records.
- The disposable three-device mock now implements the actual server RPC
  and **rejects any direct PATCH**. It verifies real concurrent invoice
  edits, dropped server ACK, stock delete/edit, clock skew, revoked-device
  pending persistence and exactly-once replay after reauthorization.
- New `scripts/test-stage7-workspace-cas-postgres.sql` runs the exact
  migration against isolated PostgreSQL 17 data, testing the real RPC for
  authentic owner, cross-tenant refusal, invalid payload, stale revision,
  revoked device, expired subscription, archived customer, no authentication
  and unchanged committed financial data on invalid attempts.
- `scripts/test-stage7-no-raw-workspace-write.cjs` enforces a permanent
  source-level prohibition on reintroducing the direct PATCH path.
  CI `.github/workflows/stage7-finance-offline-security.yml` includes
  both new real-source and PostgreSQL regression tests.

**Production read-back** after applying named migration
`stage7_atomic_workspace_cas_device_subscription`:
RPC exists; `anon` cannot execute; `authenticated` has access only
subject to strict internal owner+device+entitlement checks; CAS guards
were read back directly from the installed function. Existing values
remained **6** workspaces, **60** registered devices, **0** stored legacy
sync operations and **1** recoverable customer archive. No customer
record was modified by this function-definition migration.

**CI evidence**:
- [Stage 7 RPC + three-device financial regression 42783785949](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42783785949) — **SUCCESS**.
- [Full migration integrity 42783401204](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42783401204) — **SUCCESS** on the new RPC client path. Refer to the latest run for the newest SHA.

**Hard release safety limit:** we have NOT revoked the older `authenticated
UPDATE` permission on `public.zavi_workspaces`, because older installed
versions still send direct PATCH. Revoking it without producing,
signing and physically upgrading customer APKs could strand unsent
sales and purchases. The current new-client RPC blocks direct bypass
in the shipping source, but a modified old client with a valid
owner JWT may still bypass device preflight through legacy REST until
that UPDATE grant is revoked in a **separate rollout**.

**Device identity limit:** `device_id` is a client-issued opaque string
not hardware-bound proof. The new RPC checks it against current server
registration, but a malicious authenticated client that knows the
current active ID could impersonate it. For a full threat-model
closure, verify an owner-session-to-device credential bound by
asymmetric key possession or comparable authenticated device binding;
then retire raw UPDATE only after a tested signed upgrade.

**Next acceptance gates before 100% completion:**
1. Configure original persistent Android signing secrets and verify
   an in-place test upgrade preserves unsent offline accounting;
2. Test real Supabase JWTs (owner, revoked device, unrelated owner,
   expired/archived subscriber), device transfer and API replays in
   a disposable empty workspace, never real customer ledgers;
3. Test signed Android 8–16 WebView restarts/printing/camera/offline
   financial persistence; deploy to customers without data loss;
4. Only after compatibility proof, revoke `authenticated UPDATE`
   on `zavi_workspaces` and verify cross-tenant/old-client rejection;
5. If strict device revocation against an adversarial owner token is
   necessary, replace spoofable ID with non-replayable signed device
   possession and verify invalidated sessions on sensitive writes.

**No final APK, Windows Installer or unconditional Stage 7 = 100%
certification is claimed at this point.**


## Stage 7 — safe per-workspace legacy cutover gate (final additional work, 2026-11-10)

The old UPDATE grant is still required for earlier installed APKs. Rather than
revoking it globally and risking loss of unsent invoices, we installed a
**restrictive RLS cutover policy** that can block direct writes **only after
a particular shop has completed a signed, data-preserving upgrade**.

- Migration: `supabase/migrations/20261110_stage7_progressive_legacy_write_cutover.sql`.
- Existing `public.zavi_workspaces` UPDATE owner/subscription policies remain
  untouched. A new restrictive UPDATE policy, `zavi_stage7_upgraded_server_only`,
  adds an independently protected server-side check.
- Private `zavi_stage7_rpc_only_workspaces` enrollment ledger is denied to
  normal authenticated customers and exposed anonymous clients. The
  migration **does not insert any enrollment rows**.
- Once a separate, approved deployment records a verified original-signed
  app version and tested local backup for a specific workspace, raw owner
  REST PATCH is blocked for that workspace. The checked `zavi_stage7_workspace_cas`
  SECURITY DEFINER RPC continues to work after cutover.
- Enrollment is deliberately **not automatic**: no installed shop will stop
  syncing just because this migration was applied.

**Live primary Supabase deployment**:
`stage7_progressive_legacy_write_cutover_no_enrollment` — applied
successfully. Re-read production counts: **6 workspaces, 60 devices, 0 cutover
enrollments, 0 legacy operation rows**, one restrictive policy installed,
normal customers cannot self-enroll, and current owner clients retain their
legacy UPDATE grant until verified upgrade. No customer financial data or
workspace row was modified during deployment.

**Independent automated proof** (disposable PostgreSQL 17 and actual browser
source):

- [Stage 7 run 42785659785](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42785659785) — **SUCCESS**. Three independent PostgreSQL database fixtures plus the real
  client/source and 3-browser CAS acceptance; before opt-in the synthetic
  old app can write, after opt-in raw UPDATE returns zero rows, while the
  server-authorized CAS still succeeds. Cross-tenant writes, revoked device
  and concurrent stale financial edits remain denied.
- [Migration integrity 42785659695](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42785659695) — **SUCCESS**.
- The same Stage 7 CI now enforces real backup integrity and backup-import
  browser tests, plus strict persistent-signing preflight. No untrusted
  generated debug signer is accepted.

**Outstanding owner/device-dependent acceptance**:
Original private keystore material for both ONE and ADMIN is not available
through the GitHub tool. The last signed Android QA attempt
[42778428487](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778428487)
failed on missing owner secrets for **both** apps. The signing-key values must
be entered by the owner into GitHub Actions Secrets, matching the pinned
fingerprints in `signing/certificates.json`. A computer/phone with the old
installation and recoverable offline sales is also required for a true
in-place upgrade, reboot, and restore/no-data-loss acceptance. In addition,
client-generated device IDs cannot be represented as hardware-bound
cryptographic proof. The actual cutover to block legacy PATCH must remain
deferred until device credential hardening and signed physical upgrade tests.

**Verdict**: all tested Stage 7 **source and server changes** are in place,
and no customer workspaces were force migrated. This does not establish a
100% certified public Release or authorise unconditional Stage 8 progression
under the user's strict sequential rule. A final signed-device acceptance
is still required.


## Final verification after safe cutover gate (2026-11-10)

- **Primary database:** migration
  `stage7_progressive_legacy_write_cutover_no_enrollment` applied; read-back
  confirmed 6 workspaces, 60 device rows, **0 forced cutovers**, 0 existing
  legacy operations, 1 restrictive RLS policy. A signed-in customer has no
  permission to INSERT into the private cutover registry.
- **Isolated server test:** `scripts/test-stage7-progressive-cutover-postgres.sql`
  asserts that a mock pre-upgrade owner still has the original UPDATE ability,
  an enrolled owner's direct REST-style update is blocked, authorised new CAS
  remains functional, revoked-device writes fail and existing invoices survive.
- **Recovery tests:** actual browser backup integrity/import tests and safe
  keystore-preflight regression are now part of the Stage 7 CI.
- [Stage 7 regression 42785659785](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42785659785) **SUCCESS**;
  [migration integrity 42786064235](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42786064235)
  **SUCCESS** on the latest source.
- **Fresh Android QA signing check 42786064363**:
  [See actual run](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42786064363).
  ZAVI ONE and ZAVI ONE ADMIN both passed the added Stage 7 source+backup
  checks, then each **FAILED** on
  `Require persistent per-app QA certificate (no debug fallback)`.
  Both jobs reported all four effective signing fields unset. No signed APK
  was generated, and no replacement/debug certificate was used.

The signing material is private and intentionally not stored in GitHub source
or accessible through a public connector. The repository owner must put the
correct original certificate keystores and passwords into GitHub Actions
Secrets. A new random signing key would *not* provide an in-place update.

The newly installed opt-in RLS gate does not automatically stop a spoofed
owner JWT with a copied active device ID before a shop is enrolled. Achieving
that stronger claim requires tested cryptographic per-device possession,
authenticated session revocation checks, and a secure signed-upgrade rollout
before cutting off the old UPDATE path. A browser simulation or isolated
PostgreSQL test alone is not a genuine on-device acceptance.

**Result: Stage 7's additional production-safe source/database measures are
implemented and automated tests pass, but 100% hardware+original-signing
certification remains BLOCKED; do not mark the phase as fully accepted or
publish an APK without this acceptance.**
