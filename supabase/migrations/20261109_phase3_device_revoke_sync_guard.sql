-- Stage 3 | ZAVI ONE | owner-scoped device revoke must be sync-verified.
-- Previously this RPC only checked a fresh heartbeat + reported_pending_count.
-- A device could report zero pending while its last actual cloud sync was stale.
-- The primary-device transfer already guards that condition. Revoke now does too.
-- No changes to existing device rows or customer/accounting records.
CREATE OR REPLACE FUNCTION public.zavi_v652_owner_revoke_device(
  p_workspace uuid, p_device_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $zavi_phase3_revoke$
DECLARE
  target record;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.zavi_workspaces AS w
    WHERE w.id = p_workspace AND w.owner_uid = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Owner access required' USING ERRCODE = '42501';
  END IF;

  SELECT d.id, d.status, d.reported_pending_count,
         d.last_report_at, d.last_sync_at
  INTO target
  FROM public.zavi_v26_devices AS d
  WHERE d.workspace_id = p_workspace AND d.device_id = p_device_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device not found' USING ERRCODE = '22023';
  END IF;

  IF target.status = 'revoked' THEN
    RETURN pg_catalog.jsonb_build_object('ok', true, 'already_revoked', true);
  END IF;

  IF target.reported_pending_count > 0 THEN
    RAISE EXCEPTION 'Device reports unsynced transactions; sync before revoke'
      USING ERRCODE = 'P0001';
  END IF;

  IF target.reported_pending_count IS NULL
     OR target.last_report_at IS NULL
     OR target.last_report_at < now() - interval '15 minutes'
     OR target.last_report_at > now() + interval '1 minute'
     OR target.last_sync_at IS NULL
     OR target.last_sync_at < target.last_report_at - interval '15 minutes'
     OR target.last_sync_at > now() + interval '1 minute'
  THEN
    RAISE EXCEPTION 'Device cloud sync unverified or stale; sync before revoke'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.zavi_v26_devices
  SET status = 'revoked', revoked_at = now()
  WHERE id = target.id;

  RETURN pg_catalog.jsonb_build_object(
    'ok', true, 'revoked_device_id', p_device_id
  );
END;
$zavi_phase3_revoke$;

COMMENT ON FUNCTION public.zavi_v652_owner_revoke_device(uuid,text)
IS 'Owner-authenticated revoke only after confirmed fresh cloud sync and zero pending writes; old offline-only records cannot be retrieved remotely';
