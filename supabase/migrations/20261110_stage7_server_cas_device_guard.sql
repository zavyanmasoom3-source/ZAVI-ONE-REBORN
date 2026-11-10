-- Stage 7 incremental safe migration: a secure server-side replacement for
-- direct JSONB workspace PATCH. No customer rows are changed by installation.
-- DO NOT revoke legacy UPDATE yet: a signed, tested app upgrade is required
-- before cutover, or installed customers could be stranded with offline sales.
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.zavi_workspaces') IS NULL
 OR to_regclass('public.zavi_v26_devices') IS NULL
 OR to_regprocedure('private.zavi_subscription_is_active(uuid)') IS NULL
 THEN RAISE EXCEPTION 'STAGE7_MISSING_PRODUCTION_CONTRACT'
 USING ERRCODE='55000'; END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.zavi_stage7_workspace_cas(
 p_workspace_id uuid,
 p_device_id text,
 p_expected_revision bigint,
 p_payload jsonb,
 p_new_name text DEFAULT NULL
)
RETURNS TABLE(id uuid, name text, revision bigint, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Owner authentication required'
  USING ERRCODE='42501';
 END IF;
 IF p_workspace_id IS NULL OR
    nullif(pg_catalog.btrim(p_device_id),'') IS NULL OR
    pg_catalog.length(p_device_id)>160 OR
    p_expected_revision IS NULL OR p_expected_revision<0 OR
    p_expected_revision>=9223372036854775807 OR
    p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload)<>'object' OR
    pg_catalog.jsonb_typeof(p_payload->'tx') IS DISTINCT FROM 'array' OR
    pg_catalog.jsonb_typeof(p_payload->'products') IS DISTINCT FROM 'array' OR
    pg_catalog.jsonb_typeof(p_payload->'contacts') IS DISTINCT FROM 'array' OR
    pg_catalog.jsonb_typeof(p_payload->'accounts') IS DISTINCT FROM 'array' OR
    pg_catalog.octet_length(p_payload::text)>67108864 OR
    (p_new_name IS NOT NULL AND
     (pg_catalog.length(pg_catalog.btrim(p_new_name))<2 OR
      pg_catalog.length(pg_catalog.btrim(p_new_name))>65))
 THEN RAISE EXCEPTION 'Invalid workspace sync payload'
  USING ERRCODE='22023';
 END IF;

 -- The actual DB owner, current subscription and active device are checked
 -- on the server for each new CAS. The public device ID is not a
 -- cryptographic proof of hardware possession: see release cutover gates.
 IF NOT EXISTS (
  SELECT 1 FROM public.zavi_workspaces w
  WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid()
 ) THEN RAISE EXCEPTION 'Workspace owner access required'
  USING ERRCODE='42501'; END IF;
 IF NOT private.zavi_subscription_is_active(p_workspace_id)
 THEN RAISE EXCEPTION 'Active subscription required'
  USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.zavi_v26_devices d
  WHERE d.workspace_id=p_workspace_id AND d.device_id=p_device_id
    AND d.status='active' AND d.revoked_at IS NULL
 ) THEN RAISE EXCEPTION 'Active primary device required'
  USING ERRCODE='42501'; END IF;

 -- Single atomic compare-and-swap. Never merge or overwrite unseen data
 -- when the old revision differs; client must preserve pending local ledger.
 RETURN QUERY
 UPDATE public.zavi_workspaces w
 SET payload=p_payload,
     revision=w.revision+1,
     updated_at=pg_catalog.clock_timestamp(),
     name=CASE WHEN p_new_name IS NULL THEN w.name
               ELSE pg_catalog.btrim(p_new_name) END
 WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid()
   AND w.revision=p_expected_revision
   AND private.zavi_subscription_is_active(w.id)
   AND EXISTS (
     SELECT 1 FROM public.zavi_v26_devices d
     WHERE d.workspace_id=w.id AND d.device_id=p_device_id
       AND d.status='active' AND d.revoked_at IS NULL
   )
 RETURNING w.id,w.name,w.revision,w.updated_at;
END
$function$;
REVOKE ALL ON FUNCTION public.zavi_stage7_workspace_cas(
 uuid,text,bigint,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zavi_stage7_workspace_cas(
 uuid,text,bigint,jsonb,text) TO authenticated;
COMMIT;

-- IMPORTANT: this migration deliberately leaves existing direct UPDATE
-- privilege untouched. Only after original-owner keystore and genuine
-- Android upgrade/regression acceptance can a separate migration REVOKE
-- authenticated UPDATE on public.zavi_workspaces and close that legacy path.
