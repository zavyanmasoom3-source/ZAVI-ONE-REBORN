-- Stage 5: protect central owner and preserve customer ledger through
-- the legacy archive API, even if clients call it directly (not via UI).
-- The original function signature, archive row and audit table are preserved.
BEGIN;
DO $preflight$
BEGIN
 IF pg_catalog.to_regprocedure('public.zavi_admin_v24_archive(uuid,boolean,text)') IS NULL
 OR pg_catalog.to_regprocedure('private.zavi_is_billing_admin()') IS NULL
 OR pg_catalog.to_regclass('private.zavi_admin_roles') IS NULL
 OR pg_catalog.to_regclass('private.zavi_customer_archives') IS NULL
 OR pg_catalog.to_regclass('private.zavi_customer_admin_events') IS NULL
 THEN
  RAISE EXCEPTION 'STAGE5_ARCHIVE_SCHEMA_NOT_VERIFIED' USING ERRCODE='55000';
 END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.zavi_admin_v24_archive(
 p_workspace_id uuid, p_archive boolean, p_reason text DEFAULT ''
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $archive$
DECLARE
 v_actor uuid:=auth.uid();
 v_owner uuid;
 v_prior boolean;
BEGIN
 IF v_actor IS NULL OR NOT private.zavi_is_billing_admin()
 OR NOT EXISTS(
  SELECT 1 FROM private.zavi_admin_roles r
  WHERE r.user_id=v_actor AND r.role='owner'
 ) THEN
  RAISE EXCEPTION 'CENTRAL_OWNER_AUTHORIZATION_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF p_workspace_id IS NULL OR p_archive IS NULL OR length(coalesce(p_reason,''))>500 THEN
  RAISE EXCEPTION 'INVALID_ARCHIVE_REQUEST' USING ERRCODE='22023';
 END IF;
 SELECT w.owner_uid INTO v_owner
 FROM public.zavi_workspaces w WHERE w.id=p_workspace_id FOR UPDATE;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'WORKSPACE_NOT_FOUND' USING ERRCODE='P0002';
 END IF;
 IF p_archive AND v_owner=v_actor THEN
  RAISE EXCEPTION 'MAIN_OWNER_WORKSPACE_PROTECTED' USING ERRCODE='42501';
 END IF;
 SELECT a.archived INTO v_prior FROM private.zavi_customer_archives a
 WHERE a.workspace_id=p_workspace_id FOR UPDATE;
 -- Repeating an already-completed operation must not inflate the audit log.
 IF FOUND AND v_prior IS NOT DISTINCT FROM p_archive THEN RETURN true; END IF;

 INSERT INTO private.zavi_customer_archives(
  workspace_id,archived,reason,archived_at,changed_at,changed_by
 ) VALUES (
  p_workspace_id,p_archive,pg_catalog.btrim(coalesce(p_reason,'')),
  CASE WHEN p_archive THEN now() ELSE NULL END,now(),v_actor
 )
 ON CONFLICT (workspace_id) DO UPDATE SET
  archived=EXCLUDED.archived,
  reason=EXCLUDED.reason,
  archived_at=EXCLUDED.archived_at,
  changed_at=now(),
  changed_by=v_actor;

 INSERT INTO private.zavi_customer_admin_events(
  workspace_id,actor_uid,action,details
 ) VALUES(
  p_workspace_id,v_actor,
  CASE WHEN p_archive THEN 'archive' ELSE 'restore' END,
  pg_catalog.btrim(coalesce(p_reason,''))
 );
 RETURN true;
END
$archive$;
REVOKE ALL ON FUNCTION public.zavi_admin_v24_archive(uuid,boolean,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.zavi_admin_v24_archive(uuid,boolean,text)
 TO authenticated;
COMMIT;
