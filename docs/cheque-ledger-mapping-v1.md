# Cheque clearing: verified existing ledger mapping (code review)

Source: apps/one/index.html, cashBalances(), contactBalances(), renderMoney(), cash payment form; apps/one/cloud.js push().

## Existing ledger types
- **Received cheque** cleared against an existing customer receivable: append a single tx with `type: 'customer_payment'`, `amount` in **workspace base currency**, `accountId` valid existing account, `contactId` valid existing customer, `date`, `created`, `id`, `code`, `reference`, and `note`. cashBalances adds `amount` to the account; contactBalances subtracts `amount` from receivable.
- **Issued cheque** cleared against an existing supplier payable: append a single tx with `type: 'supplier_payment'`, equivalent fields, and valid supplier. cashBalances subtracts `amount`; contactBalances subtracts `amount` from payable.
- These types are ONLY valid for settling an existing receivable/payable. A cheque for capital, a loan, or a cash sale needs its own reviewed mapping; do not coerce it into a customer/supplier payment.
- Multi-currency: `amount=round(originalAmount * exchangeRate, 2)`; include `originalAmount`, `originalCurrency`, `exchangeRate`. Reject missing/zero rate for non-base currency, and enforce account currency rules after inspecting account metadata.
- Registration, deposit, cancellation, bounce: NO ledger entry. Cleared transition: one ledger entry only, with stable `id='cheque:'||cheque_uuid` and unique reference.
- The workspace `revision` must increment atomically with `payload.tx` append and cheque state/event update, under a workspace row lock. The existing cloud.js PATCH uses `revision=eq.oldRev` and must then conflict on stale snapshots.
- A second RPC call returns the same linked transaction ID and must not append again.
- If workspace revision CAS or ledger schema validation fails, the RPC must roll back *all* changes.

## Unresolved safety-critical requirements
1. Validate account IDs, account currency and per-contact outstanding balance inside the locked workspace snapshot. Do not allow negative payable/receivable without an explicit business rule.
2. Check whether `money()` uses decimal rounding or floating point; use PostgreSQL numeric with the same rounding convention.
3. Ensure all cheque statuses and events are written server-side; client direct UPDATE must not be able to forge `cleared`.
4. Verify offline behavior: online RPC cannot be claimed as locally cleared; queue requests by cheque UUID and reconcile on reconnect.
5. Implement end-to-end tests with two simultaneous RPC calls, offline stale PATCH, unrelated workspace, repeat request, FX rates, invalid account, and rollback.
6. No production migration, live finance posting or release until these tests pass.
