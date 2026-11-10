# ZAVI ONE / ADMIN — Phase 6: final source acceptance, native compilation and signing gate

Date: 2026-11-10. Branch: `dev`. Target Android 8 (API 26)–16 (API 36).
**Current status: functional/source and unsigned native compilation gates PASSED;
persistent-signed installable QA APKs BLOCKED by missing owner GitHub Actions
Secrets. No physical/mobile Release certification.**

## Stage boundaries

This phase verifies:
- ZAVI ONE accounting invariants: sales, purchases, refunds/returns,
  discount, opening debt, cashbox, supplier/customer balances, FX,
  transfers/fees, cheque arithmetic and stock.
- Backend safety in disposable tests: three independent Chrome instances
  exercise the real source cloud CAS, dropped ACK, concurrency and conflict
  preservation without touching production customer records.
- ADMIN management: owner-only recoverable trash, double-confirmation,
  rejected permanent deletion, no false positive acknowledgement.
- All nine combinations of Light/Dark/Glass and Dari/Pashto/English with
  financial state preservation; real DOM controls and reference theme tests.
- Android source compilation with R8 and resource shrinking for ONE and
  ADMIN, independent Windows WebView2/x64 compilation, fresh commit and
  version stamps, complete packaged shared assets.

## Actual working changes in `dev`

1. `scripts/stage6-stage-android-compile.py` prepares each app's actual
   WebView assets and shared modules, verifies its per-build SHA/run identity,
   and generates required native resources. It does NOT touch original app
   assets or create a signed/installable APK.
2. `scripts/test-stage6-package-provenance.py` verifies both staged variants,
   theme CSS, commit identity, source preservation and missing/invalid run
   rejection using temporary directories.
3. `scripts/test-stage6-financial-theme-browser.py` exercises real accounting
   code in disposable browser state and proves that moving across 7 routes
   and 9 appearance/locales does not change cash, bank, stock, customer debt,
   sales, profit or transaction count.
4. `scripts/test-stage6-release-contracts.cjs` fails for missing Android
   26/36 target, R8, package identities, persistent signing guards,
   version pinning, app isolation or accidental unsigned artifact upload.
5. `.github/workflows/stage6-release-readiness.yml` runs SIX jobs:
   finance+admin, three-language UI, R8 Android ONE, R8 Android ADMIN,
   Windows x64 ONE, Windows x64 ADMIN. Native Release compilation outputs
   remain unsigned and are intentionally **not uploaded**; Windows source
   host compiles but no installer is distributed.
6. `.github/workflows/build-reborn-qa.yml`: stage 6 accounting/UI/admin
   acceptance is now mandatory before a signed QA build. The existing
   per-app persistent signing certificate check runs **before** SDK/Gradle
   downloads to fail early and never substitute a generated debug keystore.

## Verified CI evidence

- Stage 6 native and financial acceptance run:
  [42778022511](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778022511),
  commit `73543129513fc42677f64263a02b375bb70c5dea`:
  **SUCCESS 6/6 jobs**.
  Both Android variants compiled with R8 + shrinkResources; the job
  verified *unsigned* APK provenance and proved that the noninstallable
  output carried no APK signature. Both Windows x64 WebView2 hosts built
  with correct edition-specific source. All financial, ADMIN, visual and
  three-device mock tests passed.
- A later change only to the signed-QA build workflow on
  `2dd51e921cc8d799ff091eab9732d41c2c95b539` passed
  [Migration integrity gate 42778428517](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778428517).
- Persistent-signed Android QA build attempt:
  [42778428487](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778428487),
  commit `2dd51e921cc8d799ff091eab9732d41c2c95b539`:
  **FAIL for BOTH ONE and ADMIN solely at
  'Require persistent per-app QA certificate (no debug fallback)'**.
  Runner environment for both reported *all four effective per-app
  signing inputs absent*. No signed QA APK was produced and no unsigned
  release artifact was published. This is not a Gradle/R8 compilation
  failure. Do not relabel the old APKs.

## Missing protected signing material: exact workflow inputs

The workflow accepts either of two naming conventions in **GitHub repository
Actions Secrets** (not in source, not pasted into a chat):

| App | Secret fields (primary; alternatives accepted) |
| --- | --- |
| ZAVI ONE | `ZAVI_KEYSTORE_BASE64` / `ZAVI_ONE_KEYSTORE_BASE64`; `ZAVI_KEYSTORE_PASSWORD` / `ZAVI_ONE_STORE_PASSWORD`; `ZAVI_KEY_ALIAS` / `ZAVI_ONE_KEY_ALIAS`; `ZAVI_KEY_PASSWORD` / `ZAVI_ONE_KEY_PASSWORD` |
| ZAVI ONE ADMIN | `ADMIN_KEYSTORE_BASE64` / `ZAVI_ADMIN_KEYSTORE_BASE64`; `ADMIN_KEYSTORE_PASSWORD` / `ZAVI_ADMIN_STORE_PASSWORD`; `ADMIN_KEY_ALIAS` / `ZAVI_ADMIN_KEY_ALIAS`; `ADMIN_KEY_PASSWORD` / `ZAVI_ADMIN_KEY_PASSWORD` |

The stored certificate fingerprints must match `signing/certificates.json`.
**An arbitrary new key cannot update a previously installed app**, and
`.rebornqa` is a side-by-side package, not an update of legacy package IDs.
Production upgrade is gated on the *actual original signing certificate*
or a tested offline backup/export plus secure import into a fresh install.

## Still required before 100% physical Release certification

- Owner-controlled stable signing material provided via **GitHub Actions
  Secrets**, two signed QA builds for each application, cert/v1/v2/v3/identity
  comparison and monotonically increasing versionCode.
- Actual API 26–36 Android install/update tests, including preserved offline
  financial drafts, camera barcode, biometric/keyboard, native printing,
  PDF/WhatsApp sharing, orientation, background restart and low-memory kill.
- Real authenticated disposable tenants on Supabase for offline lease,
  revived/revoked device, cheque posting, ADMIN owner/non-owner RLS and
  cross-tenant write prevention. Mock server tests do not certify these.
- PDF 59-page visual comparison and WCAG acceptance on target displays;
  current automated tests verify behavioral layouts and token contrast, not
  literal pixel-to-pixel equivalence with the PDFs.
- Windows signed installer and actual installation/upgrade tests. Current
  Windows native compile is proven but signed installer release is unverified.

**Release verdict: BLOCKED.** Source stage 6 automated CI is green, but
persistent signed, fully functional customer-ready APKs and Windows installers
do not exist from this latest run. Keep old customer installations and original
financial data unchanged; do not distribute incomplete debug/unsigned packages.
