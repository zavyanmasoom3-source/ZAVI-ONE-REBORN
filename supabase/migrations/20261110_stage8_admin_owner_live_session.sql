-- Stage 8: authoritative read-only central owner verification.
-- No customer, finance, subscription, device or Auth session records change.
-- Replace hardcoded UI email allowlists with a server-checked role + live
-- Supabase Auth session. Does NOT grant admin privileges to an email address.
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('auth.sessions') IS NULL OR
    to_regclass('private.zavi_admin_roles') IS NULL OR
    to_regclass('private.zavi_billing_admins') IS NULL OR
    to_regprocedure('auth.uid()') IS NULL OR
    to_regprocedure('auth.jwt()') IS NULL
 THEN
  RAISE EXCEPTION 'STAGE8_OWNER_AUTH_SCHEMA_UNEXPECTED' USING ERRCODE='55000';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_proc p
  WHERE p.oid=to_regprocedure('public.zavi_stage8_admin_owner_session()'))
 THEN
  RAISE EXCEPTION 'STAGE8_OWNER_GATE_ALREADY_EXISTS_REVIEW_FIRST'
   USING ERRCODE='55000';
 END IF;
END $preflight$;

CREATE FUNCTION public.zavi_stage8_admin_owner_session()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $owner$
DECLARE
 v_uid uuid:=auth.uid();
 v_claims jsonb:=auth.jwt();
 v_session_text text;
 v_session_uuid uuid;
BEGIN
 IF v_uid IS NULL OR v_claims IS NULL OR
    v_claims->>'role' IS DISTINCT FROM 'authenticated' OR
    v_claims->>'is_anonymous' IS DISTINCT FROM 'false' THEN
  RETURN false;
 END IF;
 v_session_text:=v_claims->>'session_id';
 IF v_session_text IS NULL OR
   v_session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 THEN RETURN false; END IF;
 v_session_uuid:=v_session_text::uuid;
 RETURN EXISTS (
  SELECT 1
  FROM auth.sessions s
  JOIN private.zavi_admin_roles r ON r.user_id=s.user_id
  JOIN private.zavi_billing_admins a ON a.admin_uid=s.user_id
  WHERE s.id=v_session_uuid AND s.user_id=v_uid
    AND r.role='owner'
    AND (s.not_after IS NULL OR s.not_after>now())
 );
END
$owner$;

REVOKE ALL ON FUNCTION public.zavi_stage8_admin_owner_session()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zavi_stage8_admin_owner_session()
 TO authenticated;
COMMIT;
