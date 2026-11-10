-- Stage 3 safety closeout: no legacy owner/admin RPC may bypass device sync protection.
-- Only FUNCTION definitions change. Existing customer, device and ledger rows are untouched.
CREATE OR REPLACE FUNCTION public.zavi_v41_owner_replace_device(
 p_workspace_id uuid,p_new_device_id text,p_new_device_name text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE previous_device public.zavi_v26_devices%rowtype;
        new_id text:=btrim(coalesce(p_new_device_id,''));
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
 END IF;
 IF p_workspace_id IS NULL OR length(new_id) NOT BETWEEN 16 AND 200
    OR length(coalesce(p_new_device_name,''))>150 THEN
  RAISE EXCEPTION 'Invalid device' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.zavi_workspaces w
  WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Workspace owner required' USING ERRCODE='42501';
 END IF;
 IF NOT private.zavi_subscription_is_active(p_workspace_id) THEN
  RAISE EXCEPTION 'Active paid subscription required' USING ERRCODE='42501';
 END IF;
 SELECT d.* INTO previous_device FROM public.zavi_v26_devices d
  WHERE d.workspace_id=p_workspace_id AND d.status='active'
  ORDER BY d.registered_at DESC LIMIT 1 FOR UPDATE;
 IF FOUND THEN
  IF previous_device.device_id=new_id THEN
   UPDATE public.zavi_v26_devices d SET last_seen_at=now()
    WHERE d.workspace_id=p_workspace_id AND d.device_id=new_id AND d.status='active';
   RETURN 'DEVICE_ALREADY_ACTIVE';
  END IF;
  IF previous_device.reported_pending_count IS DISTINCT FROM 0 THEN
   RAISE EXCEPTION 'PREVIOUS_DEVICE_HAS_UNSYNCED_DATA' USING ERRCODE='55000';
  END IF;
  IF previous_device.last_report_at IS NULL OR previous_device.last_sync_at IS NULL
   OR previous_device.last_report_at<now()-interval '15 minutes'
   OR previous_device.last_report_at>now()+interval '1 minute'
   OR previous_device.last_sync_at<previous_device.last_report_at-interval '15 minutes'
   OR previous_device.last_sync_at>now()+interval '1 minute' THEN
   RAISE EXCEPTION 'PREVIOUS_DEVICE_SYNC_UNVERIFIED' USING ERRCODE='55000';
  END IF;
 END IF;
 UPDATE public.zavi_v26_devices SET status='revoked',revoked_at=now()
  WHERE workspace_id=p_workspace_id AND status='active';
 INSERT INTO public.zavi_v26_devices
  (workspace_id,device_id,device_name,status,last_seen_at,revoked_at)
 VALUES (p_workspace_id,new_id,NULLIF(btrim(p_new_device_name),''),
         'active',now(),NULL)
 ON CONFLICT(workspace_id,device_id) DO UPDATE SET
  device_name=excluded.device_name,status='active',last_seen_at=now(),revoked_at=NULL;
 INSERT INTO private.zavi_v41_device_transfer_audit
  (workspace_id,actor_uid,previous_device_id,current_device_id)
 VALUES (p_workspace_id,auth.uid(),previous_device.device_id,new_id);
 RETURN CASE WHEN previous_device.device_id IS NULL
  THEN 'DEVICE_ACTIVATED' ELSE 'DEVICE_REPLACED' END;
END $fn$;

CREATE OR REPLACE FUNCTION public.zavi_admin_replace_device(
 p_workspace_id uuid,p_new_device_id text,p_new_device_name text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE previous_device public.zavi_v26_devices%rowtype;
        new_id text:=btrim(coalesce(p_new_device_id,''));
BEGIN
 IF NOT private.zavi_is_billing_admin() THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
 END IF;
 IF p_workspace_id IS NULL OR length(new_id) NOT BETWEEN 16 AND 200 THEN
  RAISE EXCEPTION 'Invalid device ID' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.zavi_workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Workspace not found' USING ERRCODE='22023';
 END IF;
 SELECT d.* INTO previous_device FROM public.zavi_v26_devices d
  WHERE d.workspace_id=p_workspace_id AND d.status='active'
  ORDER BY d.registered_at DESC LIMIT 1 FOR UPDATE;
 IF FOUND AND previous_device.device_id<>new_id THEN
  IF previous_device.reported_pending_count IS DISTINCT FROM 0 THEN
   RAISE EXCEPTION 'PREVIOUS_DEVICE_HAS_UNSYNCED_DATA' USING ERRCODE='55000';
  END IF;
  IF previous_device.last_report_at IS NULL OR previous_device.last_sync_at IS NULL
   OR previous_device.last_report_at<now()-interval '15 minutes'
   OR previous_device.last_report_at>now()+interval '1 minute'
   OR previous_device.last_sync_at<previous_device.last_report_at-interval '15 minutes'
   OR previous_device.last_sync_at>now()+interval '1 minute' THEN
   RAISE EXCEPTION 'PREVIOUS_DEVICE_SYNC_UNVERIFIED' USING ERRCODE='55000';
  END IF;
 END IF;
 UPDATE public.zavi_v26_devices SET status='revoked',revoked_at=now()
  WHERE workspace_id=p_workspace_id AND status='active';
 INSERT INTO public.zavi_v26_devices
  (workspace_id,device_id,device_name,status,last_seen_at,revoked_at)
 VALUES (p_workspace_id,new_id,left(p_new_device_name,150),'active',now(),NULL)
 ON CONFLICT(workspace_id,device_id) DO UPDATE SET
  device_name=excluded.device_name,status='active',last_seen_at=now(),revoked_at=NULL;
 RETURN true;
END $fn$;
COMMENT ON FUNCTION public.zavi_v41_owner_replace_device(uuid,text,text)
 IS 'Stage 3: legacy owner replacement requires zero pending and recent confirmed cloud sync';
COMMENT ON FUNCTION public.zavi_admin_replace_device(uuid,text,text)
 IS 'Stage 3: billing admin replacement cannot revoke an unsynced old primary device';
