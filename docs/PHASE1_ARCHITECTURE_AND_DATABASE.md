# Phase 1 — source and database inventory (2026-11-05)

## Verified repositories
- Source: `zavyanmasoom3-source/Zavione` branch `refactor/source-consolidation-no-apk-20261105`
- Destination: `zavyanmasoom3-source/ZAVI-ONE-UNIFIED` branch `main` (private)
- Source inventory: `app-source/one/` 240 files (~5.28 MB); `app-source/admin/` 116 files (~3.55 MB); `android-build/` 95 files; `tests/` 20 files.
- Destination currently contains a **partial import** of entry points and selected features. It is NOT build-ready and must not be considered feature complete.

## Proposed monorepo layout
```text
apps/
  one/                  # all original app-source/one assets, unchanged first
  admin/                # all original app-source/admin assets, unchanged first
android-build/          # native WebView project, manifest, resources, Gradle
packages/
  shared/
    types/
    database/
    i18n/
    security/
supabase/
  legacy-staged/        # original SQL, preserved, NOT executable migrations
  migrations/           # only verified, ordered migrations after schema baseline
  contracts/            # RPC signatures, RLS, grants and realtime configuration
tests/
  source/
  browser/
  integration/
docs/
  source-manifest/
  feature-parity/
  database-read-only-audit.sql
```

## Observed database candidates (READ ONLY)
- Supabase project `wbbmwfnmurpphwxesssx` (eu-central-1): 22 public tables, all reported with RLS enabled. Includes `zavi_workspaces`, `zavi_subscriptions`, `zavi_v26_devices`, `zavi_v26_sync_operations`, `zavi_v269_offline_policies`, `zavi_v28_subscription_payments`, `zavi_warehouses` and `zavi_warehouse_movements`.
- Supabase project `hnjjtsdpgmdrgmcfbdzo` (ap-southeast-1): zero public tables returned.
- **The authoritative production project is not yet verified.** Do not run migrations or alter any production data.

## SQL inventory
Original SQL was copied to `supabase/legacy-staged/`, not `supabase/migrations/` because the scripts may already be applied and may depend on other existing tables/functions. The baseline migration must be derived from an authoritative schema export including table definitions, functions, triggers, indexes, grants, RLS policies and storage configuration. Only then can migration order and idempotence be validated on a disposable test database.

## Phase 1 exit conditions
- [ ] Import **every** original tracked file needed for ONE and ADMIN, with SHA/file-count comparison
- [ ] Inventory native Android resources, build dependencies, and all SQL files
- [ ] Identify authoritative Supabase project and extract schema/RPC/RLS baseline
- [ ] Verify missing/duplicate script references and feature mapping
- [ ] Create a reviewed migration plan; no untested production DDL
- [ ] Obtain user approval to proceed to Phase 2

No claims of 100% preservation or zero bugs until runtime and security verification.

## Verified cross-check — 2026-11-05
- Authoritative project confirmed by owner: `wbbmwfnmurpphwxesssx`.
- `app-source/one/cloud-config.js` and `app-source/one/index.html` contain the EU project URL; `app-source/admin/app.js` contains the same EU URL. Runtime local overrides still require testing.
- Read-only Supabase inspection found 22 public tables, all with RLS enabled, and the existing `zavi_admin_grant_trial_7days` RPC.
- Compared original legacy SQL names against the catalog: `zavi_admin_registration_contacts` exists; `zavi_v6547_account_contacts`, `private.zavi_admin_communications_log`, `zavi_admin_message_mark_v6595`, `zavi_admin_message_history_v6595`, `zavi_warehouse_no_negative_guard`, `zavi_warehouse_post_movement` were not found by the targeted query.
- Original staged scripts include DROP statements and CREATE OR REPLACE FUNCTION; **do not execute them as-is**. Safe migration must preserve existing signatures, grants, triggers, policies and dependencies.
- At inventory time the new repo still lacked 345 original ONE/ADMIN files (including binary assets). Migration and feature parity are **not complete**.
- No SQL DDL/DML executed against production.
