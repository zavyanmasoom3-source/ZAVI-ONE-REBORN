# New ZAVI ONE design — measured implementation progress (2026-11-09)

**Branch:** `dev` • Owner's 21 screen groups + 7 ADMIN groups • Five uploaded PDFs (59 reference pages).
**Policy:** No public Release and no claim of 59/59 visual parity until each reference is compared with its actual state and business actions are checked against staging/physical devices.

## Completed in code and previously verified through browser/CI

- **Shared foundation:** `packages/shared/ui/design-system-v1.{css,js}`, both app entrypoints; three-theme tokens, Dari/Pashto/English direction and Afghan/Gregorian dual date, WCAG-AA computed *shared-component* contrast checks. Evidence [visual 42524258521](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42524258521).
- **Navigation (ONE):** exactly 5 mobile destinations Home / Sales / Products / Purchases / More, translated by language and only enabled for modules with permitted visibility; existing More navigation retained.
- **Dashboard (ONE):** four real buttons for new sale, purchase, customer debt, warehouse; real dual-date line, manual USD card display `۱ USD = ۷۵ AFN` for a **disposable in-memory rate** (not a stored demo amount); expandable **base-currency cash account** balance from the existing `cashBalances()` including opening, actual receipts and payments. A separate USD cash ledger remains separate rather than added to AFN.
- **Sale & purchase:** original financial form controls moved to 3 accessible stages, preserving original save handler; native validation under field and blocking nonpositive unit prices. Purchase menu has four actions New / Domestic (country AF) / Foreign (country free text required) / Return.
- **Money:** 3 tabs Accounts / Transactions / More retaining actual account and transfer controls.
- **Products & warehouse:** 3 tabs Products / Warehouses / Stock movements; original server-backed warehouse editor intact, stock movements tab is a **read-only projection of the actually fetched server history**, not made-up stock. Historical local invoices and server warehouse movement model are *not yet unified*.
- **Journal:** 3 tabs Transactions / Notes / Inventory, independent transaction/note paging from the actual tenant snapshot, and the existing smart inventory view; dual dates in journal. No additional financial transaction created by the UI.
- **Reports:** 3 tabs Summary / Details / Export, preserving existing active reporting controls.
- **ADMIN:** compact searchable groups Appearance, Security, Cloud, Renewal, Support, More; original password fields, logout, receipts, and support controls remain live. Verified in **localhost-only demo**; server role testing still missing.
- **PWA:** both apps' new design JS/CSS added to versioned offline static-shell caches.
- **No database migrations, no deleted financial records, no weakened signature or server auth checks.**

**Relevant earlier CI:** [Browser screens 42527030235](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42527030235) verified 59 routes and real tab functions including products and purchases, [source integrity 42527030470](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42527030470) passed. [Visual QA 42527376622](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42527376622) verified journal tabs and date behavior. Newer cash + negative-submission QA is being run separately; **do not infer success until that workflow finishes**.

## NOT completed — remaining as explicit release gates

| Screen group | Remaining acceptance work |
|---|---|
| 2-1, 2-2 | PIN/fingerprint/recovery interaction on physical Android, one-language-at-a-time all copy, reset server contract |
| 2-3, 2-4 | Charts and dashboard PDF exact layout, per-currency vault/cash register accounting and full ledger comparison on staging |
| 2-5, 2-6 | Multi-currency combined payments/FX/warehouse selection/negative-stock permissions; real atomic transaction and offline outbox |
| 2-7 | Valid A4/A5/58/80mm thermal printing; real Bluetooth/USB, PDF/image Share Sheet to WhatsApp |
| 2-8 | Reconciliation of old local inventory and independent server warehouses, scan physical barcodes, label printer |
| 2-9, 2-10 | **Purchase order and in-transit goods tracking / partial receipts / landed costs** are not fully integrated; no false inventory increase before arrival |
| 2-11, 2-12 | All 8 ONE settings groups, signed offline entitlement and safe transfer test across 3 devices |
| 2-13 | Complete reports by currency/date with real exchange rates, bank/cash accounting reconciled |
| 2-14, 2-15, 2-16 | Creditor/debtor multi-currency and payment journaling, E.164 persistence, WhatsApp consent and complete messages |
| 2-17 | All screen-language strings translated and per-currency ledger verification; UI tab/pagination is completed |
| 2-18 | **Existing waste-record mechanism is manual and does not change inventory**; owner requirement for automatic per-warehouse adjustment would require a separately audited, idempotent financial/stock posting. NO unsafe shortcut was added |
| 2-19, 2-20, 2-21 | Server-side colleague privacy, standalone contract/financial invoice, fully tested remittance double-entry |
| ADMIN | Fully authenticated owner/agent/expired/non-token RPC role matrix and soft-delete/restore against disposable database |
| All 59 PDF pages | Capture of actual 59 page route entrypoints exists, but **no claim of full per-pixel visual and behavioral parity**; screenshot vs source reference acceptance remains |
| Android/Windows | Two fixed-signing production APKs are blocked by owner-controlled secrets; Windows unsigned QA installers exist; no final four-file release, physical upgrade no-data-loss test, or SHA-256 final deliverables |

## Test principles

- The `scripts/test-compact-workflow-browser.py` test uses **only synthetic records in a throwaway browser memory**, never a cloud write. It verifies screen routing, tabs, existing form fields, quote formatting, invalid price blocking and cash arithmetic. It does not prove settlement SQL or three-device cloud synchronization.
- The `scripts/test-admin-settings-layout-browser.py` test uses the built-in localhost-only ADMIN demo and does not bypass real authenticated production permissions.
- Stable Android build must **fail closed** if encrypted per-app secrets are missing; TEST-NOT-FOR-RELEASE builds use a separate package and testOnly Manifest and MUST NOT be marketed as an update or release.
- Never change live Supabase financial tables until schema backup, tested rollback, synthetic staging database and transactional consistency tests have passed.

## Current-source inventory changed during the implementation

`apps/one/index.html`, `apps/one/zavi-compact-workflow-v1.js`, `apps/one/zavi-compact-workflow-v1.css`, `apps/one/sw.js`, `apps/admin/index.html`, `apps/admin/zavi-admin-settings-hub-v1.js`, `apps/admin/zavi-admin-settings-hub-v1.css`, `apps/admin/sw.js`, `scripts/test-compact-workflow-browser.py`, `scripts/test-admin-settings-layout-browser.py`, and `.github/workflows/visual-qa.yml`. Additional prior features and shared design system files remained unmodified.

**Release status:** NOT READY. **Design scope:** not 21/21, not 59/59. No unsupported assurance that the remaining financial and device features already work.
