# ZAVI ONE REBORN — Stage 8, ADMIN integration and end-to-end source acceptance

Date: 2026-11-10. Repository: `zavyanmasoom3-source/ZAVI-ONE-REBORN`, branch `dev`.
The owner explicitly deferred final APK signing and physical release installation to
the last stage (9). Stage 8 tests are **source, real-browser, isolated PostgreSQL,
unsigned Android R8 and Windows native compiler validation**. They are not a
signed APK/Windows Installer or a claim of pixel-perfect PDF parity.

## Root cause found and fixed

In actual `apps/admin/app.js`, successful ADMIN login, saved-session resume,
management permissions and password change previously depended on an old
**hardcoded email address**, rather than the UID + central admin roles.
Likewise `apps/admin/account-control.js` checked returned email to grant
access to the customer recycle-bin and recovery tools. This made a valid
owner account with an updated email unable to enter and made the UI gate
inconsistent with server authorization.

The fix replaces those checks with a **read-only live Supabase RPC**:

- `supabase/migrations/20261110_stage8_admin_owner_live_session.sql`
  installs `public.zavi_stage8_admin_owner_session()`.
- The function verifies authenticated non-anonymous JWT claims, parses
  `session_id`, checks that exact session in `auth.sessions` still exists,
  matches `auth.uid()` and is not expired, and requires BOTH
  `private.zavi_billing_admins` membership and explicit
  `private.zavi_admin_roles.role='owner'`. It returns boolean and never
  changes any customer, finance or Auth data. Anonymous callers cannot
  execute it.
- `apps/admin/app.js` invokes it **before loading customer rows**, when
  logging in, restoring sessions, and changing the owner's password.
  Declined/revoked access hides the ADMIN view, clears loaded customer
  rows and discards stored session on an explicit denial. A transient
  network problem is not treated as a destructive account reset.
- `apps/admin/account-control.js` checks the same server owner role
  before listing customer accounts, and again on each sensitive action.
  The previous Stage 5 recoverable trash / restore behavior remains intact.

## Actual production deployment and read-back

Applied named migration `stage8_admin_owner_live_auth_session_gate`
successfully to primary Supabase. Re-read actual installed function source,
role grants and data counts:
- owner-role and billing-admin checks installed;
- verified live `auth.sessions` lookup, matching JWT session ID and user;
- `anon` EXECUTE false, authenticated EXECUTE true (internal role guards
  still mandatory);
- **6** original workspaces, **1** archived workspace record and **2**
  management audit events unchanged. No customer ledger, account balance,
  invoice, device or subscription row was modified by deployment.

## Real application UI and navigation

- `apps/admin/account-control.js` respects the owner's three
  Light/Dark/Glass themes (clear light background, dark and genuinely
  blurred translucent glass cards) and the page's RTL/LTR direction.
  It does not alter any accounting or billing function.
- `apps/admin/index.html` busts old cached login and account-control JS
  query strings; `apps/admin/sw.js` rotates offline cache with the
  original `zavi-admin-design-tokens-unified` namespace, keeping
  older design-token cache integrity checks green.
- `scripts/test-stage8-real-navigation-clicks-browser.py` clicks the
  **real** ONE five-item bottom bar across 3 themes x 3 locales (45
  interactions, including opening/closing approved "All sections" overlay).
  It clicks 11 **real ADMIN sidebar pages** across 3 themes
  (33 more interactions). This is NOT equivalent to completing
  purchases, printing, receiving real bank payments or pixel-by-pixel
  comparison with five PDFs.
- `scripts/test-stage8-admin-account-appearance-browser.py` measures
  the computed theme and RTL/LTR CSS on actual ADMIN elements in
  9 combinations, using a synthetic account label and no live customers.

## Automated evidence and CI

- `scripts/test-stage8-admin-owner-session-postgres.sql` installs the
  actual migration on disposable PG17 and verifies owner whose email
  changed, delegated billing agent denial, unrelated account denial,
  stolen other-user session rejection, malformed/anonymous claim,
  expired and revoked sessions, and preservation of the synthetic invoice.
- `scripts/test-stage8-admin-owner-browser.py` loads the actual ADMIN
  JS/HTML in disposable Chromium with mocked Supabase HTTP, testing
  changed-owner email login, client revocation that closes the data view,
  outsider denial *before* customer RPC, and refresh-token resume after
  page reload. No real credentials or production changes.
- `scripts/test-stage8-admin-source.cjs` forbids hardcoded ADMIN
  owner email and requires the owner RPC before customer reads.
- The final Stage 8 suite also runs source-level barcode label encoding,
  WhatsApp message templates, staged international order/receipt handling,
  and primary-device activation, plus an actual purchases-in-transit browser
  test. These are **synthetic regressions only**, not camera, print, file
  sharing or live financial acceptance on real hardware.
- `.github/workflows/stage8-admin-end-to-end.yml` provides two
  mandatory jobs for real browser owner+role verification and
  real DOM navigation, themes, offline accounting and backups.
- `.github/workflows/stage6-release-readiness.yml` now triggers both
  independent native builds when `apps/one`, `apps/admin` or shared
  code changes, fixing a gap where previously only wrapper changes
  recompiled Android/Windows and "green CI" could reflect an old APK.
- On approved changed source the native gate checks **Android ONE and
  ADMIN R8 unsigned compilation**, **Windows ONE and ADMIN x64
  WebView2 compilation**, full finance and theme regressions.
  It **does not distribute unsigned APKs or a Windows installer**.

GitHub evidence:
- [Stage 8 owner/auth/UI acceptance — run 42790495759](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42790495759)
  **2/2 jobs SUCCESS**.
- [Stage 8 expanded regression — run 42790947976](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42790947976)
  **2/2 jobs SUCCESS**, including barcode, WhatsApp, in-transit orders,
  device activation and account/session rejection tests.
- [Full migration integrity — run 42790495584](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42790495584)
  **SUCCESS**.
- [Stage 6 complete native/finance build — run 42789826704](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42789826704)
  **6/6 jobs SUCCESS** on the same updated ADMIN and ONE code base
  before the final UI-test-only changes.
- [Real 59-PDF-mapped route screenshot QA — run 42789826760](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42789826760)
  **SUCCESS**. It covers 59 *route screenshots*, not pixel-perfect
  parity, financial transactions or real physical printing.

## Remaining for final Stage 9 (owner explicitly deferred)

- Original per-app owner signing Keystore Secrets are still missing
  in GitHub Actions. Do not replace them with untrusted temporary keys
  or rebrand an old APK. Compare SHA-256 certificate fingerprints,
  package ID, monotonic versionCode and exact build commit.
- Real Android 8–16 on-device install/update/backup recovery, biometric,
  camera barcode, thermal print, share sheet/PDF/WhatsApp and offline
  invoice persistence, plus real Windows signed installer upgrade.
- Isolated **real** Supabase owner/nonowner sessions and cross-tenant,
  expired and revoked-device acceptance tests (beyond the current
  PG17 and local-browser mock).
- The 59-page reference screenshots and 21 feature flows are not yet
  verified pixel-for-pixel or end-to-end against the original PDFs.
- Stage 7 per-workspace opt-in legacy PATCH shutdown and hardware-bound
  possession are deliberately not forced until original-signed
  backward-compatible upgrades have been proven not to lose sales.

**Status:** Stage 8 source/DB/automated UI integration delivered and
tested. A production/release-ready declaration is intentionally deferred
to Stage 9's genuine owner-signed physical tests.
