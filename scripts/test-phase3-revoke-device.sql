-- Stage 3 owner-device revoke contract in disposable PostgreSQL 17.
-- No production SQL connection and no actual customer/financial records.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $f$ SELECT nullif(pg_catalog.current_setting('app.fixture_uid',true),'')::uuid $f$;

CREATE TABLE public.zavi_workspaces (
  id uuid PRIMARY KEY,
  owner_uid uuid NOT NULL
);
CREATE TABLE public.zavi_v26_devices (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  device_id text NOT NULL,
  status text NOT NULL,
  reported_pending_count integer,
  last_report_at timestamptz,
  last_sync_at timestamptz,
  revoked_at timestamptz
);
CREATE UNIQUE INDEX ON public.zavi_v26_devices(workspace_id,device_id);

\i supabase/migrations/20261109_phase3_device_revoke_sync_guard.sql

INSERT INTO public.zavi_workspaces VALUES
 ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000099');
SET LOCAL app.fixture_uid='00000000-0000-4000-8000-000000000099';
INSERT INTO public.zavi_v26_devices
 (id,workspace_id,device_id,status,reported_pending_count,last_report_at,last_sync_at)
VALUES
 ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000021',
 'valid','active',0,now()-interval '3 minutes',now()-interval '4 minutes'),
 ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000021',
 'unsent','active',4,now()-interval '3 minutes',now()-interval '4 minutes'),
 ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000021',
 'stale_sync','active',0,now()-interval '3 minutes',now()-interval '30 minutes'),
 ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000021',
 'stale_report','active',0,now()-interval '30 minutes',now()-interval '30 minutes'),
 ('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000021',
 'unknown_sync','active',0,now()-interval '3 minutes',null),
 ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000021',
 'future_sync','active',0,now()-interval '3 minutes',now()+interval '4 minutes'),
 ('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000021',
 'future_report','active',0,now()+interval '4 minutes',now()-interval '1 minute'),
 ('00000000-0000-4000-8000-000000000108','00000000-0000-4000-8000-000000000021',
 'unknown_count','active',null,now()-interval '3 minutes',now()-interval '4 minutes');

DO $qa$
DECLARE
 target_name text;
 status_after text;
BEGIN
 FOR target_name IN SELECT unnest(ARRAY[
   'unsent','stale_sync','stale_report','unknown_sync',
   'future_sync','future_report','unknown_count'
 ]) LOOP
   BEGIN
     PERFORM public.zavi_v652_owner_revoke_device(
       '00000000-0000-4000-8000-000000000021'::uuid,target_name);
     RAISE EXCEPTION 'Unexpected success for %', target_name USING ERRCODE='ZZ001';
   EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
   END;
   SELECT status INTO status_after FROM public.zavi_v26_devices
     WHERE device_id=target_name;
   IF status_after <> 'active' THEN
     RAISE EXCEPTION 'Safety test changed the blocked device: %',target_name;
   END IF;
 END LOOP;
END
$qa$;

DO $qa$
DECLARE r jsonb;
BEGIN
 r:=public.zavi_v652_owner_revoke_device(
  '00000000-0000-4000-8000-000000000021'::uuid,'valid');
 IF r->>'revoked_device_id'<>'valid' OR
   NOT EXISTS(SELECT 1 FROM public.zavi_v26_devices
     WHERE device_id='valid' AND status='revoked' AND revoked_at IS NOT NULL) THEN
   RAISE EXCEPTION 'Fresh synced device should be revocable';
 END IF;
 r:=public.zavi_v652_owner_revoke_device(
  '00000000-0000-4000-8000-000000000021'::uuid,'valid');
 IF r->>'already_revoked'<>'true' THEN
   RAISE EXCEPTION 'Idempotent revoked device response failed';
 END IF;
END
$qa$;

SET LOCAL app.fixture_uid='00000000-0000-4000-8000-000000000098';
DO $qa$
BEGIN
 BEGIN
  PERFORM public.zavi_v652_owner_revoke_device(
   '00000000-0000-4000-8000-000000000021'::uuid,'stale_sync');
  RAISE EXCEPTION 'Foreign account unexpectedly revoked a device' USING ERRCODE='ZZ001';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;
END
$qa$;

ROLLBACK;
\echo 'PASS: Stage 3 revoke requires owner, zero pending, fresh proven sync; idempotent'
