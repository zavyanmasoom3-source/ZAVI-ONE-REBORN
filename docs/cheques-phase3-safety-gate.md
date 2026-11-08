# Cheque module — phase 3 safety gate

Status: SCHEMA DRAFT ONLY. Not enabled in the app, not applied to production, and not validated against the actual Supabase tenant/account model.

## Required before migration
1. Verify how ZAVI ONE maps each business tenant to Supabase users. The draft owner_id policy may be too coarse for a multi-user business. Do not run migration until replaced with verified tenant + role permissions.
2. Review existing ledger posting API and idempotency keys. A cheque's registration does NOT create a cash movement. Only a verified clearance transition can create one, atomically.
3. Add server-side transition validation and event audit writes, including rejection of illegal transitions and duplicate clearings.
4. Add due-date reminders that run offline on the device and online via a trusted scheduler without duplicates.
5. Build accessible received/issued lists and forms, with currency and date validation; do not expose a fake working UI.
6. Test RLS for owner, colleague, unrelated account; test offline retries, simultaneous clearings, return/bounce, voiding, migration rollback, and ledger reconciliation.
7. Only then wire the navigation and build a Debug APK.

Existing dashboard, sales, purchases, warehouse, and customer logic remains untouched by this schema draft.
