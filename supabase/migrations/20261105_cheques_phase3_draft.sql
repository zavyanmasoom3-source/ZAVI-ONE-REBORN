-- REVIEWED AGAINST LIVE WORKSPACE SCHEMA. STILL DRAFT, NOT PRODUCTION SAFE.
-- Owner-only access is deliberate: colleague cheque permissions not yet designed.
-- Phase 3: cheque registry schema (NOT applied automatically).
-- Run only after verifying auth ownership model and testing in staging.
create table if not exists public.zavi_cheques (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.zavi_workspaces(id) on delete cascade,
 direction text not null check(direction in ('received','issued')),
 cheque_number text not null,
 bank_name text not null,
 counterparty_id text,
 counterparty_name text not null,
 currency text not null check (currency in ('AFN','USD','PKR','IRR','EUR','CNY')),
 amount numeric(20,4) not null check (amount > 0),
 issue_date date not null,
 due_date date not null,
 status text not null default 'pending' check(status in ('pending','deposited','cleared','bounced','cancelled')),
 cleared_at timestamptz,
 linked_transaction_id text,
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint cheque_clear_consistency check(status <> 'cleared' or cleared_at is not null),
 constraint cheque_unique_per_workspace unique(workspace_id,direction,bank_name,cheque_number)
);
alter table public.zavi_cheques enable row level security;
create policy "cheques_select_own" on public.zavi_cheques for select to authenticated using (exists(select 1 from public.zavi_workspaces w where w.id=workspace_id and w.owner_uid=(select auth.uid())));
create policy "cheques_insert_own" on public.zavi_cheques for insert to authenticated with check (exists(select 1 from public.zavi_workspaces w where w.id=workspace_id and w.owner_uid=(select auth.uid())) and status='pending' and linked_transaction_id is null);
create policy "cheques_update_own" on public.zavi_cheques for update to authenticated using (exists(select 1 from public.zavi_workspaces w where w.id=workspace_id and w.owner_uid=(select auth.uid()))) with check (exists(select 1 from public.zavi_workspaces w where w.id=workspace_id and w.owner_uid=(select auth.uid())));
create index if not exists zavi_cheques_due_pending on public.zavi_cheques(workspace_id,due_date) where status in ('pending','deposited');
create table if not exists public.zavi_cheque_events(
 id uuid primary key default gen_random_uuid(),
 cheque_id uuid not null references public.zavi_cheques(id) on delete cascade,
 workspace_id uuid not null references public.zavi_workspaces(id) on delete cascade,
 old_status text,
 new_status text not null,
 note text not null default '',
 occurred_at timestamptz not null default now()
);
alter table public.zavi_cheque_events enable row level security;
create policy "cheque_events_select_own" on public.zavi_cheque_events for select to authenticated using (exists(select 1 from public.zavi_workspaces w where w.id=workspace_id and w.owner_uid=(select auth.uid())));
-- No direct INSERT/UPDATE/DELETE policy on events: event writing requires a reviewed
-- server-side status transition function, so clients cannot forge audit history.
-- IMPORTANT: This schema is not connected to the existing accounting ledger.
-- Clearing a cheque MUST be implemented as one authorized, idempotent server-side
-- transaction that updates the cheque, writes an immutable event and posts the ledger
-- entry exactly once. Do not book money when a cheque is merely registered.
