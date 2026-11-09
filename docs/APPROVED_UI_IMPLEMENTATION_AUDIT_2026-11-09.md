# ZAVI ONE — approved UI implementation audit (2026-11-09)

> Status: **in progress / review only**. This document does not certify pixel-perfect matching or production readiness. **NO APK BUILD AUTHORIZED.**

## Repository and version provenance

| Repository | dev commit inspected | Source observation |
|---|---|---|
| zavyanmasoom3-source/Zavione | `6ad4e7d17eaa...` | Legacy source at `app-source/one` on dev; main uses legacy build/archive layout |
| zavyanmasoom3-source/ZAVI-ONE-UNIFIED | `27aca9e36716...` | Unified `apps/one`, `apps/admin` |
| zavyanmasoom3-source/ZAVI-ONE-REBORN | `84fcc4f9f851...` | Unified app + newer scoped QA, accounting guards, warehouse/transit UI |

The **exact V66.62 debug QA reference** is tag `zavi-v6662-one-debug-qa` and `zavi-v6662-admin-debug-qa` in `Zavione`, both pointing to commit `d238c4c8d5ae5d53de7ff5f60b55a3dba839123b` (2026-11-03). This old tag contains legacy Android patches and an older packaged-source layout, **not** the full modern unpacked `apps/one` tree. Do not present the active REBORN `66.78` source as if it were V66.62, and do not silently downgrade or overwrite the newer source to match the old version label.

366 of 376 identically located files shared by `ZAVI-ONE-UNIFIED/dev` and `ZAVI-ONE-REBORN/dev` have identical Git object SHA-1s. REBORN is the current working source for a non-destructive review branch. The legacy tag is a provenance reference, not the new build source.

## No-APK safety

- All sale changes are isolated on `feature/approved-sales-v6662-ui`, opened as a **draft PR against dev**.
- Do not merge into `dev` without a build policy decision: existing `push: dev` workflows automatically compile Android APKs.
- `.github/workflows/approved-sales-review.yml` runs **only** Node syntax/PWA asset checks and headless Chromium on pull requests; no Android SDK, Gradle, signing, release, or server writes.
- Production Supabase schema and financial customer records have not been changed in this task.

## Exact owner screenshots examined

- `IMG_3460.png`: sales overview, today count, tabs, empty state, five-slot bottom navigation.
- `IMG_3461.png`, `IMG_3462.png`: invoice date, customer, existing warehouse product lines, barcode/quantity/price, totals.
- `IMG_3463.png`, `IMG_3464.jpeg`: cash/bank/credit, amount received, remaining, receipt preview.
- `IMG_3465.png`, `IMG_3466.jpeg`: product field validation and mobile-camera barcode control.

These are **UI reference images containing example data and prototype guidance**, not app database fixtures. No user-example customers/products/prices were copied into real source. Synthetic `QA_LOCAL_APPROVED_SALE_PRODUCT` exists **only inside an ephemeral Chrome test**.

## Implemented, not yet accepted

1. Real existing sales route retains `data-action=sale` and delegated navigation.
2. Actual source summary today/count is generated from non-voided transactions, not hardcoded sample figures; historical stats remain available in a collapsed summary.
3. Sales invoices and manual invoices are organized in two functional tabs by **moving the original live DOM**, not cloning rows or handlers.
4. Native three-pane `openOrder('sale')` remains authoritative; new UI is only applied to the sale kind, never sale returns/purchases.
5. Existing catalog, camera barcode button, barcode input, per-line qty/price, free-form customer, ledger account, discount, paid input, and native save handler retained.
6. Payment choices map to current cash/bank account and paid-amount fields; choosing credit sets paid to zero. **This is not true multi-account split payment**.
7. A read-only unsaved receipt preview displays actual entered lines, exact decimal invoice totals and remaining balance; it does not write a transaction.
8. Inline validation for missing catalog product, nonpositive quantity and price, overselling, overpayment and unnamed credit customer before preview.
9. A new scoped visual skin uses the current shared themes (Light/Dark/Glass), RTL/LTR and Dari/Pashto/English labels without a duplicate global theme subsystem.
10. Versioned PWA cache includes these new source assets; base cache namespace remains `zavi-one-shell-reborn`.

### Browser QA evidence and limitations

Workflow: `Approved sales UI review — browser only (NO APK)` on the draft PR.
Tests: `scripts/test-approved-sales-browser.py`, `node --check`, `scripts/check-offline-shell-assets.py`.

The full browser suite checked:
- sales page and two real invoice tabs;
- native transaction form and original `onsubmit` listener;
- barcode keyboard-scanner same-code twice -> quantity increments;
- unit price zero -> inline error and no transaction;
- unsaved preview with current real input values and no recorded transaction;
- three style selectors and 420px mobile overflow;
- native local-only sale saved **exactly once** in a disposable browser after explicit test-only permission stub, with recorded test figures: opening stock 10, sale quantity 2, ending stock 8, invoice total AFN 34, paid AFN 20, customer receivable AFN 14, durable localStorage transaction; network to production Supabase domains explicitly blocked.

**Not proven:** physical phone camera scan, actual server RLS, SQL atomic posting, concurrent device reconciliation, per-warehouse server sale inventory, true mixed FX payments, and pixel-level screenshot parity.

Browser QA run at commit `ff8ea500244771052613156246304ef1d40a980c`:
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42584929337 — passed (real Chrome app, real local native save only).
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42584929340 — passed (migration/security integrity gate).
- Later CSS-only scanner placement revisions still require their own capture/review before any acceptance. Test uses real Chrome DOM and a **disposable browser-only** synthetic stock item; no client financial write is presented as a real-world accounting acceptance test.

## 15-section acceptance register

The statuses below refer to implementing the **newly approved UI in this initiative**, not whether legacy modules exist in source.

| Section | Reference | Source | UI | Function | Database | Status | Remaining |
|---|---|---|---|---|---|---|---|
| Dashboard | Previous approved PDF images | `apps/one/index.html` | Not compared | Not retested here | Read-only projections known | اجرا نشده | Full exact reference and Chrome diff |
| Sales & invoices | Owner IMG_3460–3466 | `apps/one/zavi-approved-sales-v6662.*`, `index.html` | Browser captures only | Partial Chromium checks | Live Supabase not tested | آزمایش شده و دارای مشکل | Warehouse-specific posting, real payment splits, device camera, pixel match |
| Products & warehouses | Previous PDF | `apps/one/zavi-warehouses-v1.js` | Not compared | Existing functionality, unverified under this directive | Real server catalog code exists | اجرا نشده | Server/local stock ledger reconciliation |
| Subscriptions/offline | Previous PDF | `apps/one/cloud.js`, device assets | Not compared | Not retested here | Owner policy not retested | اجرا نشده | Actual device entitlement/recovery |
| Journal | Previous PDF | `apps/one/index.html` | Not compared | Not retested here | Not tested | اجرا نشده | Related source document proof |
| Our debts | Previous PDF | `apps/one/index.html` | Not compared | Not retested here | Not tested | اجرا نشده | Real balance/history reconciliation |
| Contacts/WhatsApp | Previous PDF | `apps/one/zavi-message-center-v6720.js` | Not compared | Not retested here | Not tested | اجرا نشده | Explicit user send, localized templates |
| Waste | Previous PDF | `apps/one/index.html` | Not compared | Not retested here | Not tested | اجرا نشده | Ensure report-only does not post stock |
| Colleagues | Previous PDF | `apps/one/zavi-staff-v648.js` | Not compared | Not retested here | RLS not retested | اجرا نشده | Real owner/staff denial test |
| General trade | Previous PDF | `apps/one/index.html` + industry extensions | Not compared | Not retested here | Not tested | اجرا نشده | Save metadata separate from ledger |
| Remittances | Previous PDF | `apps/one/index.html` | Not compared | Not retested here | Not tested | اجرا نشده | Atomic double-entry and FX |
| Login/recovery | Previous PDF | `apps/one/index.html` + recovery | Not compared | Test PIN to reach sale, not full auth | Not tested | اجرا نشده | Real biometric and recovery audit |
| Settings | Previous PDF | `apps/one/index.html` | Not compared | Not retested here | Not tested | اجرا نشده | Three sizing controls, theme persistence |
| Purchases & returns | Previous PDF | `apps/one/index.html`, transit | Not compared | Not retested here | Not tested | اجرا نشده | Partial receipts and true stock/FX |
| ZAVI ONE ADMIN | Previous PDF | `apps/admin/app.js` | Not compared | Not retested here | RLS not retested | اجرا نشده | End-to-end role, extension, tenant checks |

No part above is marked `تأیید نهایی`. Every previously functional module must remain in place until its replacement, dependencies and end-to-end tests are proven.

## Changed files (this review branch)

- `apps/one/zavi-approved-sales-v6662.js` (new)
- `apps/one/zavi-approved-sales-v6662.css` (new)
- `apps/one/index.html` (load new UI assets and label native order kind)
- `apps/one/sw.js` (cache new assets without breaking namespace)
- `scripts/test-approved-sales-browser.py` (new, browser-only)
- `.github/workflows/approved-sales-review.yml` (new, PR-only browser QA)

## Acceptance criteria before any release or merge

1. Owner visual review of actual screenshot captures with the corresponding seven references, for Light/Dark/Glass and mobile/tablet/desktop.
2. Test actual `openOrder` save/undo path, real customer account, return, warehouse selection and server-side stock posting in a disposable staging environment.
3. Test physical Android camera and fallback scanner, thermal/PDF printing and WhatsApp handoff on devices.
4. Test owner/staff authorization, multi-device offline conflict/idempotence, decimal FX precision, and signed package contents.
5. Obtain **explicit owner authorization** before merging to a branch that automatically builds an APK.
