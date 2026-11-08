# Phase 1 source parity — 2026-11-05

Source: zavyanmasoom3-source/Zavione, branch refactor/source-consolidation-no-apk-20261105, paths app-source/one and app-source/admin.
Destination: apps/one and apps/admin on ZAVI-ONE-UNIFIED/main.

Git tree SHA comparison before this record: 356 source blobs, 352 byte-identical at corresponding paths, 2 intentionally modified HTML integration entrypoints, and 2 missing non-code image assets.

## Deliberate exceptions (not copied)
- app-source/admin/icon.png -> apps/admin/icon.png (binary image)
- app-source/admin/z1-admin-official.jpg -> apps/admin/z1-admin-official.jpg (binary image)

These are **excluded from source-code parity accounting only**; they remain absent and may affect branding or visual presentation. Do not claim full asset parity.

## Entrypoints
Keep apps/one/index.html and apps/admin/index.html: destination versions add references to packages/shared/database/supabase-config.js, packages/shared/security/access-contract.js and packages/shared/i18n/language-core.js. Preserve these intentional changes.

## Phase 1 result
Missing in-scope logical/source-code files: 0. Phase 1 source-code transfer is closed with the two explicitly documented asset exceptions. Runtime correctness is not certified.

## Phase 2 acceptance gates
- Validate shared scripts load and are actually consumed (not just included).
- Test Dari/Pashto/English, direction switching, translated UI and invoices.
- Verify EU Supabase project, authentication, RLS/RPC, admin isolation, warehouse operations, and security advisors using non-destructive tests.
- Run builds and device/browser smoke tests before any production release.
