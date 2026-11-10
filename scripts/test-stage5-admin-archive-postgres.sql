\set ON_ERROR_STOP on
-- Follows stage5 hard-delete synthetic fixture in SAME disposable PostgreSQL 17.
-- Mirrors archive RLS-protected server schema without importing any customer data.
CREATE TABLE private.zavi_customer_archives(
 workspace_id uuid PRIMARY KEY REFERENCES public.zavi_workspaces(id) ON DELETE RESTRICT,
 archived boolean NOT NULL DEFAULT true,
 reason text NOT NULL DEFAULT '',
 archived_at timestamptz,
 changed_at timestamptz NOT NULL DEFAULT now(),
 changed_by uuid
);
CREATE TABLE private.zavi_customer_admin_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 workspace_id uuid NOT NULL REFERENCES public.zavi_workspaces(id) ON DELETE RESTRICT,
 actor_uid uuid NOT NULL,
 action text NOT NULL CHECK (action IN ('archive','restore','pin_approved','pin_denied')),
 details text NOT NULL DEFAULT '',
 occurred_at timestamptz NOT NULL DEFAULT now()
);
-- Preflight expects legacy API present.
CREATE OR REPLACE FUNCTION public.zavi_admin_v24_archive(
 p_workspace_id uuid,p_archive boolean,p_reason text DEFAULT '')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $legacy$ BEGIN RETURN true; END $legacy$;
GRANT EXECUTE ON FUNCTION public.zavi_admin_v24_archive(uuid,boolean,text) TO authenticated;
\ir ../supabase/migrations/20261110_stage5_owner_only_recoverable_archive_rpc.sql

SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
DO $test$
BEGIN
 -- A central owner must never archive their own account, even via raw RPC.
 BEGIN
  PERFORM public.zavi_admin_v24_archive(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,'forged owner archive');
  RAISE EXCEPTION 'SELF_ARCHIVE_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- Actual client operations remain recoverable and produce one event each.
 IF public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,'owner confirmed') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'TRASH_REJECTED'; END IF;
 IF public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,'retry') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'REPLAY_REJECTED'; END IF;
 IF public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false,'restore confirmed') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'RESTORE_REJECTED'; END IF;
 IF public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false,'retry') IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'RESTORE_REPLAY_REJECTED'; END IF;
END $test$;
RESET ROLE;

-- Billing-admin membership alone does not grant central owner privileges.
INSERT INTO private.zavi_billing_admins VALUES
 ('33333333-3333-4333-8333-333333333333');
INSERT INTO private.zavi_admin_roles VALUES
 ('33333333-3333-4333-8333-333333333333','agent');
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '33333333-3333-4333-8333-333333333333',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,'agent attempt');
  RAISE EXCEPTION 'DELEGATED_BILLING_ADMIN_ESCALATED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '22222222-2222-4222-8222-222222222222',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,'unrelated user');
  RAISE EXCEPTION 'UNRELATED_USER_ARCHIVED_CUSTOMER';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SELECT pg_catalog.set_config('request.jwt.claim.sub','',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_admin_v24_archive(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,'no token');
  RAISE EXCEPTION 'NO_TOKEN_ARCHIVED_CUSTOMER';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

DO $test$
BEGIN
 IF (SELECT count(*) FROM private.zavi_customer_admin_events)<>2
 OR (SELECT archived FROM private.zavi_customer_archives WHERE workspace_id=
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'ARCHIVE_RESTORE_AUDIT_NOT_IDEMPOTENT'; END IF;
 IF (SELECT count(*) FROM private.zavi_customer_archives WHERE workspace_id=
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>0
 THEN RAISE EXCEPTION 'OWNER_WORKSPACE_ARCHIVED'; END IF;
 IF (SELECT count(*) FROM public.zavi_workspaces)<>2
 OR (SELECT count(*) FROM public.zavi_fake_invoices)<>1
 OR (SELECT amount FROM public.zavi_fake_invoices WHERE id='INV-TEST-1')<>250
 THEN RAISE EXCEPTION 'FINANCIAL_DATA_MUTATED_BY_ARCHIVE'; END IF;
 IF pg_catalog.has_function_privilege('anon',
  'public.zavi_admin_v24_archive(uuid,boolean,text)','EXECUTE')
 THEN RAISE EXCEPTION 'ANONYMOUS_ARCHIVE_PRIVILEGE'; END IF;
END $test$;
SELECT 'PASS: only central owner can reversibly trash/restore, account protection, idempotent audit, no customer invoice edits' AS result;
