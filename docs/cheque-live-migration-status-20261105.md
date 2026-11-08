# Live migration status — 2026-11-05

Supabase project: wbbmwfnmurpphwxesssx (referenced by apps/one/index.html).

Applied successfully via Supabase migration: zavi_cheque_registry_owner_only_v1.

Created:
- public.zavi_cheques: workspace-owned, owner SELECT/INSERT RLS, status constrained to pending for every row by check constraint.
- public.zavi_cheque_events: owner SELECT RLS, no client write policy.
- Index on pending due dates; uniqueness per workspace/direction/bank/cheque number.
- Explicit grants tightened after discovering broad default table grants: authenticated SELECT/INSERT on cheques, SELECT on events; no client UPDATE/DELETE; anon no privileges.

NOT DONE:
- Atomic clearing RPC is not deployed or enabled; the draft review functions in repo are deliberately disabled.
- No app forms wired, no Debug/Release build triggered, no device runtime QA.
- No cheque entries or ledger amounts were inserted or changed.
- Existing cloud.js revision CAS was inspected but not modified.
- The pending-only table constraint must be redesigned as part of a reviewed server-controlled transition migration before clearing is possible.

Do not label this as a finished cheque module or a finished APK release.
