\set ON_ERROR_STOP on
-- Synthetic PostgreSQL 17 only. No live tokens, customers or monetary data.
DO $roles$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
   CREATE ROLE anon NOLOGIN;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
   CREATE ROLE authenticated NOLOGIN;
 END IF;
END $roles$;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
SET search_path TO '' AS $q$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$q$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

CREATE TABLE public.zavi_workspaces (
 id uuid PRIMARY KEY,
 owner_uid uuid NOT NULL
);
CREATE TABLE public.zavi_v26_devices (
 id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 workspace_id uuid NOT NULL,
 device_id text NOT NULL,
 status text NOT NULL,
 revoked_at timestamptz,
 registered_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.zavi_v26_sync_operations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL,
 operation_id uuid NOT NULL,
 device_id text NOT NULL,
 operation_type text NOT NULL,
 entity_type text NOT NULL,
 entity_id text,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 received_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,operation_id)
);
CREATE TABLE private.zavi_subscription_test_state(
 workspace_id uuid PRIMARY KEY,
 active boolean NOT NULL,
 archived boolean NOT NULL
);
CREATE OR REPLACE FUNCTION private.zavi_subscription_is_active(p_workspace uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $q$
 SELECT coalesce((SELECT active AND NOT archived
    FROM private.zavi_subscription_test_state
    WHERE workspace_id=p_workspace),false)
$q$;

INSERT INTO public.zavi_workspaces VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 '22222222-2222-4222-8222-222222222222');
INSERT INTO public.zavi_v26_devices(workspace_id,device_id,status) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A','active'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-OLD-B','revoked');
INSERT INTO private.zavi_subscription_test_state VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,false),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,false);

-- Original legacy function signature exists; the migration replaces its body.
CREATE OR REPLACE FUNCTION public.zavi_v28_receive_sync_operation(
 p_workspace_id uuid,p_operation_id uuid,p_device_id text,p_operation_type text,
 p_entity_type text,p_entity_id text,p_payload jsonb,p_created_at timestamptz DEFAULT NULL)
RETURNS TABLE(operation_id uuid,sync_status text,server_received_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $q$ SELECT p_operation_id,'UNSAFE_OLD_FUNCTION'::text,now() $q$;

\ir ../supabase/migrations/20261110_stage7_sync_operation_device_entitlement_guard.sql
GRANT USAGE ON SCHEMA public TO authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
DO $test$
DECLARE v text;
BEGIN
 SELECT sync_status INTO v FROM public.zavi_v28_receive_sync_operation(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '00000000-0000-4000-8000-000000000001',
 'QA-PRIMARY-A','sale','invoice','INV-QA', '{"amount":100,"currency":"AFN"}',now());
 IF v<>'received' THEN RAISE EXCEPTION 'VALID_PRIMARY_OWNER_OPERATION_REJECTED'; END IF;
 SELECT sync_status INTO v FROM public.zavi_v28_receive_sync_operation(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '00000000-0000-4000-8000-000000000001',
 'QA-PRIMARY-A','sale','invoice','INV-QA', '{"currency":"AFN","amount":100}',now());
 IF v<>'already_received' THEN RAISE EXCEPTION 'DROPPED_ACK_REPLAY_NOT_IDEMPOTENT'; END IF;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000001',
   'QA-PRIMARY-A','sale','invoice','INV-QA','{"amount":200}',now());
  RAISE EXCEPTION 'OP_ID_REUSE_WITH_CHANGED_MONEY_ACCEPTED';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000002',
   'QA-OLD-B','purchase','invoice','BUY-QA','{"paid":10}',now());
  RAISE EXCEPTION 'REVOKED_DEVICE_UPLOADED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '00000000-0000-4000-8000-000000000003',
   'QA-PRIMARY-A','sale','invoice','OTHER','{"paid":1}',now());
  RAISE EXCEPTION 'CROSS_TENANT_FINANCIAL_OPERATION_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000004',
   'QA-PRIMARY-A','sale','invoice','BAD','[]',now());
  RAISE EXCEPTION 'ARRAY_PAYLOAD_ACCEPTED';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000005',
   'QA-PRIMARY-A','sale','invoice','FUTURE','{"paid":1}',now()+interval '1 day');
  RAISE EXCEPTION 'FUTURE_TIMESTAMP_ACCEPTED';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $test$;
RESET ROLE;

UPDATE public.zavi_v26_devices SET revoked_at=now(),status='revoked'
 WHERE device_id='QA-PRIMARY-A';
SET ROLE authenticated;
DO $test$
DECLARE v text;
BEGIN
 -- An already-accepted operation can be acknowledged after revocation,
 -- but the same device cannot queue a new financial operation.
 SELECT sync_status INTO v FROM public.zavi_v28_receive_sync_operation(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '00000000-0000-4000-8000-000000000001',
 'QA-PRIMARY-A','sale','invoice','INV-QA', '{"amount":100,"currency":"AFN"}',now());
 IF v<>'already_received' THEN RAISE EXCEPTION 'DROPPED_ACK_AFTER_REVOCATION_LOST'; END IF;
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000006',
   'QA-PRIMARY-A','sale','invoice','NEW','{"amount":7}',now());
  RAISE EXCEPTION 'REVOKED_PRIMARY_NEW_OPERATION_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

UPDATE public.zavi_v26_devices SET revoked_at=NULL,status='active'
 WHERE device_id='QA-PRIMARY-A';
UPDATE private.zavi_subscription_test_state SET active=false
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000007',
   'QA-PRIMARY-A','sale','invoice','EXPIRED','{"amount":8}',now());
  RAISE EXCEPTION 'EXPIRED_SUBSCRIPTION_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
UPDATE private.zavi_subscription_test_state SET active=true,archived=true
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000008',
   'QA-PRIMARY-A','sale','invoice','ARCHIVED','{"amount":8}',now());
  RAISE EXCEPTION 'ARCHIVED_CUSTOMER_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_v28_receive_sync_operation(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '00000000-0000-4000-8000-000000000009',
   'QA-PRIMARY-A','sale','invoice','NO-SESSION','{"amount":8}',now());
  RAISE EXCEPTION 'NO_AUTH_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

DO $test$
BEGIN
 IF (SELECT count(*) FROM public.zavi_v26_sync_operations)<>1
 THEN RAISE EXCEPTION 'DUPLICATED_FINANCIAL_OPERATION'; END IF;
 IF has_function_privilege('anon',
   'public.zavi_v28_receive_sync_operation(uuid,uuid,text,text,text,text,jsonb,timestamptz)','EXECUTE')
 THEN RAISE EXCEPTION 'ANONYMOUS_CAN_SUBMIT_SYNCS'; END IF;
 IF NOT (pg_get_functiondef(
   'public.zavi_v28_receive_sync_operation(uuid,uuid,text,text,text,text,jsonb,timestamptz)'::regprocedure)
    LIKE '%private.zavi_subscription_is_active%')
 THEN RAISE EXCEPTION 'CANONICAL_SUBSCRIPTION_CHECK_MISSING'; END IF;
END $test$;
SELECT 'PASS: owner-only, active device, current subscription, archived, idempotent replay and no duplicate operations' AS result;
