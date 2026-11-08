# ZAVI ONE REBORN

Clean migration workspace for **ZAVI ONE** and **ZAVI ONE ADMIN**.

## Migration policy
- Source: `zavyanmasoom3-source/ZAVI-ONE-UNIFIED`, branch `migration/clean-foundation`.
- Never copy old APKs, Gradle build outputs, caches, or secrets.
- Migrate source modules with their dependencies; run checks before enabling them.
- Keep existing accounting data and Supabase schema unchanged until migration scripts are reviewed and tested.
- Preserve original repository as rollback reference until feature parity and production release tests pass.
- Each APK must have a unique build version and a traceable commit SHA.
- This repository is not production-ready until migration, build, and financial regression tests pass.

## Target layout
`apps/one`, `apps/admin`, `packages/shared`, `android-build`, `supabase/migrations`, `scripts`, `.github/workflows`.

## Status
Migration in progress. Do not distribute APKs as final releases.
