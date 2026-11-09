# ZAVI ONE / ADMIN — Owner's NEW visual references (10 of 12 received)
Date: 2026-11-09 · Target: `dev` · Gate: **visual approval pending 2 further sheets**
Status: **evidence inventory and implementation plan**, not a finished UI, production test, APK or installer.

## Source provenance and safeguard

On 2026-11-09 the owner supplied **10 composite JPEG design sheets** in chat and stated **2 more will follow**. The 10 sheets are the newly approved UI direction; do **not** mistake them for live-app screenshots or QA proof. Attachments are conversation assets, **not currently committed image baselines** in the repository. Every sheet contains multiple screen mockups; numbers, dates, names, addresses, phone numbers, devices, currency sums, charts, QR and barcodes are illustrative only. Actual apps must display real, tenant-authorized data, functional empty states, or legally safe defaults — **never hardcoded mock customer data**.

The older `docs/UI_12_REFERENCE_TRACEABILITY_2026-11-09.md` was based on textual brief before these concrete images arrived. This new inventory refines it; no 12/12 image parity claim is permitted until the last two sheets and screenshot-diff assets are available.

## Reviewed sheets (order of receipt)

| Sheet | App / appearance shown | Visible pages and flows | Current entry/source to preserve | First visual acceptance checks |
| --- | --- | --- | --- | --- |
| 01 | ADMIN navy + light, multiple panels | Splash/brand; dashboard metric cards, trend and donut; customers; activation/renewal; devices; offline permission; communication/WhatsApp; role/security checkboxes; operation history | `apps/admin/index.html` overview, customers, payments, devices, support, security, activity; `apps/admin/app.js` | Navy navigation; white content; blue selected state; 4 KPIs; readable RTL table; workflow controls must be wired to permission-checked actions |
| 02 | ADMIN light and dark variants | Dashboard; admin profile; role list and editable role permissions; server security toggles; activity history; system settings; customers list; subscriptions/renewal | overview, settings, security, activity, customers, payments; shared role contract | Dark mode must keep high contrast; profile must not be fake/hardcoded; RLS/authorization cannot be implemented by a CSS toggle |
| 03 | ADMIN navy + light | Dashboard and customers; customer detail; message-topic tiles; editable WhatsApp text; recipient preview; final send-confirmation dialog | overview, customers, support; `apps/admin/zavi-admin-service-whatsapp-v139.js` | Topic selection → editable message → recipient → confirmation → actual share intent; never send automatically or promise WhatsApp delivery |
| 04 | ADMIN navy + light | Dashboard; customer table; three-step activation (select customer → duration → confirm); subscription details/renew actions; devices with offline setting; event log | overview, customers, payments, devices, activity; `apps/admin/zavi-admin-renewal-v1439.js` | 7/180/365-day durations; server-authorized renew; real dates; device permission/history retained |
| 05 | ADMIN navy + light | Dashboard; customer list; full customer profile/details with device tab; renewal dialog with 7/180/365 days | overview, customers, payments, devices | All actions reachable from list and detail; modal focus/escape/back; confirm before data change |
| 06 | ADMIN navy + light, mobile-width panels | Device-management dashboard; device list; device detail; primary-device transfer wizard; offline requests; access/activity history; offline policy settings; device report | devices, activity, security; owner-device transfer + offline modules | No silent ownership transfer; active device and offline permits bound to correct customer; verify role/identity and retain pending sync queue |
| 07 | ONE light | Home and cash snapshot; cashbook; accounts/banks; multi-currency and manual rates; remittance overview/new; account transfer; journal; financial reports; business contract | `apps/one/index.html` dashboard, money, hawala, journal, reports, settings | True per-currency balances; transfer atomicity; visible dual Afghan/Gregorian dates; no recalculation of posted money by styling |
| 08 | ONE dark mobile | Splash; home; sales list; new-sale product step; products/warehouses; customers; liabilities; cashbox; remittance; journal; reports; settings; subscription; staff access | dashboard, sales, purchases, products, contacts, creditors, money, hawala, journal, reports, settings, subscription; original five bottom tabs | Consistent dark 5-tab nav; dark contrast; sale remains 3 real stages; all More destinations still open; no dashboard-only fallback |
| 09 | ONE light mobile | Products/warehouses entry; product search/stock; independent warehouses; stock movements; barcode label; purchase stages; procurement; sales/purchase invoices; invoice preview; print/share | products, purchases, sales; `zavi-warehouses-v1.js`, `zavi-barcode-label-v6700.js`, invoice/receipt modules | Warehouse-independent stock; movement history; offline barcode; actual invoice and 58mm/80mm/A4/A5 print/WhatsApp functions |
| 10 | ONE light mobile | Home; customers; customer detail; contacts/phonebook; editable WhatsApp reminder; receivables; our debts and debt detail; waste list + new waste form | dashboard, contacts, phonebook, debtors, creditors, waste; messaging modules | Keep receivables separate from obligations; E.164 send intent; waste decreases correct warehouse with audit trail |

**Sheet 11:** PENDING (do not invent content or mark approved).

**Sheet 12:** PENDING (do not invent content or mark approved).

## Visual constants already supported by live dev source

- Shared token root: `packages/shared/ui/design-system-v1.css` and JS helper; loaded from **both** apps. Existing offline Vazirmatn font and OFL license must remain packaged.
- Light samples: clean near-white surfaces, understated borders, bright blue primary actions, soft cards, readable small text. Dark sample: dark charcoal/navy backgrounds and high-contrast labels. The prior project also requires the third **glass** appearance; these 10 sheets alone do **not** demonstrate its pixel-accurate reference.
- ADMIN: navy navigation; logo and selected blue navigation item; real search/filter/table pagination/status chips; fast customer activation; safe device/offline workflow.
- ONE: 5 fixed bottom navigation destinations (home, sales, products/warehouse, purchases, more), plus reachable secondary routes. Preserve RTL/LTR, three languages Dari/Pashto/English, real dual dates, and responsive Android/Windows.
- Minimum 44px interactive target, clear active/disabled/error states, semantic focus, RTL-aware text overflow, and no sample text embedded in production.

## Conflicts to resolve before page migration

1. **ADMIN sidebar placement varies.** Sheets 01–02 place a navy rail to the right of the content, sheets 03–06 place it to the left. Treat these as alternatives **within one shared navigation system**, not two different applications; do not hardcode contradictory sidebar layouts per screen. Existing runtime language/direction, responsive requirements and the final two sheets must inform the canonical behavior.
2. **Dashboard KPI sample numbers are inconsistent between mockups** (intentional examples, not data contract). Only query real authorized aggregates.
3. **ADMIN navigation grouping differs** (some sheets show finance, permissions, profile, detailed devices). Keep all functional routes accessible even if grouped behind a secondary menu.
4. **Light and dark mockups differ in density and icon treatment.** Share semantic components and tokens; keep screen-specific layout. Verify all three appearance modes.
5. **Device offline duration and subscriptions are distinct policies.** 7/180/365-day subscription buttons must not automatically grant the same offline window; enforce backend state/authorization.
6. **Print, WhatsApp and barcode are actual workflows**, not decorative buttons. End-to-end test on hardware/browser before release.
7. **No screenshot baseline files yet in Git.** Route-level browser tests currently prove behavior/style attachment, *not* image similarity.

## Ordered, non-destructive implementation

**Phase A — reference intake & source map (CURRENT).**
- [x] Inspect and label 10 available composite sheets, including live source paths.
- [x] Validate actual source route names in ONE and ADMIN on dev (route exists does not imply correctness).
- [ ] Receive sheets 11–12 and settle conflicting visual variants.
- [ ] Create per-screen cropped, approved baseline assets under a dedicated QA directory; avoid mock data extraction.
- [ ] Approve one semantic navigation / token contract for all variants.

**Phase B — page-by-page UI replacement (NOT VERIFIED).**
- [ ] ADMIN first: sidebar/header → dashboard → customers → subscriptions → devices/offline → messages → role/security → audit/settings.
- [ ] ONE: home → sales → products/warehouses → purchases/invoices → clients/WhatsApp → debts/waste → finance/reports → settings/roles/subscriptions.
- [ ] Each screen: retain original event handlers, data fetches, offline storage, auth checks and RLS; run navigation/theme/language/accessibility/browser regression before the next.
- [ ] Remove legacy styles only after zero live-import proof, equivalent screen coverage and clean CI.

**Phase C — release gate (CLOSED).**
- [ ] Screenshot-diff 3 themes × 3 languages × Android/Windows resolutions; record exact baseline version.
- [ ] Account balance/stock/invoice/reversal/staged receipt/in-transit/FX tests, server-side RLS multi-role, offline sync and transfer; no production DB mutation in QA.
- [ ] Hardware barcode, printer, biometric and offline tests; signed Android APKs and Windows installers only after clean release build and owner secrets are available.

## Evidence at intake

At intake the known `dev` head was `51c849f7a05d8238fde11c4792de38b55c191320`. The existing `Migration integrity gate` run `42633486767` succeeded at that head, but that success is **not** acceptance of the 10 newly supplied references. The original routes, shared design CSS/JS and 12-reference Chromium tests were verified to exist. No database, finances, subscription or app logic was changed by this inventory.
