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

## Status

- Main and admin source assets imported; legacy QA snapshots and superseded settings scripts excluded.
- First responsive three-theme design foundation applied in both apps.
- PDF feature parity and full accounting tests remain outstanding.
- GitHub Actions currently has no successful run; inspect the Actions job execution before trusting any APK.
