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
commit;
-- The database stores owner CONFIRMATION, not proof WhatsApp delivered a message.
-- No marketing broadcast API or automated send is enabled.
