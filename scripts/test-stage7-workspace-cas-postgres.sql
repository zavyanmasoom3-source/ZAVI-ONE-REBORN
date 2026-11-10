\set ON_ERROR_STOP on
-- PostgreSQL 17 disposable fixture; includes previous Stage 7 owner/devices test.
\ir test-stage7-sync-operation-postgres.sql

-- Adapt the earlier synthetic schema to the exact workspace fields used by
-- the production CAS API. No customer data or remote account is accessed.
ALTER TABLE public.zavi_workspaces
 ADD COLUMN name text NOT NULL DEFAULT 'QA original',
 ADD COLUMN payload jsonb NOT NULL DEFAULT '{"tx":[],"products":[],"contacts":[],"accounts":[]}',
 ADD COLUMN revision bigint NOT NULL DEFAULT 10,
 ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

UPDATE private.zavi_subscription_test_state
 SET active=true,archived=false
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
UPDATE public.zavi_v26_devices
 SET status='active',revoked_at=NULL
 WHERE device_id='QA-PRIMARY-A';
\ir ../supabase/migrations/20261110_stage7_server_cas_device_guard.sql

-- Grant usage and authenticate a *synthetic* owner.
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
DO $test$
DECLARE r record; n integer;
BEGIN
 SELECT * INTO r FROM public.zavi_stage7_workspace_cas(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'QA-PRIMARY-A',10,
  '{"tx":[{"id":"QA-SALE","paid":10.25}],"products":[{"id":"P"}],"contacts":[],"accounts":[]}',
  'QA renamed shop');
 IF NOT FOUND OR r.revision<>11 OR r.name<>'QA renamed shop'
 THEN RAISE EXCEPTION 'OWNER_VALID_CAS_REJECTED'; END IF;

 -- Same old revision with new amount MUST fail without a second mutation.
 SELECT count(*) INTO n FROM public.zavi_stage7_workspace_cas(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'QA-PRIMARY-A',10,
  '{"tx":[{"id":"QA-SALE","paid":9999}],"products":[],"contacts":[],"accounts":[]}',NULL);
 IF n<>0 THEN RAISE EXCEPTION 'STAGE7_STALE_REVISION_OVERWRITE'; END IF;
 -- Foreign owner's workspace must fail even with an active local device id.
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','QA-PRIMARY-A',10,
    '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'CROSS_TENANT_UPDATE_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- A fake/unregistered device cannot initiate a new financial CAS.
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-UNREGISTERED',11,
    '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'FAKE_DEVICE_UPLOAD_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- Missing tx/product/contact/account structure must be rejected.
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[]}',NULL);
  RAISE EXCEPTION 'INCOMPLETE_ACCOUNTING_SNAPSHOT_ACCEPTED';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 -- Fake rename cannot update owner identity or modify extra columns.
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',
   repeat('X',66));
  RAISE EXCEPTION 'INVALID_RENAME_ACCEPTED';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $test$;
RESET ROLE;
DO $test$
DECLARE v jsonb; n bigint;
BEGIN
 SELECT payload,revision INTO v,n FROM public.zavi_workspaces
  WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF n<>11 OR v->'tx'->0->>'id'<>'QA-SALE'
 THEN RAISE EXCEPTION 'STALE_CAS_CHANGED_FINANCIAL_DATA'; END IF;
END $test$;

-- Registration is revoked server-side; old JWT must not post a new CAS.
UPDATE public.zavi_v26_devices SET status='revoked',revoked_at=now()
 WHERE device_id='QA-PRIMARY-A';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'REVOKED_DEVICE_CAS_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

-- Expired subscriptions and archived accounts each deny a previously active device.
UPDATE public.zavi_v26_devices SET status='active',revoked_at=NULL
 WHERE device_id='QA-PRIMARY-A';
UPDATE private.zavi_subscription_test_state SET active=false
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'EXPIRED_ACCOUNT_CAS_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
UPDATE private.zavi_subscription_test_state SET active=true,archived=true
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'ARCHIVED_ACCOUNT_CAS_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',11,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'UNAUTHENTICATED_CAS_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
DO $test$
BEGIN
 IF has_function_privilege('anon',
 'public.zavi_stage7_workspace_cas(uuid,text,bigint,jsonb,text)','EXECUTE')
 THEN RAISE EXCEPTION 'ANON_CAS_RPC_EXPOSED'; END IF;
 IF (SELECT revision FROM public.zavi_workspaces WHERE
 id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>11
 THEN RAISE EXCEPTION 'UNAUTHORIZED_WRITE_CHANGED_VERSION'; END IF;
END $test$;
SELECT 'PASS Stage7 RPC owner, current subscription/device, no-token, stale-CAS, no money-loss and role grants' AS result;
