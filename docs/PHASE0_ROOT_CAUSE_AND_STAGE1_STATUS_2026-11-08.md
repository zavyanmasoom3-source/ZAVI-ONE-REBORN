# ZAVI ONE REBORN — Phase 0 root-cause evidence (2026-11-08)

**Scope:** Read-only audit of authoritative GitHub `zavyanmasoom3-source/ZAVI-ONE-REBORN` branch `dev`, the five user-provided PDF design references, and catalog-only Supabase queries against project `wbbmwfnmurpphwxesssx`. No customer data, signing private key, or database row was changed.

**Source inventory:** [All tracked files, paths, byte sizes and blob SHAs](SOURCE_INVENTORY_DEV_2026-11-08.md). The inventory proves presence, not completed line-by-line code review.

## Runtime architecture / ownership
- `apps/one/`: browser/WebView accounting frontend, cache/service worker, offline license, local persistence and cloud workspace interactions, invoices, i18n and UI.
- `apps/admin/`: browser/WebView owner administration, RPC-backed account and subscription controls, recovery/trash UI, i18n.
- `packages/shared/`: accounting cheque contract, database/public config, security/access contract, language modules.
- `android-build/`, root Gradle and `gradle/wrapper/`: single native Java WebView project, variant controlled by `-PzaviApp=one|admin`.
- `desktop/windows/`: .NET 8 WebView2 Windows host and Inno Setup installer.
- `supabase/`: reviewed/draft migrations and preserved legacy staged SQL; **not proof that checked-in migrations have been deployed**.
- `.github/workflows/`: QA Android, QA Windows installer, signing preflight and source/regression gates.

## Issues and evidence

| # | Problem | Verified current condition / root of blockage | Required evidence to close |
|---|---|---|---|
| 1 | Stable signing and in-place upgrade | `android-build/app/build.gradle` configures stable per-app signing and v1/v2/v3; QA builds use `.rebornqa` package IDs. `signing/certificates.json` pins two **new** signing SHA-256 certificates; ZAVI ONE original installed 66.75 certificate has SHA-256 `f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25`, distinct from the new one. Latest Android run (42511321047 and 42512558832) fails at persistent-key preflight before APK assembly; build or upgrade remains unproven. | Owner supplies original matching signing key for same-package upgrade, **or** follows independently tested backup-restore migration for new identity; configure secrets securely, produce two consecutively signed APKs, run `scripts/verify-apk-pair.py` and real Android `adb install -r` retention test. |
| 2 | Reference design 59 pages | Five source PDFs have 11,12,12,12,12 = 59 pages; pages are scanned images, without extractable text. `docs/PDF_59_PAGE_TRACEABILITY.md` indexes 59/59 requirements, but describes numerous gaps and unverified device/financial behaviors. | Per-page screenshots compared with the matching running screen, with acceptance proof for every requirement; do not infer 59 passing UI screens from the row count. |
| 3 | Offline and three-device sync | `apps/one/cloud.js` handles revision/CAS workspace behavior; `scripts/test-cloud-three-device-browser.py` exercises three disposable browser profiles and a mock server. This is **not a live multi-tenant authenticated device run**. Remote `public.zavi_v26_sync_operations` exists but zero rows were reported; that row count does not prove a full crash-safe outbox. | Deterministic 3-device offline queue tests, live disposable workspace CAS/reconciliation, dropped ACK, device clock skew, delete/edit conflict and durable restart. Prove preserved unsent records and offline entitlements before release. |
| 4 | Cheque clearing and journals | Live `zavi_cheques` has a constraint `zavi_cheque_initial_pending` requiring `status='pending'`, `cleared_at IS NULL` and `linked_transaction_id IS NULL`. Pure JS cheque arithmetic tests exist, but the atomic server clearing/ledger RPC is not deployed (per `docs/cheque-live-migration-status-20261105.md`). | Safe backup and rollback, reviewed atomic tenant-authorized cheque state machine, balanced journal entries, real RPC and idempotency integration tests. |
| 5 | ADMIN security and customer deletion | RLS is enabled on 29 inspected public tables but **RLS enabled does not prove each RPC is secure**. Catalog counts 91 public `SECURITY DEFINER` functions, each requiring review of execute permissions and in-function tenant/owner checks. RPC names include `zavi_admin_v24_archive`, `zavi_admin_restore_trash_customer`, `zavi_owner_delete_customer`. Isolated browser deletion tests prove UI confirmation logic only; backend permission and audit behavior remains unverified. | Test with owner, unauthorized member, expired user, foreign tenant and no token for each sensitive RPC. Soft delete + audit + restore must be verified on disposable records. |
| 6 | Physical Android QA | There is no confirmed current installable Android APK because signing preflight rejects missing credentials. `scripts/test-android-upgrade-on-device.py` exists but was not run. | Android 8–16 install/update and private data survival, login, RTL, dual date, offline/sync, printer/WhatsApp, camera, biometrics, rotation, keyboard, back button, low memory. |
| old-A | Historical customer deletion | App frontend exposes archive/restore and a separately labeled permanent-delete control; it is not proof of server-side soft delete and verified restoration for all paths. | Explicitly verify exact action, audit, restore and denial paths before allowing an irreversible delete. |
| old-B | Cloud user works offline after activation | `apps/one/offline-app-shell.js` checks **both** cached shell readiness and separate device lease entitlement; this is an intentional security gate. Actual automatic license grant and reconnection persistence after initial online activation are **not fully proven**. | Device test with initial activation, offline business operations, lease expiry/revalidation, reconnect and conflict-free reconciliation. |

## Verified tests and explicit limits
- The workflow `Migration integrity gate` passed at source commit `c1abc911`, run [42512581994](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42512581994); it is source/browser regression, not physical Android release acceptance.
- New `scripts/test-verify-apk-pair.py` passed nine isolated locally executed cases (success/different signer/version downgrade/package mismatch/release key/v3). They **mock metadata**, not real APK certificates.
- An earlier Windows QA packaging workflow passed at a different commit: run [42511473520](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42511473520). Not evidence for a current signed production installer.
- No credentials, private signing keys, database records, or customer data were modified.

## Stage 1 work completed
- `scripts/verify-apk-pair.py`: compare two actual APKs using `aapt` and `apksigner`; fail closed on package identity, SHA-256 signer, v1/v2/v3 and `versionCode`. Clearly reports that device data retention was not tested.
- `scripts/test-verify-apk-pair.py`: nine isolated negative/positive vectors.
- `.github/workflows/migration-integrity.yml`: execute these vectors on push/PR.
- **Do not proceed to describe Stage 1 as completed** until protected original signing material and successful two-build+device evidence exist.

## Safe next command after owner sets matching protected secrets
```bash
python3 scripts/verify-apk-pair.py --app one --mode qa \
  --previous-apk /private/QA_ONE_old.apk \
  --current-apk /private/QA_ONE_new.apk \
  --expected-sha256 7e68bc0c0525785de756acc56a72c25fc171f1b01dd579e7a9b343133b29757c
```
Use corresponding ADMIN certificate, `--app admin`, and correct package. This command proves APK metadata continuity only; `scripts/test-android-upgrade-on-device.py` is needed for QA data-preservation smoke testing.

**Disposition:** QA evidence only. Not production ready. Do not delete original installations or pronounce project closed.
