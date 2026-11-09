# ZAVI ONE / ADMIN — In-transit phase 1, evidence and release gate
Date: 2026-11-09 · Branch: dev · Baseline SHA: db18dd0b49d4a0df822a55cf13c1786d6089603f

## Scope changed
- apps/one/zavi-in-transit-v1.js — authenticated owner cloud order creation and partial receipt; existing backend RPCs, durable operation UUID pending queue, fail-closed UI overreceipt.
- apps/one/zavi-in-transit-v1.css — scoped layout (Dari, Pashto, English).
- apps/one/index.html — load isolated assets, no removal of legacy routes/forms.
- apps/one/sw.js — static assets only; no customer API cache.
- scripts/test-in-transit-contract.cjs — synthetic input and decimal validation.
- scripts/test-in-transit-browser.py — real Chrome purchase route, owner gate, synthetic mock server, partial receipt, overreceipt rejection, dropped-ACK same-UUID retry, old stock unchanged; two actual UI screenshots.
- supabase/staged/20261109_in_transit_receipt_guard_CANDIDATE.sql — additive DB-side guard proposed; NOT APPLIED to production.
- scripts/test-in-transit-guard.sql — synthetic fixture + PostgreSQL 17 proposed trigger checks.
- .github/workflows/transit-contract-qa.yml — Node, Chrome and ephemeral PostgreSQL jobs.

## Confirmed CI evidence
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42578074959
  - Both jobs passed: Node syntax and contracts, real Chromium UI with simulated backend, static shell, disposable PostgreSQL 17 guard.
  - Chrome artifact ZAVI-IN-TRANSIT-CHROME-QA includes order-partial-receipt.png, order-received-after-dropped-ack.png, and result.json.
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42577900796
  - Nine PASS PG lines: no stock on order; 2/3 received; excess rejected; rollback failed movement; unmatched movement rejected; 3/3 complete; closed order denied; wrong actor denied; rejected operations preserve stock.
- https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42578074867
  - Migration integrity gate passed.

## Read-only production inspection
The configured primary project is wbbmwfnmurpphwxesssx. RLS enabled on core in-transit orders, lines, receipts, events. Actual current functions zavi_v671_create_in_transit, zavi_v671_receive_in_transit, zavi_v6721_update_in_transit and private receipt/order/line triggers were inspected. Existing receipt RPC obtains order and line FOR UPDATE, then writes movement, receipt, quantity and event within one transaction. This is a source inspection, NOT a staging transaction test.

CRITICAL: Existing v671 receive RPC can insert over-received quantity into warehouse stock and mark the discrepancy. Existing CHECK constraints do not enforce received_qty <= ordered_qty. The candidate ADDITIVE guard blocks overreceipt/unmatched movements on an isolated simplified PostgreSQL fixture. **It has not been applied, and has NOT passed tests against a restored clone of the actual Supabase schema**. Never describe current live database as fully protected.

## Acceptance gates still OPEN
1. Restore verified encrypted backup into designated isolated staging; deploy and verify candidate alongside existing private triggers, RLS and production-schema constraints.
2. Exercise actual RPCs as owner, viewer, cross-tenant, anon, with concurrent receipts, collisions, dropped acknowledgements and offline replay.
3. Audit shortages, excess arrivals and discrepancies via approvals/stock adjustments before saleability. Candidate intentionally blocks unapproved extra arrivals.
4. Purchase returns need single ACID transaction linking physically received warehouse stock, returned quantity, supplier payable/credit and refund; test double-return and full rollback. Existing local purchase_return is NOT integrated with in-transit server ledger.
5. Reconcile server warehouse stock with legacy local sale stock checks without duplicating inventory. Currently server receipts do not automatically authorize legacy sales.
6. Physical Android owner/cloud/network/receipt/retry tests are outstanding. Browser screenshots are not device test evidence.

## Safety and release
No production customer ledger was modified in these tests. CI PostgreSQL is ephemeral, with synthetic records. No signed Release APKs or Windows Installer Release delivered. Android full QA gates require persistent signing credentials and intentionally fail without them. Phase 1 NOT complete; do not claim later stages or release certification.
