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
- **Windows:** a prior ZAVI ONE Windows QA Installer build succeeded, but is unsigned and not production ready. No signed ADMIN Windows Release has been certified.
- **PDF:** 59/59 pages are indexed in [the traceability matrix](docs/PDF_59_PAGE_TRACEABILITY.md), with significant incomplete/untested rows; this is not 59/59 approved screens.
- **Sync, cheques, ADMIN security and upgrade:** real authenticated multi-device tests, deployed atomic cheque clearing, owner/tenant authorization audit, and on-device no-data-loss upgrade remain open.
- **Owner signing setup:** [Step-by-step Dari guide](docs/OWNER_SIGNING_SECRETS_AND_SAFE_UPGRADE_DARI.md). Never commit keystores or secrets. Original installed-app signer must match for a genuine in-place update.
- **Evidence:** [Root-cause report](docs/PHASE0_ROOT_CAUSE_AND_STAGE1_STATUS_2026-11-08.md); [full source inventory](docs/SOURCE_INVENTORY_DEV_2026-11-08.md).

**Release gate: CLOSED — no APK or Installer is approved for public distribution.**
