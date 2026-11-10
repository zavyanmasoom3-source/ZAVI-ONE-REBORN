-- Isolated PostgreSQL 17 safety contract: no live data or credentials.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$
 SELECT nullif(current_setting('app.qa_uid',true),'')::uuid $f$;
CREATE FUNCTION private.zavi_subscription_is_active(uuid) RETURNS boolean
 LANGUAGE sql AS $f$ SELECT true $f$;
CREATE FUNCTION private.zavi_is_billing_admin() RETURNS boolean
 LANGUAGE sql AS $f$ SELECT current_setting('app.qa_admin',true)='yes' $f$;
CREATE TABLE public.zavi_workspaces (id uuid PRIMARY KEY,owner_uid uuid);
CREATE TABLE public.zavi_v26_devices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL,
 device_id text NOT NULL,device_name text,status text NOT NULL,
 reported_pending_count integer,last_report_at timestamptz,last_sync_at timestamptz,
 last_seen_at timestamptz,revoked_at timestamptz,
 registered_at timestamptz DEFAULT now(),UNIQUE(workspace_id,device_id)
);
CREATE UNIQUE INDEX qa_one_active ON public.zavi_v26_devices(workspace_id)
 WHERE status='active';
CREATE TABLE private.zavi_v41_device_transfer_audit
 (workspace_id uuid,actor_uid uuid,previous_device_id text,current_device_id text);
\i supabase/migrations/20261110_phase3_legacy_device_transfer_guard.sql
INSERT INTO public.zavi_workspaces VALUES
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000099'),
 ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000099');
SET LOCAL app.qa_uid='00000000-0000-4000-8000-000000000099';
INSERT INTO public.zavi_v26_devices
 (workspace_id,device_id,status,reported_pending_count,last_report_at,last_sync_at)
VALUES
 ('00000000-0000-4000-8000-000000000101','owner-previous-0000001','active',4,now()-interval '2m',now()-interval '3m'),
 ('00000000-0000-4000-8000-000000000102','admin-previous-0000001','active',4,now()-interval '2m',now()-interval '3m');
DO $qa$
BEGIN
 BEGIN
  PERFORM public.zavi_v41_owner_replace_device(
   '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Pending');
  RAISE EXCEPTION 'Legacy owner bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
 UPDATE public.zavi_v26_devices SET reported_pending_count=0,last_sync_at=NULL
  WHERE device_id='owner-previous-0000001';
 BEGIN
  PERFORM public.zavi_v41_owner_replace_device(
   '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Missing');
  RAISE EXCEPTION 'Missing sync bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
 UPDATE public.zavi_v26_devices SET last_sync_at=now()-interval '40m'
  WHERE device_id='owner-previous-0000001';
 BEGIN
  PERFORM public.zavi_v41_owner_replace_device(
   '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Stale');
  RAISE EXCEPTION 'Stale sync bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
 UPDATE public.zavi_v26_devices SET last_sync_at=now()-interval '3m',
  last_report_at=now()+interval '4m'
  WHERE device_id='owner-previous-0000001';
 BEGIN
  PERFORM public.zavi_v41_owner_replace_device(
   '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Future');
  RAISE EXCEPTION 'Future report bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
END $qa$;
SET LOCAL app.qa_uid='00000000-0000-4000-8000-000000000098';
DO $qa$
BEGIN
 BEGIN
  PERFORM public.zavi_v41_owner_replace_device(
   '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Wrong');
  RAISE EXCEPTION 'Wrong owner accepted' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $qa$;
SET LOCAL app.qa_uid='00000000-0000-4000-8000-000000000099';
UPDATE public.zavi_v26_devices SET last_report_at=now()-interval '2m',
 last_sync_at=now()-interval '3m'
 WHERE device_id='owner-previous-0000001';
DO $qa$
BEGIN
 IF public.zavi_v41_owner_replace_device(
  '00000000-0000-4000-8000-000000000101','owner-new-000000000001','Safe')
  <>'DEVICE_REPLACED' THEN RAISE EXCEPTION 'Owner safe transfer failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM private.zavi_v41_device_transfer_audit
  WHERE previous_device_id='owner-previous-0000001') THEN
  RAISE EXCEPTION 'Legacy audit missing'; END IF;
END $qa$;
SET LOCAL app.qa_admin='yes';
DO $qa$
BEGIN
 BEGIN
  PERFORM public.zavi_admin_replace_device(
   '00000000-0000-4000-8000-000000000102','admin-new-000000000001','Pending');
  RAISE EXCEPTION 'ADMIN pending bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
 UPDATE public.zavi_v26_devices SET reported_pending_count=0,last_sync_at=NULL
  WHERE device_id='admin-previous-0000001';
 BEGIN
  PERFORM public.zavi_admin_replace_device(
   '00000000-0000-4000-8000-000000000102','admin-new-000000000001','Missing');
  RAISE EXCEPTION 'ADMIN missing sync bypass' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '55000' THEN NULL; END;
 UPDATE public.zavi_v26_devices SET last_sync_at=now()-interval '3m'
  WHERE device_id='admin-previous-0000001';
END $qa$;
SET LOCAL app.qa_admin='no';
DO $qa$
BEGIN
 BEGIN
  PERFORM public.zavi_admin_replace_device(
   '00000000-0000-4000-8000-000000000102','admin-new-000000000001','Wrong');
  RAISE EXCEPTION 'Unprivileged ADMIN accepted' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $qa$;
SET LOCAL app.qa_admin='yes';
DO $qa$
BEGIN
 IF NOT public.zavi_admin_replace_device(
  '00000000-0000-4000-8000-000000000102','admin-new-000000000001','Safe') THEN
  RAISE EXCEPTION 'ADMIN safe transfer failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.zavi_v26_devices
  WHERE device_id='admin-new-000000000001' AND status='active') THEN
  RAISE EXCEPTION 'Safe ADMIN activation missing'; END IF;
END $qa$;
ROLLBACK;
\echo 'PASS: owner and ADMIN legacy device transfers reject pending/stale/unknown/wrong-actor and permit verified transfer'
