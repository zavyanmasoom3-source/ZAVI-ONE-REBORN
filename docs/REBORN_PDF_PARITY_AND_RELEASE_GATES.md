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
