\set ON_ERROR_STOP on
-- The disposable fixture installs the actual canonical CAS RPC, then models
-- the existing owner + subscription RLS policies. No production data.
\ir test-stage7-workspace-cas-postgres.sql

UPDATE private.zavi_subscription_test_state SET active=true,archived=false
 WHERE workspace_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
UPDATE public.zavi_v26_devices SET status='active',revoked_at=NULL
 WHERE device_id='QA-PRIMARY-A';

GRANT USAGE ON SCHEMA private TO authenticated;
ALTER TABLE public.zavi_workspaces ENABLE ROW LEVEL SECURITY;
GRANT SELECT,UPDATE ON public.zavi_workspaces TO authenticated;
CREATE POLICY qa_owner_select ON public.zavi_workspaces
 FOR SELECT TO authenticated
 USING (owner_uid=auth.uid());
CREATE POLICY qa_owner_update ON public.zavi_workspaces
 FOR UPDATE TO authenticated
 USING (owner_uid=auth.uid())
 WITH CHECK (owner_uid=auth.uid());
CREATE POLICY qa_subscription_update ON public.zavi_workspaces
 AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (private.zavi_subscription_is_active(id))
 WITH CHECK (private.zavi_subscription_is_active(id));

\ir ../supabase/migrations/20261110_stage7_progressive_legacy_write_cutover.sql

-- Before enrollment, normal historical SDK PATCH still works. This proves
-- the schema deployment alone does not strand un-upgraded installations.
SELECT set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
DO $test$
DECLARE n integer;
BEGIN
 UPDATE public.zavi_workspaces SET revision=12
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND revision=11;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'LEGACY_OLDER_APP_BROKEN_PRE_CUTOVER'; END IF;
END $test$;
RESET ROLE;

-- Only a separately certified, explicitly named workspace can be enrolled.
-- The real migration inserts no enrollment, the synthetic test simulates
-- post-signing owner acceptance using fabricated 40- and 64-byte digests.
INSERT INTO private.zavi_stage7_rpc_only_workspaces
 (workspace_id,approved_owner,signed_release_sha,verified_backup_digest)
VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  repeat('a',40),repeat('b',64));

SET ROLE authenticated;
DO $test$
DECLARE n integer; result record;
BEGIN
 -- Direct owner PATCH must fail for the one cut-over workspace.
 UPDATE public.zavi_workspaces
 SET revision=revision+1,payload=
  '{"tx":[],"products":[],"contacts":[],"accounts":[]}'
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'RAW_PATCH_BYPASSED_DEVICE_CHECK_POST_CUTOVER'; END IF;
 -- The already deployed RPC remains available for same tenant and active device.
 SELECT * INTO result FROM public.zavi_stage7_workspace_cas(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',12,
  '{"tx":[{"id":"QA-SALE","paid":10.25},{"id":"AFTER-CUTOVER"}],"products":[],"contacts":[],"accounts":[]}',
  NULL);
 IF NOT FOUND OR result.revision<>13
 THEN RAISE EXCEPTION 'SERVER_CAS_BROKEN_BY_RESTRICTIVE_RLS'; END IF;
END $test$;
RESET ROLE;

-- Server-side revocation must still block privileged CAS after cutover.
UPDATE public.zavi_v26_devices
 SET status='revoked',revoked_at=now() WHERE device_id='QA-PRIMARY-A';
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.zavi_stage7_workspace_cas(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','QA-PRIMARY-A',13,
   '{"tx":[],"products":[],"contacts":[],"accounts":[]}',NULL);
  RAISE EXCEPTION 'REVOKED_DEVICE_UPDATED_VIA_RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',
 '22222222-2222-4222-8222-222222222222',false);
SET ROLE authenticated;
DO $test$
DECLARE n integer;
BEGIN
 UPDATE public.zavi_workspaces SET revision=99
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'CROSS_TENANT_RAW_UPDATE_ALLOWED'; END IF;
END $test$;
RESET ROLE;

DO $test$
DECLARE d jsonb; n bigint;
BEGIN
 SELECT payload,revision INTO d,n
 FROM public.zavi_workspaces
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF n<>13 OR jsonb_array_length(d->'tx')<>2
 OR d->'tx'->0->>'id'<>'QA-SALE'
 THEN RAISE EXCEPTION 'FINANCIAL_HISTORY_LOST_DURING_CUTOVER'; END IF;
 IF (SELECT count(*) FROM private.zavi_stage7_rpc_only_workspaces)<>1
 THEN RAISE EXCEPTION 'CUTOVER_UNEXPECTED_OTHER_TENANT'; END IF;
 IF has_table_privilege('authenticated',
  'private.zavi_stage7_rpc_only_workspaces','INSERT')
 THEN RAISE EXCEPTION 'CLIENT_CAN_SELF_ENROLL_TO_BREAK_ACCOUNT'; END IF;
END $test$;
SELECT 'PASS: no legacy outage before per-workspace certified cutover, raw PATCH denied after, canonical CAS survives and financial ledger unchanged' AS result;
