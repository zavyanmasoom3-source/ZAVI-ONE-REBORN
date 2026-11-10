# Stage 5 — ZAVI ONE ADMIN server authorization, recoverable customer deletion

Date: 2026-11-10. Repository \`ZAVI-ONE-REBORN\`, branch \`dev\`.
**Status: source and production database hardening deployed; isolated PostgreSQL,
UI-handler and anonymous live-API tests passing. Real owner/expired-device
acceptance and Release APK certification remain unverified.**

## Scope and safety promise

Central ADMIN remains restricted to the owner. Never ship a service-role or
secret API key to the Android app. Every sensitive action must be authorized
on the **server**, not merely by hiding a button. Customer archive/unarchive
must preserve the workspace, product stock, accounts, invoices, documents,
devices and billing history and produce an immutable management event.
No account may be permanently deleted via exposed customer-management paths.

## Root causes verified directly against actual primary Supabase

1. \`public.zavi_owner_delete_customer(uuid,text)\` was a SECURITY DEFINER RPC
   that recursively deleted customer rows and the owning workspace.
2. \`public.zavi_owner_reset_customer_accounts(boolean,text)\` could invoke
   that destructive function from another SECURITY DEFINER context.
   Simple client-side hiding or REVOKE of a function would not close both paths.
3. Legacy \`public.zavi_admin_v24_archive(uuid,boolean,text)\` checked central
   billing-admin membership but did not explicitly protect the central
   owner's workspace or require the explicit \`owner\` role; repeated calls
   appended duplicate audit entries.
4. Older ADMIN controls still presented irreversible deletion, while a newer
   overlay intercepted those controls to perform recoverable trash. The
   fallback click handler remained dangerous if the overlay failed to load.
5. Bulk-archive success validation accepted boolean \`false\` as numeric zero.

## Applied corrections

**Server production migrations** (applied via Supabase migration service,
definitions re-read after installation):

- \`supabase/migrations/20261110_stage5_retire_permanent_customer_deletion.sql\`
  Retains the old RPC signatures but replaces hard-delete bodies with
  fail-closed SQLSTATE 42501. The direct permanent-delete RPC is no longer
  executable by anon/authenticated, and the batch reset RPC can **only
  preview** the customer count for a privileged central owner, never purge.
- \`supabase/migrations/20261110_stage5_owner_only_recoverable_archive_rpc.sql\`
  Ensures \`auth.uid()\` has both billing-admin membership and the explicit
  central \`owner\` role. Rejects archiving the owner's own workspace. Locks
  the workspace, uses existing archive tables, and appends exactly one audit
  event per actual state transition; retrying a completed action is idempotent.
  It never deletes financial rows.
- Existing \`zavi_admin_trash_customer\`,
  \`zavi_admin_restore_trash_customer\`, and
  \`zavi_admin_trash_all_customer_accounts\` remain installed. Existing
  \`private.zavi_subscription_is_active\` already treats archived accounts
  as inactive for ledger writes.

**Real ADMIN client**:

- \`apps/admin/account-control.js\`: removed the permanent-delete button and
  handler; requires an independently verified central owner, a first user
  confirmation and exact typed store name for recoverable trash. Restore
  requires an owner session, server confirmation and a refreshed catalog.
- \`apps/admin/app.js\`: converted the old bulk-delete card and handler to
  a recoverable bulk archive, with preview, two confirmations and strict
  **numeric** server-result validation. Financial-report period reset was
  preserved and remains separate from customer management.
- \`apps/admin/zavi-admin-recovery-v141.js\`: the existing compatibility
  overlay now requires a server preview, an exact typed confirmation phrase
  and a non-boolean integer result before reporting bulk archive success.
  Its legacy intercept never invokes a hard-delete RPC.

**Regression/QA**:

- \`scripts/test-stage5-admin-hard-delete-postgres.sql\`: disposable PG17
  fixture creates a deliberately dangerous legacy function and proves the
  migration blocks direct and nested SECURITY DEFINER deletion, normal and
  no-token users, while preserving customer invoices and audit.
- \`scripts/test-stage5-admin-archive-postgres.sql\`: verifies main-owner
  protection, delegated billing admin rejection, outsider/no-token rejection,
  exact two audit records for trash+restore with retries, and unchanged
  customer financial rows.
- \`scripts/test-stage5-admin-client-guard.cjs\` executes the **actual**
  Account Control click handler with simulated server requests and verifies
  two owner confirmations, no accidental success, and live restore path.
- \`scripts/test-stage5-admin-bulk-preview.cjs\` exercises the **actual**
  compatibility bulk handler with offline/demo, missing preview, user cancel,
  incorrect typed phrase, boolean false server ACK and valid numeric result.
- \`.github/workflows/stage5-admin-security.yml\` executes these source/UI
  and PG17 regressions without customer tokens or production data.
- \`scripts/test-admin-rpc-authorization.py\` now checks 11 **read-only**
  management RPC endpoints against the real primary Data API with no user
  token and a publishable key; it never prints a returned customer payload.

## Direct server read-back and data preservation

Immediately after the first migration and again after the second:
- Existing workspaces: **6**.
- Customer archive entries: **1**.
- Customer management audit events: **2**.
- Historical deletion log entries: **10** (historical facts, **not**
  restorable backups; no entries were added or removed).
- Both old permanent-delete bodies are disabled; the ordinary authenticated
  role has **no** direct EXECUTE on the single-customer hard-delete RPC.
- The owner-only archive RPC carries explicit \`MAIN_OWNER_WORKSPACE_PROTECTED\`
  and \`owner\` role guards, and anon cannot execute it.
- No customer invoice, payment, stock, device or workspace record was modified
  by these schema-only migrations.

## Real authorization evidence boundaries

The catalog shows zero anon EXECUTE grants among the reviewed
\`zavi_admin_*\` and \`zavi_owner_*\` functions; the exposed SECURITY DEFINER
RPC bodies under review have a pinned search path and a billing/admin role
guard. The user-facing API smoke suite verifies only **anonymous denials**
for eleven read-only calls. Catalog SQL and synthetic JWT claims are **not**
a substitute for real authenticated user, revoked-token and cross-tenant HTTP
tests.

A security advisor may flag ADMIN SECURITY DEFINER routines because they
are executable by \`authenticated\`. This is only safe when every function
checks the real privileged role and workspace IDs before reading or mutating
records. Continue reviewing individual inputs, argument boundaries and
called helper functions rather than ignoring such notices. Separately, the
project's Supabase Auth leaked-password protection setting is reported as a
warning and is not changed by these migrations.

## Release blockers / actual remaining acceptance

1. Use a dedicated disposable owner and non-owner test account to prove real
   signed-in HTTP: owner trash/restore, unauthorised user rejection,
   expired customer rejection, unrelated workspace rejection, recovery and
   management audit entries. Do not test mutations on real customer accounts.
2. Verify a revoked/stale access token can no longer perform administrative
   mutations after any remaining authorization state change; investigate
   session_id validation if strict immediate revocation is required.
3. Check ADMIN screen, account-control, recycle bin and bulk confirmation
   in a compiled Android APK on actual mobile hardware; also prove upgrading
   does not erase an active owner session or local data.
4. Complete review of remaining highly privileged management RPC inputs
   and third-party administration workflows and confirm logs redact data.
5. Final Release signing and versioned APK/Windows Installer are handled in
   their corresponding release stages. This stage makes **no** stable APK claim.

**Conclusion:** Stage 5 critical hard-delete vulnerability is closed in
source and production; real authenticated tenant tests and Android physical
acceptance are still required before 100% release certification.


## Final ADMIN JavaScript regression sweep — 2026-11-10

A direct review of all 46 JavaScript files under \`apps/admin\` found no
executable invocation of the old \`zavi_owner_delete_customer\` RPC or
\`p_preview:false\` permanent bulk purge. Remaining literal
\`permanent-delete\` selectors in \`zavi-admin-recovery-v141.js\` are
compatibility interceptors that route legacy UI clicks to recoverable trash;
some older i18n dictionaries retain historical translation source keys,
but these are not invoked as customer deletion actions. No blanket string
replacement was attempted because that could break dictionary mapping.

Added \`scripts/test-stage5-admin-no-hard-delete-paths.cjs\` and wired it
into \`.github/workflows/stage5-admin-security.yml\`, so any future
executable irreversible deletion route blocks the CI gate.

GitHub Actions run
[42776802207](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42776802207):
**SUCCESS** — every step including full ADMIN script scan, the real click
handlers, nested SECURITY DEFINER hard-delete prevention and PostgreSQL 17
owner/nonowner/archive/recovery assertions.

The primary Supabase read-only catalog audit examined **42 management RPCs**:
**0** callable by anonymous role; **0** authenticated SECURITY DEFINER
routines missing the inspected admin-role or pinned search-path signatures.
These catalog heuristics do not prove that every nested helper implements
correct row-level authorization. No normal signed-in user may UPDATE the
private archive table or INSERT management audit records directly.

Outstanding **release-only** gates: genuine user JWTs in isolated tenant
tests, revoked-session scenario and physical Android install/upgrade on
both apps. No stable release APK claim.
