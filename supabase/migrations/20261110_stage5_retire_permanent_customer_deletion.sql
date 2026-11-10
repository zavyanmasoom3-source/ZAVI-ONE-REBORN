-- Stage 5 ADMIN safety: retire destructive customer deletion without dropping
-- APIs or deleting any customer, invoice, payment, audit, device or workspace.
-- Replace the old API bodies so even nested SECURITY DEFINER callers fail.
-- Authenticated admins retain preview; use the existing recoverable trash RPC.
BEGIN;
DO $preflight$
BEGIN
 IF pg_catalog.to_regprocedure('public.zavi_owner_delete_customer(uuid,text)') IS NULL
   OR pg_catalog.to_regprocedure('public.zavi_owner_reset_customer_accounts(boolean,text)') IS NULL
   OR pg_catalog.to_regprocedure('public.zavi_admin_trash_customer(uuid,text)') IS NULL
   OR pg_catalog.to_regprocedure('public.zavi_admin_restore_trash_customer(uuid)') IS NULL THEN
  RAISE EXCEPTION 'STAGE5_UNEXPECTED_CUSTOMER_SCHEMA: review before change'
    USING ERRCODE='55000';
 END IF;
END
$preflight$;
-- We intentionally keep the original signature and never issue DROP CASCADE.
-- Server callers and SQL using this routine now fail closed without side effects.
CREATE OR REPLACE FUNCTION public.zavi_owner_delete_customer(
 p_workspace_id uuid,p_confirmation text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $deny$
BEGIN
 RAISE EXCEPTION 'PERMANENT_CUSTOMER_DELETION_DISABLED_USE_RECOVERABLE_TRASH'
  USING ERRCODE='42501';
END
$deny$;
REVOKE ALL ON FUNCTION public.zavi_owner_delete_customer(uuid,text)
 FROM PUBLIC,anon,authenticated;

-- Preserve the old confirmation-preview response shape, not the destructive action.
-- Both an authenticated central billing admin and explicit owner role are required.
CREATE OR REPLACE FUNCTION public.zavi_owner_reset_customer_accounts(
 p_preview boolean DEFAULT true, p_confirmation text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $preview$
DECLARE v_actor uuid:=auth.uid(); v_count integer;
BEGIN
 IF v_actor IS NULL OR NOT private.zavi_is_billing_admin()
 OR NOT EXISTS(
  SELECT 1 FROM private.zavi_admin_roles r
  WHERE r.user_id=v_actor AND r.role='owner'
 ) THEN
  RAISE EXCEPTION 'CENTRAL_OWNER_AUTHORIZATION_REQUIRED'
   USING ERRCODE='42501';
 END IF;
 IF COALESCE(p_preview,true) IS NOT TRUE THEN
  RAISE EXCEPTION 'PERMANENT_BULK_DELETE_DISABLED_USE_RECOVERABLE_TRASH'
   USING ERRCODE='42501';
 END IF;
 SELECT count(*)::integer INTO v_count FROM public.zavi_workspaces w
 WHERE w.owner_uid IS DISTINCT FROM v_actor;
 RETURN pg_catalog.jsonb_build_object(
  'preview',true,'customer_count',v_count,'completed',false,
  'permanent_delete_enabled',false,'recovery_supported',true
 );
END
$preview$;
REVOKE ALL ON FUNCTION public.zavi_owner_reset_customer_accounts(boolean,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.zavi_owner_reset_customer_accounts(boolean,text)
 TO authenticated;

-- Fail closed before commit if any actual destructive body or client EXECUTE
-- privilege remains on the single-customer permanent deletion endpoint.
DO $postcheck$
DECLARE src text;
BEGIN
 SELECT pg_catalog.pg_get_functiondef(
  'public.zavi_owner_delete_customer(uuid,text)'::regprocedure
 ) INTO src;
 IF src !~ 'PERMANENT_CUSTOMER_DELETION_DISABLED_USE_RECOVERABLE_TRASH'
 OR pg_catalog.has_function_privilege('anon',
    'public.zavi_owner_delete_customer(uuid,text)','EXECUTE')
 OR pg_catalog.has_function_privilege('authenticated',
    'public.zavi_owner_delete_customer(uuid,text)','EXECUTE')
 THEN
  RAISE EXCEPTION 'STAGE5_PERMANENT_DELETE_STILL_EXPOSED'
   USING ERRCODE='55000';
 END IF;
END
$postcheck$;
COMMIT;
