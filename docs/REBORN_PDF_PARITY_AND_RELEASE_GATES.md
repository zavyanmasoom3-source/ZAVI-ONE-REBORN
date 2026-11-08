# ZAVI ONE REBORN — PDF parity and release gates

Status: **implementation in progress; not approved for release**.

This matrix is based on the 5-PDF / 59-page design audit for ZAVI ONE 66.75. The exact design documents should remain the visual source of truth; this matrix is a test plan, not evidence of implementation.

| Area | PDF reference | Required behavior | Required verification |
| --- | --- | --- | --- |
| Sales and barcode | PDF 1 pp. 1–11 | Compact sale form, scan/search, receipt preview and print | Offline camera on Android, repeated scan quantity, warehouse inventory guard |
| Cash dashboard | PDF 2 pp. 3–6 | Separate physical cash per currency and real receipts/payments | Cash reconciliation and no cross-currency sum without FX |
| Product, warehouse, labels | PDF 2 pp. 7–10 | Independent warehouses, Code128 label and CSV | Stock movement, duplicate warehouse code, print preview |
| Purchase / international transit | PDF 2 pp. 11–12; PDF 3 pp. 1–11 | Four primary actions, freight/customs, partial arrival | No stock before accepted arrival; idempotent receipt |
| Invoice and WhatsApp | PDF 4 pp. 1–11 | Receipt preview, 58/80mm, A4/A5, sharing | Android share intent, valid number, actual print test |
| Settings and themes | PDF 4 p. 4; PDF 5 pp. 3–4 | Categorized settings, Dari/Pashto/English, light/dark/glass | Every route, accessible contrast, preserved controls |
| Debt and journal | PDF 5 pp. 1–10 | Debt payments and journal entries without duplication | Double-entry reconciliation and opening-balance isolation |
| Device transfer | PDF 5 pp. 11–12; PDF 2 pp. 1–2 | Owner-approved device transfer and safe recovery | Offline pending queue preserved, permissions and RLS |

## Mandatory engineering sequence

1. Import all current source assets and inspect dependency graph before deleting anything.
2. Run static integrity checks on both apps; missing references block APK builds.
3. Refactor one module at a time while preserving accounting operations and existing API contracts.
4. Review database migrations in a test environment; **never apply legacy SQL to production automatically**.
5. Add end-to-end regression tests for sales, purchases, returns, cash, debts, multi-currency and offline sync.
6. Run a clean, reproducible Android build with unique versionCode/versionName, signing verification and device tests.
7. Publish only when both app feature-parity checks and accounting invariants pass.

## Invariants

- Stock may increase only after verified goods receipt; repeated sync must not double-post.
- Cash balance = opening cash + posted cash receipts − posted cash payments, per currency.
- A historical opening debt must not generate a cash movement.
- Payments and refunds must not duplicate journal entries after retry.
- Mixed currencies must be converted using the stored transaction FX rate before aggregation.
- Do not delete original repositories, production records, migrations or historical releases until rollback is verified.

## Migration hygiene

Avoid old APKs, generated Gradle folders, temporary ZIPs and unused duplicate patch scripts. A file is removable only after dependency analysis and regression tests establish that it is unused. Each release must be traceable to a source commit and fresh CI run.

## Audit against user-supplied reference APK and five PDFs — 2026-11-08

**Source of truth:** `ZAVI_ONE_66.75_all_devices_debug(2).apk` and PDFs `ZAVI ONE 1–5(2).pdf` (59 photographed pages). The PDFs depict proposed interaction samples, not proof that the features work.

### Root-cause evidence (measured from the APKs)

- The earlier REBORN QA APK and 66.75 APK shared **235 identical packaged assets**, had **4 changed common assets**, **11 added** assets, and **12 missing** old assets. A successful Gradle build was therefore not evidence of a rebuilt product.
- Reference APK package: `com.zavione.one`. Prior REBORN QA package: `com.zavione.one.rebornqa`. These install **side by side**, never in-place update.
- The Android Debug signing certificates differ: reference SHA-256 `f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25`; early REBORN QA SHA-256 `bca0c3e1fd9e84e9644e59dacbcb177ff767ce761d2d38ad622b5a281fc94a32`. Reusing the package name without the **original private signing key** cannot update the old installation.
- Stale historical version fields remain in legacy JSON metadata. CI now stamps `assets/zavi-build-info.json` (run, commit, app, package and version) and a visible `REBORN QA` label in both apps. Release provenance must come from this build-owned file, not legacy marketing metadata.
- Old barcode label and local WhatsApp centre modules had been removed from REBORN. They are now restored as single canonical modules, with Code128/EAN13 and WhatsApp queue/phone regression tests. Real devices and print/share targets remain unverified.
- Legacy visual CSS layers are deliberately **not** blindly reintroduced: their specificity can override the new design, and functional parity must be tested instead.

### PDF requirements and evidence — implementation is *not* yet complete

| Source | Approved example | Current evidence | Open release gate |
| --- | --- | --- | --- |
| PDF 1 pp. 1–11 | Rapid sale, warehouse selection, offline camera scan, mixed currencies, payment/credit, receipt | Existing source modules and successful 10-route smoke test | Real sale accounting, barcode camera on device, stock guard and split tender regression |
| PDF 2 pp. 1–6 | Login/recovery, clean dashboard, cash per currency, correct account summary | Three-language and design foundation exist | Data-backed charts, verified cash ledger reconciliation, auth/restore UX |
| PDF 2 pp. 7–10 | Warehouse, product quantities, barcode/Code128 labels | Label builder restored; Code128/EAN13 automated tests pass | Product selection, print size/copies and warehouse inventory on Android |
| PDF 2 pp. 11–12; PDF 3 pp. 1–12 | Purchase dashboard: new/domestic/international/returns, in-transit orders, FX, customs, freight, partial arrival | Source has legacy purchases and warehouse modules | Four-route end-to-end transitions, no pre-arrival stock, idempotent receipt and reconciliations |
| PDF 4 pp. 1–3 | Compact purchase item form, partial/final payment, due dates and discount | Existing legacy renderer survives | Purchase payable/cash double-entry behavior on device |
| PDF 4 pp. 4–6 | Categorised settings, independent toggles, sales/purchase layout | Settings design and navigation smoke tests pass | Full PDF visual parity and preference persistence |
| PDF 4 pp. 7–11 | Receipt preview, print A4/A5/58/80mm, save, WhatsApp image/PDF | Existing invoice modules and restored text-only message centre | Real Android print/share attachment tests; file attachment sharing is **not implemented/verified** by the restored text module |
| PDF 4 p. 12; PDF 5 pp. 1–12 | Cash, debts, WhatsApp reminders, reports, owner device transfer, journal, colleagues, general trade and hawala | Source modules exist; fresh-session navigation test passes | Offline transaction tests, tenant isolation, RLS verification, debt ledgers, owner-only ADMIN and device migration |

### Strict release sequence

1. **Completed:** reproducible Gradle 8.13 QA build with checked distribution; immutable CI commit provenance and static source checks.
2. **Completed (static/CI only):** headless browser smoke on 10 main routes; isolated barcode encoder and message phone/queue tests.
3. **Outstanding:** compare every screen with PDFs using device screenshots, check RTL/LTR and Light/Dark/Glass state, and test existing persistent-state migrations that may cause the reported dashboard-only failure.
4. **Outstanding:** transactional sales/purchases, stock, returns, cash ledger, cheque, offline queue, conflict resolution and RLS tests using seeded disposable tenant data.
5. **Outstanding:** owner-only ADMIN workflow and real Android print, camera, WhatsApp share, backup/restore and offline transfers.
6. **Outstanding:** same-package update requires original signing keystore or a **verified backup/export + new-install migration**, with a stable signing key for all future releases. Never advise users to uninstall their sole copy of financial data.
7. **Blocked:** public/release APK until every relevant gate is demonstrated. QA debug artifacts are not releases; never relabel an old APK as a new version.

The production Supabase database, user records, repository history, and old APKs were not modified by this audit.
