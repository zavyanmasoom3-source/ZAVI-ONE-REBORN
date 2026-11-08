-- REVIEW REQUIRED. DO NOT DEPLOY UNTIL LEDGER SEMANTICS AND SYNC ARE TESTED.
-- Atomic cheque clearing proposal for the existing JSONB workspace ledger.
-- An RPC must lock the workspace row, verify ownership and cheque state,
-- and append a single uniquely identified ledger entry in the SAME transaction.
-- The existing app syncs the entire payload; a stale full-payload update can
-- overwrite an RPC-written entry. A revision-aware compare-and-swap protocol
-- in ALL writers is mandatory before enabling this RPC.
create or replace function private.zavi_cheque_clear_design(
  p_workspace_id uuid, p_cheque_id uuid, p_account_id text
) returns jsonb
language plpgsql security invoker
set search_path = ''
as $$
declare
 v_workspace public.zavi_workspaces%rowtype;
 v_cheque public.zavi_cheques%rowtype;
 v_entry_id text;
begin
 if (select auth.uid()) is null then raise exception 'authentication required'; end if;
 select * into v_workspace from public.zavi_workspaces
 where id=p_workspace_id and owner_uid=(select auth.uid()) for update;
 if not found then raise exception 'workspace not accessible'; end if;
 select * into v_cheque from public.zavi_cheques
 where id=p_cheque_id and workspace_id=p_workspace_id for update;
 if not found then raise exception 'cheque not accessible'; end if;
 if v_cheque.status='cleared' then
   return jsonb_build_object('status','already_cleared','transaction_id',v_cheque.linked_transaction_id);
 end if;
 if v_cheque.status not in ('pending','deposited') then
   raise exception 'invalid cheque status';
 end if;
 -- Deliberately no ledger mutation yet. A real implementation MUST verify
 -- currency conversion, account type, existing payment state, revision-aware
 -- cloud sync, and exact tx schema, then update ledger and cheque atomically.
 raise exception 'CHEQUE_CLEARING_DISABLED_UNTIL_LEDGER_INTEGRATION_VERIFIED';
end;
$$;
-- Do not GRANT EXECUTE. Function stays in the non-exposed private schema.
