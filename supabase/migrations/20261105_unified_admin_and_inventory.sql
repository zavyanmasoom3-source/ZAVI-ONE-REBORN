-- Applied to EU Supabase project on 2026-11-05. Original source scripts preserved.
-- Does not create old contacts table or modify registration_contacts RPC.
BEGIN;
-- ZAVI ONE v65.95 / ADMIN 1.4.41
-- ADDITIVE STAGED MIGRATION. Do not apply to live production before encrypted backup
-- and owner/nonowner QA. Does not modify existing ledgers or auth policies.
begin;
create schema if not exists private;
create table if not exists private.zavi_admin_communications_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.zavi_workspaces(id) on delete restrict,
  actor_uid uuid not null references auth.users(id) on delete restrict,
  channel text not null default 'whatsapp_manual'
    check (channel='whatsapp_manual'),
  template_key text not null
    check (template_key in ('welcome','expiry','expired','congrats7','congrats180',
      'congrats365','receipt','update','support','followup','security','thanks','marketing')),
  state text not null
    check (state in ('prepared','owner_confirmed_sent')),
  owner_note text not null default '' check (length(owner_note)<=250),
  occurred_at timestamptz not null default now()
);
create index if not exists zavi_admin_comms_workspace_time
  on private.zavi_admin_communications_log(workspace_id,occurred_at desc);
create index if not exists zavi_admin_comms_actor_time
  on private.zavi_admin_communications_log(actor_uid,occurred_at desc);
alter table private.zavi_admin_communications_log enable row level security;
revoke all on private.zavi_admin_communications_log from public,anon,authenticated;
-- No RLS policies: browser table access denied. Only owner-guarded RPC can use it.
create or replace function public.zavi_admin_message_mark_v6595(
  p_workspace_id uuid,
  p_template_key text,
  p_state text,
  p_note text default ''
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare out_id uuid; actor uuid;
begin
  actor:=auth.uid();
  if actor is null or not exists(
    select 1 from private.zavi_billing_admins a where a.admin_uid=actor
  ) then raise exception 'Central owner authorization required' using errcode='42501';end if;
  if not exists(select 1 from public.zavi_workspaces w where w.id=p_workspace_id) then
    raise exception 'Unknown store' using errcode='22023';end if;
  if p_template_key not in ('welcome','expiry','expired','congrats7','congrats180',
      'congrats365','receipt','update','support','followup','security','thanks','marketing') then
    raise exception 'Invalid template' using errcode='22023';end if;
  if p_state not in ('prepared','owner_confirmed_sent') then
    raise exception 'Invalid state' using errcode='22023';end if;
  if length(coalesce(p_note,''))>250 then
    raise exception 'Note too long' using errcode='22023';end if;
  insert into private.zavi_admin_communications_log(workspace_id,actor_uid,template_key,state,owner_note)
  values(p_workspace_id,actor,p_template_key,p_state,coalesce(p_note,''))
  returning id into out_id;
  return jsonb_build_object('id',out_id,'state',p_state,'recorded',true);
end $$;
revoke all on function public.zavi_admin_message_mark_v6595(uuid,text,text,text) from public,anon;
grant execute on function public.zavi_admin_message_mark_v6595(uuid,text,text,text) to authenticated;

create or replace function public.zavi_admin_message_history_v6595(
  p_limit integer default 70
) returns table(
 id uuid,workspace_id uuid,workspace_name text,template_key text,state text,
 owner_note text,occurred_at timestamptz
)
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not exists(
   select 1 from private.zavi_billing_admins a where a.admin_uid=auth.uid()
 ) then raise exception 'Central owner authorization required' using errcode='42501';end if;
 return query
 select l.id,l.workspace_id,w.name,l.template_key,l.state,l.owner_note,l.occurred_at
 from private.zavi_admin_communications_log l
 join public.zavi_workspaces w on w.id=l.workspace_id
 order by l.occurred_at desc
 limit greatest(1,least(coalesce(p_limit,70),200));
end $$;
revoke all on function public.zavi_admin_message_history_v6595(integer) from public,anon;
grant execute on function public.zavi_admin_message_history_v6595(integer) to authenticated;
-- ZAVI ONE staged migration. NOT applied to production.
-- Preconditions: verified restorable database backup, test on clone, RLS/tenant tests.
-- The existing zavi_warehouse_movements ledger is append-only for authenticated users.
-- Owner-only row access remains controlled by existing RLS policies.
BEGIN;
CREATE OR REPLACE FUNCTION public.zavi_warehouse_no_negative_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $func$
DECLARE
  v_source text;
  v_dest text;
  v_lock text;
  v_available numeric;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Warehouse movements must be append-only';
  END IF;
  -- Lock both affected stock buckets in consistent lexical order.
  -- Prevent two concurrent transfers from simultaneously spending the same stock.
  IF NEW.from_warehouse_id IS NOT NULL THEN
    v_source := NEW.workspace_id::text || ':' ||
                NEW.from_warehouse_id::text || ':' || NEW.product_ref;
  END IF;
  IF NEW.to_warehouse_id IS NOT NULL THEN
    v_dest := NEW.workspace_id::text || ':' ||
              NEW.to_warehouse_id::text || ':' || NEW.product_ref;
  END IF;
  FOR v_lock IN
    SELECT lock_key
    FROM (SELECT unnest(ARRAY[v_source,v_dest]) AS lock_key) AS keys
    WHERE lock_key IS NOT NULL
    ORDER BY lock_key
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_lock, 0));
  END LOOP;
  IF NEW.from_warehouse_id IS NOT NULL THEN
    SELECT coalesce(sum(
      CASE WHEN m.to_warehouse_id = NEW.from_warehouse_id THEN m.quantity
           WHEN m.from_warehouse_id = NEW.from_warehouse_id THEN -m.quantity
           ELSE 0 END
    ), 0)
    INTO v_available
    FROM public.zavi_warehouse_movements AS m
    WHERE m.workspace_id = NEW.workspace_id
      AND m.product_ref = NEW.product_ref
      AND (m.from_warehouse_id = NEW.from_warehouse_id
           OR m.to_warehouse_id = NEW.from_warehouse_id);
    IF v_available < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient warehouse stock: available %, requested %',
          v_available, NEW.quantity USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;
REVOKE ALL ON FUNCTION public.zavi_warehouse_no_negative_guard() FROM PUBLIC;
DO $guard_trigger$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname='zavi_warehouse_before_movement_guard' AND tgrelid='public.zavi_warehouse_movements'::regclass AND NOT tgisinternal) THEN CREATE TRIGGER zavi_warehouse_before_movement_guard BEFORE INSERT ON public.zavi_warehouse_movements FOR EACH ROW EXECUTE FUNCTION public.zavi_warehouse_no_negative_guard(); END IF; END $guard_trigger$;
-- ZAVI ONE staged warehouse permissions and idempotent posting. NOT APPLIED.
-- Prerequisite: clone of current production, tested backup/restore, and first apply
-- 20261103_zavi_warehouse_no_negative_guard.sql. Run pgTAP under owner, viewer,
-- anonymous, and two concurrent owners of different workspaces.
BEGIN;

-- RLS does not protect TRUNCATE. Prevent user-issued table wiping and trigger changes.
REVOKE ALL ON TABLE public.zavi_warehouses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.zavi_warehouses TO authenticated;
REVOKE ALL ON TABLE public.zavi_warehouse_movements FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.zavi_warehouse_movements TO authenticated;

CREATE OR REPLACE FUNCTION public.zavi_warehouse_post_movement(
  p_operation_id uuid,
  p_workspace_id uuid,
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_product_ref text,
  p_quantity numeric,
  p_reference text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  existing public.zavi_warehouse_movements%ROWTYPE;
  result_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_operation_id IS NULL OR p_workspace_id IS NULL THEN RAISE EXCEPTION 'Missing operation or workspace'; END IF;
  IF p_product_ref IS NULL OR length(btrim(p_product_ref)) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'Invalid product reference';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 999999999999
    OR p_quantity::text IN ('NaN', 'Infinity', '-Infinity') OR scale(p_quantity) > 4 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  IF p_from_warehouse_id IS NOT NULL AND p_to_warehouse_id IS NOT NULL AND p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Source and destination must be different';
  END IF;
  IF p_from_warehouse_id IS NULL AND p_to_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'At least one endpoint required';
  END IF;
  IF p_reference IS NOT NULL AND length(p_reference) > 150 THEN RAISE EXCEPTION 'Reference too long'; END IF;
  -- Serialize retries sharing an operation UUID BEFORE the nonnegative trigger.
  -- A BEFORE INSERT guard would otherwise reject a duplicate stock withdrawal
  -- after the first successful operation had depleted the source warehouse.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('zavi-warehouse-operation:' || p_operation_id::text, 0));
  SELECT * INTO existing FROM public.zavi_warehouse_movements WHERE id=p_operation_id;
  IF FOUND THEN
    IF existing.workspace_id IS DISTINCT FROM p_workspace_id
      OR existing.from_warehouse_id IS DISTINCT FROM p_from_warehouse_id
      OR existing.to_warehouse_id IS DISTINCT FROM p_to_warehouse_id
      OR existing.product_ref IS DISTINCT FROM p_product_ref
      OR existing.quantity IS DISTINCT FROM p_quantity
      OR existing.reference IS DISTINCT FROM p_reference
      OR existing.created_by IS DISTINCT FROM auth.uid()
    THEN RAISE EXCEPTION 'Operation ID already used with different data'; END IF;
    -- Existing row is subject to RLS and was created by this same authenticated user.
    RETURN existing.id;
  END IF;
  -- Only the real workspace owner; product must exist in the authoritative
  -- cloud payload, so the stock table cannot invent a phantom product.
  IF NOT EXISTS (
    SELECT 1 FROM public.zavi_workspaces w
    WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid()
      AND EXISTS(
        SELECT 1 FROM pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(w.payload->'products')='array'
          THEN w.payload->'products' ELSE '[]'::jsonb END
        ) AS product(item) WHERE product.item->>'id'=p_product_ref
      )
  ) THEN RAISE EXCEPTION 'Workspace or product unauthorized'; END IF;
  IF p_from_warehouse_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.zavi_warehouses
     WHERE id=p_from_warehouse_id AND workspace_id=p_workspace_id AND is_active=true
  ) THEN RAISE EXCEPTION 'Source warehouse unavailable'; END IF;
  IF p_to_warehouse_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.zavi_warehouses
     WHERE id=p_to_warehouse_id AND workspace_id=p_workspace_id AND is_active=true
  ) THEN RAISE EXCEPTION 'Destination warehouse unavailable'; END IF;

  -- Stable UUID supplied by the offline sync queue ensures safe retries.
  -- The first migration's trigger enforces non-negative stock under advisory locks.
  INSERT INTO public.zavi_warehouse_movements
   (id,workspace_id,from_warehouse_id,to_warehouse_id,product_ref,quantity,reference,created_by)
  VALUES
   (p_operation_id,p_workspace_id,p_from_warehouse_id,p_to_warehouse_id,p_product_ref,p_quantity,p_reference,auth.uid())
  ON CONFLICT (id) DO NOTHING RETURNING id INTO result_id;
  IF result_id IS NOT NULL THEN RETURN result_id; END IF;
  SELECT * INTO existing FROM public.zavi_warehouse_movements WHERE id=p_operation_id;
  IF NOT FOUND
    OR existing.workspace_id IS DISTINCT FROM p_workspace_id
    OR existing.from_warehouse_id IS DISTINCT FROM p_from_warehouse_id
    OR existing.to_warehouse_id IS DISTINCT FROM p_to_warehouse_id
    OR existing.product_ref IS DISTINCT FROM p_product_ref
    OR existing.quantity IS DISTINCT FROM p_quantity
    OR existing.reference IS DISTINCT FROM p_reference
    OR existing.created_by IS DISTINCT FROM auth.uid()
  THEN RAISE EXCEPTION 'Operation ID already used with different data'; END IF;
  RETURN existing.id;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.zavi_warehouse_post_movement(uuid,uuid,uuid,uuid,text,numeric,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zavi_warehouse_post_movement(uuid,uuid,uuid,uuid,text,numeric,text)
  TO authenticated;
COMMIT;
