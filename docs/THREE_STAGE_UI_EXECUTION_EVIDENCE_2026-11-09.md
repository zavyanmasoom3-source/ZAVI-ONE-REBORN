# ZAVI ONE + ZAVI ONE ADMIN — three-stage redesign execution status
Date: 2026-11-09 | Repository: `zavyanmasoom3-source/ZAVI-ONE-REBORN` | Branch: `dev`

> **NOT COMPLETE / NOT RELEASE-READY.** Evidence below is of the named patches and automated checks, not certification of 12/12 screenshot visual fidelity or all financial workflows. Production Supabase data, credentials, licensing state and signed Release APKs were not touched.

## Stage 1 — Traceability + shared design

- Created [12-image specification → existing source/real routes table](UI_12_REFERENCE_TRACEABILITY_2026-11-09.md). The visual pixel reference images are not available for automated direct pixel-diff in this source audit.
- Existing authoritative `packages/shared/ui/design-system-v1.css` was confirmed loaded by both apps; 3 palette modes `light`, `dark`, `glass`, token radius, spacing, semantic statuses, responsive controls, input validation and RTL/LTR are retained.
- Extended loaded `packages/shared/ui/design-system-v1.js` with **real caller-owned** `uiSelect`, `uiSwitch` and `uiTabs` (click + directional keyboard navigation, no mock business handlers). Commit `d80d907863aeccfec8641acbd5f223f0902e1774`.
- Extended actual Chromium DOM test of these controls, commit `edbb1755b1908e30e39b19698f941ad99d044720`; [Visual QA run 42631195554](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42631195554) **success**, [migration run 42631195678](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42631195678) **success**.
- Bundled *unmodified variable* Vazirmatn TTF locally under `packages/shared/ui/fonts/Vazirmatn-Variable.ttf`, plus copyright/OFL license `fonts/OFL.txt`. Font source `google/fonts/ofl/vazirmatn`, SIL OFL v1.1.
- Confirmed the TTF Unicode cmap contains glyph mappings for **ګ ډ ټ ړ ږ ښ ڼ ې ۍ**. Both apps reference the local `@font-face` and both service workers precache the same binary font for offline PWA use. Commit `033182c8aea64097031a7f9c61cabf99eb5340a2`.
- Added read-only `scripts/test-local-vazirmatn.cjs` (binary existence, OFL, cmap, font CSS, offline caches and disallow network-font HTML refs) and wired it into migration & visual workflows. CI for the final workflow change: [migration 42632482076](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42632482076) **success**, [visual 42632482191](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42632482191) **success**.

## Stage 2 — Remove old visuals, preserve active functionality

- The source still carries substantial historical CSS. Current HTML inventory before first retirement: **ONE 89 stylesheet links + 13 inline style elements; ADMIN 43 stylesheet links + 1 inline style element.** This is direct entrypoint evidence and *not* proof every old file is removable.
- First dependency-safe retirement: `apps/admin/zavi-graphic-refresh.css` (presentation-only legacy rules) **physically deleted** in `23c549a299c583229276111a2eb22b7430da8667`.
- Same atomic commit removed that file's imports in `apps/admin/index.html` and `apps/admin/sw.js`, and updated `scripts/check-reference-runtime-css.py` / `scripts/audit-retired-ui-assets.py` to prohibit regression.
- Read-back: deleted file returns NOT_FOUND; old name does not occur in active ADMIN HTML or service worker. The audit script intentionally lists the retired name in its deny-list, which is correct.
- Rotated ADMIN service worker static cache version after HTML change, commit `74acf5aee23479402c0d1f6dde3fb2f9735f5eae`; this prevents an old complete cache from hiding a new HTML/CSS change.
- [Migration run 42633011262](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42633011262) **success**; [Visual QA run 42633010374](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42633010374) **success**.
- The latest screenshot/baseline evidence is in [REBORN-PDF-VISUAL-QA artifact](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42633010374/artifacts/13681642418) (expires 2026-11-16). Screenshots are functional browser captures, **not** photographic device acceptance or a reference-image pixel-diff.
- **Still open:** migrate and retire remaining old styles and inline design one module at a time: auth/home, sale/invoice, product/warehouse/barcode, purchases, contacts/debts, cash/accounting, settings/subscription, then ADMIN. Recheck import graph before *each* deletion. Visual QA alone cannot certify financial calculations.

## Stage 3 — Tests, security, sign-off and distribution

**Automated evidence already observed:** CI migration and visual smoke runs cited above are green for the current changes. The suite includes source integrity, static asset checking, browser navigation, locale/theme samples and a range of synthetic financial/cloud contracts. A green smoke suite does not certify live server RLS, real accounting completeness, full screenshot parity or hardware.

**Blocking acceptance work (unverified or incomplete):**
1. **Staging only:** authenticated tenant-isolation and all ADMIN roles/RLS; customer soft-delete/restore, IP audit trails, offline permission granting, owner-approved device transfer with pending-sync preservation.
2. **Financial integration:** sale/purchase atomic stock & cash posting, invoices, multi-currency FX, debts, cheques, remittance, journal balance and idempotent sync/partial receipt, all with real staging migrations and backups/rollback scripts.
3. **Visual:** every screen in three themes × three locales with screenshot comparison to the original 12 actual reference images; text-overflow, RTL/LTR, 44px tap targets and WCAG AA; real iPad/Windows layouts.
4. **Hardware:** Android 8–16 physical installation/upgrade (especially same-app signer/keystore), camera scanner, barcode thermal printer, 58/80mm receipt, offline first start and WhatsApp share intent/file attachments.
5. **Release signing:** user-owned stable ONE and ADMIN keystores/secrets; Windows signing certificate; fresh clean release builds and resulting APK/Installer SHA-256. No temporary/debug keys for production.

Owner setup guide: [`docs/PROTECTED_PRODUCTION_AND_OWNER_STEPS_DARI.md`](PROTECTED_PRODUCTION_AND_OWNER_STEPS_DARI.md). Public release remains **BLOCKED** until those gates pass. The current edits are source and QA only. **No final APK or Windows Installer was generated by this stage.**
