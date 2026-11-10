-- Stage 7: close legacy operation-ingestion bypass for revoked devices and
-- expired/archived subscriptions. This function only records outbox metadata;
-- it does NOT apply any payment/invoice to the accounting ledger.
-- No customer row, device row or existing operation is modified.
BEGIN;
DO $preflight$
BEGIN
 IF to_regprocedure('public.zavi_v28_receive_sync_operation(uuid,uuid,text,text,text,text,jsonb,timestamptz)') IS NULL
 OR to_regprocedure('private.zavi_subscription_is_active(uuid)') IS NULL
 OR to_regclass('public.zavi_v26_devices') IS NULL
 OR to_regclass('public.zavi_v26_sync_operations') IS NULL
 OR to_regclass('public.zavi_workspaces') IS NULL
 THEN RAISE EXCEPTION 'STAGE7_REQUIRED_SCHEMA_NOT_VERIFIED' USING ERRCODE='55000';
 END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.zavi_v28_receive_sync_operation(
 p_workspace_id uuid,
 p_operation_id uuid,
 p_device_id text,
 p_operation_type text,
 p_entity_type text,
 p_entity_id text,
 p_payload jsonb,
 p_created_at timestamptz DEFAULT NULL
)
RETURNS TABLE(operation_id uuid, sync_status text, server_received_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $sync$
DECLARE
 v_existing record;
 v_received timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
 END IF;
 IF p_workspace_id IS NULL OR p_operation_id IS NULL OR
    nullif(pg_catalog.btrim(p_device_id),'') IS NULL OR
    pg_catalog.length(p_device_id)>160 OR
    nullif(pg_catalog.btrim(p_operation_type),'') IS NULL OR
    pg_catalog.length(p_operation_type)>80 OR
    nullif(pg_catalog.btrim(p_entity_type),'') IS NULL OR
    pg_catalog.length(p_entity_type)>80 OR
    pg_catalog.length(coalesce(p_entity_id,''))>255 OR
    p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload)<>'object' OR
    pg_catalog.octet_length(p_payload::text)>1048576 OR
    (p_created_at IS NOT NULL AND p_created_at>now()+interval '5 minutes')
 THEN
  RAISE EXCEPTION 'Invalid sync operation' USING ERRCODE='22023';
 END IF;

 IF NOT EXISTS (
  SELECT 1 FROM public.zavi_workspaces w
  WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid()
 ) THEN RAISE EXCEPTION 'Workspace owner access required' USING ERRCODE='42501'; END IF;

 -- A dropped server acknowledgment must be idempotently recoverable EVEN
 -- after device transfer/expiry, but must not create a new operation.
 SELECT s.received_at,s.device_id,s.operation_type,s.entity_type,s.entity_id,s.payload
 INTO v_existing FROM public.zavi_v26_sync_operations s
 WHERE s.workspace_id=p_workspace_id AND s.operation_id=p_operation_id;
 IF FOUND THEN
  IF v_existing.device_id IS DISTINCT FROM p_device_id OR
     v_existing.operation_type IS DISTINCT FROM p_operation_type OR
     v_existing.entity_type IS DISTINCT FROM p_entity_type OR
     v_existing.entity_id IS DISTINCT FROM p_entity_id OR
     v_existing.payload IS DISTINCT FROM p_payload
  THEN RAISE EXCEPTION 'Operation ID conflict' USING ERRCODE='23505'; END IF;
  RETURN QUERY SELECT p_operation_id,'already_received'::text,v_existing.received_at;
  RETURN;
 END IF;

 -- All NEW operations must be owned by an active unrevoked device, with
 -- the current canonical subscription entitlement (including archived state).
 IF NOT private.zavi_subscription_is_active(p_workspace_id) THEN
  RAISE EXCEPTION 'Active unarchived subscription required'
   USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.zavi_v26_devices d
  WHERE d.workspace_id=p_workspace_id AND d.device_id=p_device_id
    AND d.status='active' AND d.revoked_at IS NULL
 ) THEN RAISE EXCEPTION 'Active primary device required'
   USING ERRCODE='42501'; END IF;

 INSERT INTO public.zavi_v26_sync_operations (
  workspace_id,operation_id,device_id,operation_type,entity_type,entity_id,
  payload,created_at,received_at
 ) VALUES (
  p_workspace_id,p_operation_id,p_device_id,p_operation_type,p_entity_type,
  p_entity_id,p_payload,coalesce(p_created_at,now()),now()
 ) ON CONFLICT DO NOTHING
 RETURNING received_at INTO v_received;

 IF v_received IS NOT NULL THEN
  RETURN QUERY SELECT p_operation_id,'received'::text,v_received;
  RETURN;
 END IF;
 -- Concurrent identical operation: inspect actual committed row on conflict.
 SELECT s.received_at,s.device_id,s.operation_type,s.entity_type,s.entity_id,s.payload
 INTO v_existing FROM public.zavi_v26_sync_operations s
 WHERE s.workspace_id=p_workspace_id AND s.operation_id=p_operation_id;
 IF NOT FOUND OR
    v_existing.device_id IS DISTINCT FROM p_device_id OR
    v_existing.operation_type IS DISTINCT FROM p_operation_type OR
    v_existing.entity_type IS DISTINCT FROM p_entity_type OR
    v_existing.entity_id IS DISTINCT FROM p_entity_id OR
    v_existing.payload IS DISTINCT FROM p_payload
 THEN RAISE EXCEPTION 'Operation ID conflict' USING ERRCODE='23505'; END IF;
 RETURN QUERY SELECT p_operation_id,'already_received'::text,v_existing.received_at;
END
$sync$;

REVOKE ALL ON FUNCTION public.zavi_v28_receive_sync_operation(
 uuid,uuid,text,text,text,text,jsonb,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.zavi_v28_receive_sync_operation(
 uuid,uuid,text,text,text,text,jsonb,timestamptz) TO authenticated;
COMMIT;
