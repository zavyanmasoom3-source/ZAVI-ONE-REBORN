# ZAVI ONE REBORN

Rebuild workspace for **ZAVI ONE** and **ZAVI ONE ADMIN**.

> **Development / not production ready.** The original repository remains the rollback reference. No APK is approved for release yet.

## Structure

- `apps/one` — customer accounting app: sales, purchases, customers, cash, debts, warehouse, offline, printing and translations
- `apps/admin` — owner administration and subscription management
- `packages/shared` — shared language, database and access contracts
- `android-build` — Android Java WebView wrapper
- `supabase/migrations` — SQL under review; **not automatically executed on production**
- `scripts` — integrity and navigation checks
- `docs/REBORN_PDF_PARITY_AND_RELEASE_GATES.md` — PDF-to-feature acceptance matrix

## Development rules

1. One feature implementation per module; never duplicate a patched UI script just to ship a new APK.
2. Keep original business behavior until functional parity is demonstrated.
3. No APKs, build outputs, caches or signing secrets in Git (see `.gitignore`).
4. Every build has a unique versionCode, versionName, commit SHA and clean Gradle build.
5. Do not publish an APK if the integrity gate, accounting regression suite or device testing is incomplete.
6. Do not remove the old repository or mutate live Supabase records during migration.

## Checks

```bash
python3 scripts/check-migration-integrity.py
python3 scripts/verify-ui-navigation.py
```

Android QA workflow: `.github/workflows/build-reborn-qa.yml`. It creates **debug QA artifacts only**, not public releases. The migration gate must pass before build.

## Verified release status (2026-11-08)

- **QA source/migration CI passed** at dev commit `f0d2b4fea4a6` (run [42514711618](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42514711618)). This is not physical device or production acceptance.
- **Android signing is deliberately blocked:** run [42514711539](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42514711539) failed because the owner has not configured persistent per-app signing Secrets. Neither Android APK was built in that run.
- **Windows:** both ONE and ADMIN unsigned, separately isolated QA Installers built successfully in run [42520672724](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42520672724). No signed final Installer or on-device Windows acceptance has been certified.
- **PDF:** 59/59 pages are indexed in [the traceability matrix](docs/PDF_59_PAGE_TRACEABILITY.md). Browser automation opened and captured 59 mapped route/lock entrypoints in [run 42521443555](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42521443555); this is **not** 59/59 visual or functional parity.
- **Android isolated testing:** ONE and ADMIN compiled and passed independent v1 (API23) + v2/v3 signature checks in [run 42522170928](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42522170928). Their artifacts are TEST-NOT-FOR-RELEASE, have distinct testOnly packages and temporary signing identities and **must never be released or used as customer updates**. Persistent QA/production signing is still blocked by missing owner Secrets.
- **Sync, cheques, ADMIN security and upgrade:** cheque atomic settlement and ADMIN hard-delete retirement are deployed and source/isolated PostgreSQL tests passed (Stages 4–5); real owner/non-owner authenticated Android acceptance and on-device no-data-loss upgrade remain open. See [Stage 4](docs/PHASE4_CHEQUES_ATOMIC_SETTLEMENT_2026-11-10.md) and [Stage 5](docs/PHASE5_ADMIN_SECURITY_RECOVERABLE_ACCOUNTS_2026-11-10.md).
- **Owner signing setup:** [Step-by-step Dari guide](docs/PROTECTED_PRODUCTION_AND_OWNER_STEPS_DARI.md), including production Environment reviewers and dev Branch Protection. Never commit keystores or secrets. Original installed-app signer must match for a genuine in-place update.
- **Evidence:** [Root-cause report](docs/PHASE0_ROOT_CAUSE_AND_STAGE1_STATUS_2026-11-08.md); [full source inventory](docs/SOURCE_INVENTORY_DEV_2026-11-08.md).

## Stage 6 acceptance update (2026-11-10)

- All six jobs of [Stage 6 native/financial/visual acceptance](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778022511) passed on commit \`735431295\`: account/debt/FX/stock and three-device mock regressions, Light/Dark/Glass across three languages, **R8 unsigned Android compilation** for both apps and **Windows x64 WebView2 source compilation** for both apps.
- Both installable persistent-signed QA APK jobs were attempted in [run 42778428487](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42778428487) but stopped at the **missing owner signing Secrets preflight**. Neither produced a new signed APK; temporary/debug keystores were never substituted.
- [Complete Stage 6 report](docs/PHASE6_SOURCE_BUILD_AND_RELEASE_ACCEPTANCE_2026-11-10.md) includes the exact missing secret names, the release safety contract, and still-required real Android/Windows installation and owner-authenticated financial acceptance tests.

**Release gate: CLOSED — no APK or Installer is approved for public distribution.**
