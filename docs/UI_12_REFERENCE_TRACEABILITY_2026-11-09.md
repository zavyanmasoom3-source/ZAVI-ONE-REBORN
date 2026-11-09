# ZAVI ONE + ADMIN — 12-reference screen/source traceability
Date: 2026-11-09 | Branch: dev | Status: **baseline mapping, not visual acceptance**.

## Evidence and limitations

The brief groups screenshots **1–5,12** under ADMIN and **6–11** under ONE. Their pixels are not attached in this conversation turn; this mapping is grounded in the owner's textual specification and inspected **live dev source**, not an invented pixel-by-pixel screenshot assessment. The older 5-PDF / 59-page matrix is maintained separately at `docs/PDF_59_PAGE_TRACEABILITY.md`. No customer data, Supabase tables, security permissions or accounting operations are changed by this document.

**Implementation-state vocabulary:** `ROUTED` means a real source entry point exists; `PARTIAL` means a legacy module exists without full new-design+integration verification; `NEW_BACKEND` is not yet safely proved on a staging DB; `BLOCKED` means required evidence is absent. A reference CSS rule alone is never a completed screen.

## ZAVI ONE: new view → current functional entry → acceptance / status

| # | New screen (reference 6–11) | Actual existing source/route | Retained functional contract and test | State |
|---:|---|---|---|---|
| 1 | Splash | `apps/one/index.html`; Android `android-build/app/src/main/java/com/zavione/mobile/MainActivity.java` | No skip of initialization or session guards; local Z mark | PARTIAL |
| 2 | Compact PIN/fingerprint login | `apps/one/index.html`, `pin-recovery.js`, `zavi-biometric-ui-v6546.js` | Offline-capable PIN; biometrics only where approved; no auth downgrade | PARTIAL |
| 3 | Account recovery | `pin-recovery.js`, `apps/one/index.html`, cloud modules | Authentication, old-shop selection, owner support without credential leakage | PARTIAL |
| 4 | Home & cash snapshot | `index.html` `dashboard`; `zavi-approved-dashboard-v2.js` | Genuine posted ledger, 30-day series, editable FX, low-stock, no examples | ROUTED / integration unproved |
| 5 | Sales list | `index.html` `sales` | Search, cash/credit/partial status; immutable issued invoices | ROUTED |
| 6 | New sale: customer → products → payment | `index.html` `sales` modal, `zavi-zxing-offline-v1.js` | Atomic saved sale, per-warehouse stock, idempotency, FX and cash/customer ledger | PARTIAL |
| 7 | Invoice / print / WhatsApp | `invoice.html`, `invoice-a5.html`, `receipt-ui.js`, `zavi-message-center-v6720.js` | 58/80mm + A4/A5, real QR/scan, user-confirmed WhatsApp share intent | PARTIAL |
| 8 | Products / independent warehouses / movement / label | `index.html` `products`, `zavi-warehouses-v1.js`, `zavi-warehouse-transfers-v1.js`, `zavi-barcode-label-v6700.js` | No cross-warehouse accidental stock; label scanner and printer QA | PARTIAL |
| 9 | Purchases / international / in-transit | `index.html` `purchases`, `zavi-in-transit-v1.js` | Purchase, return, customs, partial arrival; zero sellable stock before receipt | PARTIAL |
| 10 | Customers / suppliers / phonebook | `index.html` `contacts`, `phonebook` | Purchase/payment and receivable histories from source records | ROUTED |
| 11 | WhatsApp templates | `zavi-message-center-v6720.js`, `zavi-whatsapp-v1.js` | Editable localized templates, E.164 numbers, send confirmed by user | PARTIAL |
| 12 | Receivables and our liabilities | `index.html` `debtors`, `creditors` | Separate customer receivables from liabilities; posting to correct account | ROUTED / financial proof absent |
| 13 | Waste / stock writeoff | `index.html` `waste`, `zavi-manual-waste-v41.css` | Warehouse-specific quantity/valuation, immutable movement history | PARTIAL |
| 14 | Cash, accounts, remittance, journal & reports | `index.html` `money`, `hawala`, `expenses`, `reports`, `journal` | Balance by currency; atomic transfers; journal debits=credits; PDF/Excel export | PARTIAL |
| 15 | Eight settings groups / themes | `index.html` `settings`; `zavi-three-sizes-v6588.js`; shared UI CSS | Search/settings grouping, persistent 3-mode sizes, AA and RTL/LTR | PARTIAL |
| 16 | Subscription, device handoff, offline/backup | `index.html` `subscription`, `zavi-safe-transfer-v1.js`, cloud/offline modules | Owner approval, pending transactions preserved, no unauthorized device grant | PARTIAL |
| 17 | Staff roles & server policy | `index.html` staff settings, `cloud.js`, `packages/shared/security/access-contract.js` | Server-enforced permissions for sale/purchase/profit/capital, tenant RLS | BLOCKED: multi-role staging evidence |

**Five mobile navigation slots in current `renderNav()`:** `dashboard`, `sales`, `products`, `purchases`, `more`. The route array also includes `contacts`, `phonebook`, `debtors`, `creditors`, `money`, `hawala`, `expenses`, `waste`, `reports`, `journal`, `settings`, `subscription`. They must remain reachable from More; they are not to be deleted because the new screenshots omit them.

## ZAVI ONE ADMIN: new view → current functional entry → acceptance / status

| # | New screen (references 1–5,12) | Existing source/route | Retained behavior and verification | State |
|---:|---|---|---|---|
| 1 | Dashboard & activation charts | `apps/admin/index.html` `overview`, `app.js` | Actual customer/device counts and 30-day aggregation | ROUTED / data QA absent |
| 2 | Customers table | `customers`, `app.js`, `account-control.js` | Search, filters, pagination, export, no demo records | ROUTED |
| 3 | Customer detail / soft delete | `customers`, `account-control.js` | Subscription, notes, devices, recoverable deletion + audit | PARTIAL / soft-delete DB proof absent |
| 4 | Activate / renew 7,180,365d | `payments`, `zavi-admin-renewal-v1439.js` | Server-side extension, verified date, durable history | PARTIAL |
| 5 | Devices / transfer / offline requests | `devices`, `device-admin.js`, `account-control.js` | Identity check, transfer & remote suspension, role checks | PARTIAL |
| 6 | Offline permissions | `devices` and existing device/account functions | Server-granted duration, request workflow, audit | NEW_BACKEND / unverified |
| 7 | Messages and support | `support`, `zavi-admin-service-whatsapp-v139.js` | Editable E.164 WhatsApp intent; append-only history | PARTIAL |
| 8 | Server-enforced roles & security | `security`, `packages/shared/security/access-contract.js` | No client-side-only grants; check RLS for each role | BLOCKED: staging multi-role QA |
| 9 | Operation audit table | `activity`, `app.js` | Immutable/authorized events, actor/action/target/IP if safely collected | NEW_BACKEND / not verified |
| 10 | Admin profile and system settings | `settings`, `app.js`; `health` is legacy system state | Authentication, profile, safe system configuration | PARTIAL |

The actual `apps/admin/index.html` data-page entries are `overview`, `customers`, `devices`, `support`, `payments`, `finance`, `activity`, `health`, `brand`, `security`, and `settings`. Existing `zavi-reference-navigation-v3.js` keeps unsupported/deprecated-looking routes inside a disclosure instead of deleting a still-live action. Requested menu needs explicit entries for offline permissions and reports only once actual backed actions exist.

## Shared design system: authoritative location and handover checklist

- Single token source: `packages/shared/ui/design-system-v1.css` (linked by BOTH `apps/one/index.html` and `apps/admin/index.html`); aliases in `zavi-approved-visual-v2.css` and `zavi-reference-v3.css` are compatibility only.
- Three appearance modes: `data-zavi-appearance=light|dark|glass`, navy `#0B1530`, blue `#1F6BFF`, 8px spacing grid, 16/20px radii, at least 44px controls.
- Reuse semantic `.zds-*` classes for buttons, fields, validation, tabs, stats, tables, stepper, dialog, bottom sheet, charts, status, switch, slider, skeleton, toast and offline state. New modules should not define a fresh competing palette.
- Language is `fa-AF`, `ps-AF`, `en`; apply `dir` to every locale change and test all Pashto glyphs `ګ ډ ټ ړ ږ ښ ڼ ې ۍ`. Dual calendar line and digit presentation require functional screenshots, not a static sample.
- Money must preserve ISO-4217 original amount, transaction exchange rate and AFN conversion separately; styling must never recompute transaction amounts.
- **Font update on dev (2026-11-09):** removed three remote Google Fonts/preconnect tags from each app's `index.html`; both now render using the existing offline-safe system fallback stack. A **bundled, license-compliant modern Arabic-script font is still absent/unverified**. Full offline typography parity and the nine Pashto glyphs must be tested on Android and Windows; this gate is not green.
- **Legacy styling still active:** `apps/one/index.html` contains a large inline `<style>` plus historical CSS includes; `apps/admin/index.html` references many versioned historical CSS files. They cannot be removed until visual/component parity, import-reference search, navigation, functional and offline checks pass.
- **No screenshot evidence yet:** no new 3-theme × 3-language per-route capture or visual diff was generated by this mapping stage. No file is categorized as safely deletable merely because it has an old name.

## Ordered verification and removal procedure

1. Capture a machine-readable import inventory from both HTML entrypoints and service-worker precache manifests.
2. Move one screen's markup to shared tokens/components without touching its action listeners or underlying storage/network contracts.
3. Exercise its saved-data, offline, localization and accessibility behavior in a disposable test workspace.
4. Search all entrypoints and JS for legacy CSS/HTML references; remove **only** files proved to have zero live imports.
5. Record screenshots in 3 themes × 3 languages and compare to exact supplied image pixels; block release on missing expected images.
6. Run financial, auth, tenancy/RLS, real scanner, printer and device-transfer acceptance tests before signing Release.

**Release gate remains CLOSED.** This document is the mapping deliverable, not an acceptance certificate.
