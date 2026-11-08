# ZAVI ONE cheque settlement — live schema blockers and non-destructive implementation gate

**Evidence date:** 2026-11-09. Source: read-only Supabase PostgreSQL catalogs; no real customer data queried or changed.

## Verified blockers

1. Existing `public.zavi_cheques` contains `amount`, `currency`, `direction`, `status`, `cleared_at`, `linked_transaction_id` but **no settled_amount column**.
2. Live constraint `zavi_cheque_initial_pending` is `CHECK(status = 'pending' AND cleared_at IS NULL AND linked_transaction_id IS NULL)`. It rejects **every cleared/deposited/bounced transition**, even though the separate status-check constraint allows some of those words.
3. Live `public.zavi_cheque_events` has no operation UUID, actor UID, journal amount, or immutable per-request idempotency value; it cannot alone prove exact-once settlements.
4. Live `public.zavi_workspaces.payload` is the current accounting JSONB document; all six workspaces have `currency`, `accounts`, and `tx` keys; none has a top-level `journal` or `baseCurrency` key. The proposed server journal must reconcile atomically to this document or the accounting UI can show an incorrect cash balance.
5. Only owner INSERT and SELECT RLS policies were observed on cheque tables; a normal authenticated client does **not** have a supported direct UPDATE policy for status changes. Do not add client UPDATE privileges just to unblock clearance.

## Staging implementation contract, not yet a deployable migration

- Use a separate, explicitly marked disposable staging Supabase project with **synthetic** tenant owners, cheques, accounts, customers and invoices. Copy schema and reviewed safe functions only; never copy customer financial data.
- Before any staging migration, make a schema backup and a tested inverse SQL rollback. Register exact source schema hashes.
- Add explicit partial-settlement state and settled amount under a CHECK constraint. The current pending-only constraint must be replaced **only in staging**.
- Implement a PostgreSQL RPC with one DB transaction per call: **lock workspace and cheque with SELECT ... FOR UPDATE; verify auth.uid() and workspace ownership in server code; check server-trusted subscription; require a UUID operation key; enforce unique operation ID; reject repeat with different payload; post balanced journal entries plus cheque state and event in the same transaction**. PostgreSQL function calls run within a transaction; PL/pgSQL functions cannot independently COMMIT inside an ordinary RPC.
- Do not use client timestamps for sequencing or rely on JavaScript-only validation. For different currencies, validate transaction-rate provenance and round after deterministic conversion.
- Bounce must reverse **each actual prior journal leg** (including split bank accounts and rates), not only update cheque status. Prevent deletion of settled cheques.
- A failed statement must abort both journal and cheque transition; no partial JSONB or shadow-ledger state allowed.
- Public RPC should use SECURITY INVOKER; if a non-exposed internal SECURITY DEFINER helper is unavoidable, pin search_path and enforce auth.uid() / tenant authorization. Revoke PUBLIC and anon EXECUTE on privileged helpers.
- Test concurrently with separate connections: two same-key requests (same outcome), same key with different amount (rejected), two different operations against one remaining amount (at most one clears), dropped connection mid-operation (one or zero complete postings, never partial), return after partial/full clearing, tenant cross-access, unlicensed/anonymous, and double-entry balance zero for every operation.
- Integrate the deployed RPC with the offline outbox, then verify it through the actual accounting cash/cheque screens on a disposable 3-device setup. No UI may show a cheque as cleared without confirmed journal posting and idempotent backend ack.

## Current executable evidence

`scripts/test-cheque-settlement.cjs` exercises pure ledger math: received/issued, 30+70 split, replay rejection, bounce reversal, FX half-up rounding and cancellation. `.github/workflows/migration-integrity.yml` runs it successfully. **This does NOT prove database-level concurrency, tenant isolation, server-side ledger posting or real-device correctness.**

**Decision:** No database migration was applied. Do not remove `zavi_cheque_initial_pending`, expose a bypassing UPDATE policy, or claim cheque settlement completed until a staging test and rollback both succeed. This is an intentionally blocked financial release gate.
