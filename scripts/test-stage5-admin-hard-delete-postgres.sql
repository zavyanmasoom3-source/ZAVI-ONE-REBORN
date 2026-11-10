\set ON_ERROR_STOP on
-- Isolated PostgreSQL 17: synthetic admin, unrelated user, and fake customer
-- ledger. No Supabase URL, real auth credentials or production financial rows.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
 LANGUAGE sql STABLE SET search_path TO ''
 AS $f$ SELECT NULLIF(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid $f$;
CREATE TABLE private.zavi_billing_admins(admin_uid uuid PRIMARY KEY);
CREATE TABLE private.zavi_admin_roles(user_id uuid PRIMARY KEY,role text NOT NULL);
CREATE TABLE public.zavi_workspaces(id uuid PRIMARY KEY,owner_uid uuid NOT NULL,name text NOT NULL);
CREATE TABLE public.zavi_fake_invoices(id text PRIMARY KEY,workspace_id uuid NOT NULL,amount numeric NOT NULL);
CREATE TABLE private.zavi_archives(workspace_id uuid PRIMARY KEY,archived boolean NOT NULL,actor_uid uuid NOT NULL);
CREATE TABLE private.zavi_archive_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,workspace_id uuid,action text NOT NULL);
INSERT INTO private.zavi_billing_admins VALUES
 ('11111111-1111-4111-8111-111111111111');
INSERT INTO private.zavi_admin_roles VALUES
 ('11111111-1111-4111-8111-111111111111','owner');
INSERT INTO public.zavi_workspaces VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111','Owner workspace'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '22222222-2222-4222-8222-222222222222','Synthetic customer');
INSERT INTO public.zavi_fake_invoices VALUES
 ('INV-TEST-1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',250.00);

CREATE OR REPLACE FUNCTION private.zavi_is_billing_admin() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
 AS $f$ SELECT EXISTS(SELECT 1 FROM private.zavi_billing_admins
 WHERE admin_uid=(SELECT auth.uid())) $f$;

-- Mimic previously exposed dangerous APIs and their nested call.
CREATE OR REPLACE FUNCTION public.zavi_owner_delete_customer(p_workspace_id uuid,p_confirmation text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $f$
BEGIN
 DELETE FROM public.zavi_fake_invoices WHERE workspace_id=p_workspace_id;
 DELETE FROM public.zavi_workspaces WHERE id=p_workspace_id;
 RETURN true;
END $f$;
CREATE OR REPLACE FUNCTION public.zavi_owner_reset_customer_accounts(
 p_preview boolean DEFAULT true,p_confirmation text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $f$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.zavi_workspaces;
 IF COALESCE(p_preview,true) THEN
  RETURN pg_catalog.jsonb_build_object('customer_count',n,'completed',false);
 END IF;
 PERFORM public.zavi_owner_delete_customer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',p_confirmation);
 RETURN pg_catalog.jsonb_build_object('completed',true);
END $f$;

CREATE OR REPLACE FUNCTION public.zavi_admin_trash_customer(p_workspace_id uuid,p_reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $f$
BEGIN
 IF NOT private.zavi_is_billing_admin() THEN
  RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
 END IF;
 INSERT INTO private.zavi_archives VALUES(p_workspace_id,true,auth.uid())
 ON CONFLICT (workspace_id) DO UPDATE SET archived=true;
 INSERT INTO private.zavi_archive_events(workspace_id,action) VALUES(p_workspace_id,'trash');
 RETURN true;
END $f$;
CREATE OR REPLACE FUNCTION public.zavi_admin_restore_trash_customer(p_workspace_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $f$
BEGIN
 IF NOT private.zavi_is_billing_admin() THEN
  RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
 END IF;
 UPDATE private.zavi_archives SET archived=false,actor_uid=auth.uid()
 WHERE workspace_id=p_workspace_id;
 INSERT INTO private.zavi_archive_events(workspace_id,action) VALUES(p_workspace_id,'restore');
 RETURN true;
END $f$;
GRANT USAGE ON SCHEMA auth,public TO authenticated;
GRANT EXECUTE ON FUNCTION public.zavi_owner_delete_customer(uuid,text),
 public.zavi_owner_reset_customer_accounts(boolean,text),
 public.zavi_admin_trash_customer(uuid,text),
 public.zavi_admin_restore_trash_customer(uuid)
 TO authenticated;

\ir ../supabase/migrations/20261110_stage5_retire_permanent_customer_deletion.sql

-- Owner preview remains available; customer count excludes owner's workspace.
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
DO $test$
DECLARE j jsonb; check_result boolean;
BEGIN
 j:=public.zavi_owner_reset_customer_accounts(true,NULL);
 IF j->>'customer_count'<>'1' OR j->>'completed'<>'false'
    OR j->>'permanent_delete_enabled'<>'false' THEN
  RAISE EXCEPTION 'OWNER_PREVIEW_CONTRACT_CHANGED: %',j;
 END IF;
 IF pg_catalog.has_function_privilege('authenticated',
      'public.zavi_owner_delete_customer(uuid,text)','EXECUTE')
 THEN RAISE EXCEPTION 'DIRECT_HARD_DELETE_PRIVILEGE_REMAINS'; END IF;
 BEGIN
  PERFORM public.zavi_owner_delete_customer(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','DELETE CUSTOMER PERMANENTLY');
  RAISE EXCEPTION 'CLIENT_HARD_DELETE_SUCCEEDED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.zavi_owner_reset_customer_accounts(false,'DELETE ALL CUSTOMER ACCOUNTS');
  RAISE EXCEPTION 'BULK_PERMANENT_DELETE_SUCCEEDED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- Real module is server-side audited trash/restore, not physical DELETE.
 check_result:=public.zavi_admin_trash_customer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','two confirmations');
 IF NOT check_result THEN RAISE EXCEPTION 'TRASH_FAILED'; END IF;
 check_result:=public.zavi_admin_restore_trash_customer('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 IF NOT check_result THEN RAISE EXCEPTION 'RESTORE_FAILED'; END IF;
END $test$;
RESET ROLE;

-- SECURITY DEFINER callers can bypass ordinary grants. Ensure the function
-- body itself refuses permanently destructive actions.
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_owner_delete_customer(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','DELETE CUSTOMER PERMANENTLY');
  RAISE EXCEPTION 'NESTED_CALL_DESTROYED_DATA';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;

-- Completely unrelated signed-in user cannot read the private admin preview.
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '22222222-2222-4222-8222-222222222222',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_owner_reset_customer_accounts(true,NULL);
  RAISE EXCEPTION 'NORMAL_USER_ADMIN_PREVIEW_SUCCEEDED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.zavi_admin_trash_customer(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','unauthorized');
  RAISE EXCEPTION 'NORMAL_USER_TRASH_SUCCEEDED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

SELECT pg_catalog.set_config('request.jwt.claim.sub','',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_owner_reset_customer_accounts(true,NULL);
  RAISE EXCEPTION 'NO_TOKEN_ADMIN_PREVIEW_SUCCEEDED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

-- Both synthetic accounts, financial invoice, and permanent-delete history
-- remain present. Archive and restore do not affect the financial ledger.
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.zavi_workspaces)<>2 OR
    (SELECT count(*) FROM public.zavi_fake_invoices)<>1 OR
    (SELECT amount FROM public.zavi_fake_invoices WHERE id='INV-TEST-1')<>250.00
 THEN RAISE EXCEPTION 'FINANCIAL_LEDGER_CHANGED'; END IF;
 IF (SELECT count(*) FROM private.zavi_archive_events)<>2 OR
    (SELECT archived FROM private.zavi_archives WHERE workspace_id=
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') IS DISTINCT FROM false
 THEN RAISE EXCEPTION 'ARCHIVE_RESTORE_AUDIT_INCOMPLETE'; END IF;
 IF pg_catalog.has_function_privilege('anon',
  'public.zavi_owner_delete_customer(uuid,text)','EXECUTE') OR
 pg_catalog.has_function_privilege('anon',
  'public.zavi_owner_reset_customer_accounts(boolean,text)','EXECUTE')
 THEN RAISE EXCEPTION 'ANONYMOUS_CAN_CALL_DESTRUCTIVE_RPC'; END IF;
END $test$;
SELECT 'PASS: Stage 5 hard purge retired even via nested definer, private owner preview, audited reversible archive, financial rows intact' AS result;
