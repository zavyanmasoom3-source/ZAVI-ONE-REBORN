# ZAVI ONE — Phase 2: native login, PIN recovery, Settings and Subscription

Verification date: 2026-11-09
Target branch: `dev`
Reference: owner-approved 12-sheet design, particularly sheet 11
Scope: ZAVI ONE Phase 2 only. ADMIN full redesign, device transfer, offline licensing workflows, financial screens and signed releases remain separate phases.

## Implemented in application source

- Actual private PIN entry: compact light/dark/glass form, offline Vazirmatn, three-language title/help/labels/validation, retain typed PIN during locale switch, original PBKDF2 hashing/attempt throttling and lock behavior kept.
- Password recovery: the original management-approval client flow is retained; responsive and contrast-aware modal, keyboard focus trap and return, Escape close, three-language labels, error notices, status and confirmation texts; no private PIN sent to server.
- Eight real Settings groups: existing live form nodes preserved rather than cloned, native search, live Dari/Pashto/English headings and labels, open/closed state preserved on language change.
- Appearance: exactly one visible native three-mode selector inside the Settings appearance group (duplicate legacy appearance controls hidden for compatibility), persisted light/dark/glass choices.
- Subscription: native live page uses themed readable cards, RTL/LTR and three-language plan/status/date/renewal labels; plan durations 7/180/365 days create **WhatsApp draft requests only**. Activation and write permissions still depend on the server and verified offline lease.
- Service worker cache identifier bumped after these source changes so installed clients request current assets. Financial tables and server schema were not modified.

## Automated tests — real browser, isolated data

- Actual ONE and ADMIN login screen and password-eye checks across three languages and light/dark/glass.
- Real PIN form text, change without clearing input, persistent theme after reload.
- PIN recovery: real UI handlers exercised using intercepted fake Supabase responses only. Verified unauthenticated form refusal, fake account login, store selection, request, pending, denied, approved and consumed one-time request. Local PIN is removed **only after** mock server approval and successful consumption. Verified the PIN was not transmitted.
- Settings: eight original collapsible groups, original controls preserved on locale changes, actual language-button clicks, persistence after re-opening and full PIN reload, only one visible appearance picker.
- Subscription: light/dark/glass computed cards, three language headings, RTL/LTR, 7/180/365-day renewal request links, and original refresh/offline controls retained.
- Existing navigation, accounting invariants, warehouse, backup, barcode, sync and 59 mapped-route checks stayed green on the last verified code commit.

Latest verified CI run IDs:
- 42660918625 — REBORN PDF visual QA screenshots: success
- 42660918797 — Migration integrity gate: success
- 42660918765 — ZAVI transit contract checks: success

## Production database metadata audit — read-only

The Supabase project URL used by `apps/one/cloud-config.js` was matched to a connected project. Read-only system-catalog queries confirmed:
- `zavi_my_entitlement`, `zavi_pin_reset_request`, `zavi_pin_reset_status`, `zavi_pin_reset_consume` exist.
- These functions require authenticated execution, not anonymous execution; the reset functions contain `auth.uid()` and owner-scoping conditions.
- The consume function checks approved status and nonexpired timestamp.
- The private reset-request table has no direct SELECT/UPDATE grant to `authenticated` and is inaccessible to `anon`.
- Public workspace/subscription/member tables have RLS enabled.
No user/customer table data was queried; no mutation, migration or permission change was performed.
This is an audit of metadata and source, **not an authenticated end-to-end authorization or penetration test**.

## Hard limits / what has not been certified

- Production owner/staff account sign-in, the **real** admin approval and consume RPC under distinct authorized and unauthorized user accounts have not been exercised end-to-end.
- Physical Android devices and biometric hardware, accessibility certification, screenshot pixel-by-pixel equivalence and release signing/installation are not certified here.
- No APK/Installer was built as part of Phase 2. Phase 2 is implementation-complete and passes the available automated browser/integrity gates; do **not** advertise a release as final based on this report alone.
- Device-transfer/offline-license workflow belongs to Phase 3 and has **not** been started here.
