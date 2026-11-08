-- DESIGN ONLY: atomic clearing protocol for the existing workspace snapshot ledger.
-- DO NOT APPLY before confirming journal semantics and account-currency handling.
-- CAS already exists in apps/one/cloud.js: PATCH workspace WHERE revision=oldRev.
-- RPC must bump revision so any stale offline client receives a conflict.
create or replace function private.zavi_cheque_clear_review(
 p_workspace_id uuid, p_cheque_id uuid, p_account_id text
) returns jsonb language plpgsql security invoker set search_path=''
as $$
declare
 w public.zavi_workspaces%rowtype;
 c public.zavi_cheques%rowtype;
 v_id text;
 v_tx jsonb;
 v_entry jsonb;
begin
 if (select auth.uid()) is null then raise exception 'authentication required'; end if;
 select * into w from public.zavi_workspaces
 where id=p_workspace_id and owner_uid=(select auth.uid()) for update;
 if not found then raise exception 'workspace not accessible'; end if;
 select * into c from public.zavi_cheques
 where id=p_cheque_id and workspace_id=p_workspace_id for update;
 if not found then raise exception 'cheque not accessible'; end if;
 if c.status='cleared' then
   return jsonb_build_object('status','already_cleared','transaction_id',c.linked_transaction_id,'revision',w.revision);
 end if;
 if c.status not in ('pending','deposited') then raise exception 'invalid status'; end if;
 if p_account_id is null or length(trim(p_account_id))=0 then raise exception 'account required'; end if;
 v_tx:=coalesce(w.payload->'tx','[]'::jsonb);
 if jsonb_typeof(v_tx)<>'array' then raise exception 'invalid ledger'; end if;
 v_id:='cheque:'||c.id::text;
 if exists(select 1 from jsonb_array_elements(v_tx) e where e->>'id'=v_id) then
   raise exception 'ledger already contains cheque entry: manual reconciliation required';
 end if;
 -- Transaction entry shape must be validated against actual cashBalances(),
 -- contact balance calculations, currency conversion, and account semantics.
 -- Fail closed until all consumers are verified.
 raise exception 'LEDGER_MAPPING_UNVERIFIED: no financial mutation performed';
end;
$$;
-- Non-exposed private schema. Never grant RPC execution while incomplete.
