-- ZAVI ONE stage 7: protect upgraded workspaces from raw REST PATCH
-- without cutting off legacy APKs which have not yet passed a signed upgrade.
--
-- IMPORTANT: installation inserts ZERO opt-in rows; no existing customer is
-- cut over and no invoice, device, customer, or workspace row is modified.
-- Enroll a workspace only after verified backups + a signed app upgrade.
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.zavi_workspaces') IS NULL OR
    to_regprocedure('public.zavi_stage7_workspace_cas(uuid,text,bigint,jsonb,text)') IS NULL OR
    NOT (SELECT c.relrowsecurity FROM pg_class c
         WHERE c.oid='public.zavi_workspaces'::regclass)
 THEN
  RAISE EXCEPTION 'STAGE7_CUTOVER_SCHEMA_OR_RLS_UNEXPECTED'
   USING ERRCODE='55000';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_policies
   WHERE schemaname='public' AND tablename='zavi_workspaces'
     AND policyname='zavi_stage7_upgraded_server_only') THEN
  RAISE EXCEPTION 'STAGE7_CUTOVER_POLICY_ALREADY_PRESENT'
   USING ERRCODE='55000';
 END IF;
END $preflight$;

CREATE TABLE IF NOT EXISTS private.zavi_stage7_rpc_only_workspaces(
 workspace_id uuid PRIMARY KEY REFERENCES public.zavi_workspaces(id)
   ON DELETE RESTRICT,
 approved_owner uuid NOT NULL,
 approved_at timestamptz NOT NULL DEFAULT now(),
 signed_release_sha text NOT NULL,
 verified_backup_digest text NOT NULL,
 CONSTRAINT zavi_stage7_cutover_release_sha CHECK (
  signed_release_sha ~ '^[0-9a-f]{40}$'
 ),
 CONSTRAINT zavi_stage7_cutover_backup_digest CHECK (
  verified_backup_digest ~ '^[0-9a-f]{64}$'
 )
);
ALTER TABLE private.zavi_stage7_rpc_only_workspaces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.zavi_stage7_rpc_only_workspaces
 FROM PUBLIC,anon,authenticated;

-- The private helper deliberately returns "open" for every pre-cutover row.
-- It checks a protected private table that normal web clients cannot alter.
CREATE OR REPLACE FUNCTION private.zavi_stage7_legacy_write_open(
 p_workspace_id uuid
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 SELECT NOT EXISTS(
  SELECT 1 FROM private.zavi_stage7_rpc_only_workspaces c
  WHERE c.workspace_id=p_workspace_id
 )
$function$;
REVOKE ALL ON FUNCTION private.zavi_stage7_legacy_write_open(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.zavi_stage7_legacy_write_open(uuid)
 TO authenticated;

-- Restrictive policy composes with the existing owner/subscription policy;
-- it cannot grant a single new row to an unauthorised caller.
CREATE POLICY zavi_stage7_upgraded_server_only
 ON public.zavi_workspaces AS RESTRICTIVE FOR UPDATE
 TO authenticated
 USING (private.zavi_stage7_legacy_write_open(id))
 WITH CHECK (private.zavi_stage7_legacy_write_open(id));

DO $postcheck$
BEGIN
 IF EXISTS(SELECT 1 FROM private.zavi_stage7_rpc_only_workspaces) THEN
  RAISE EXCEPTION 'STAGE7_CUTOVER_UNEXPECTED_EXISTING_ENROLLMENT'
   USING ERRCODE='55000';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies
   WHERE schemaname='public' AND tablename='zavi_workspaces'
   AND policyname='zavi_stage7_upgraded_server_only'
   AND permissive='RESTRICTIVE' AND cmd='UPDATE')
 THEN
  RAISE EXCEPTION 'STAGE7_RESTRICTIVE_POLICY_MISSING'
   USING ERRCODE='55000';
 END IF;
END $postcheck$;
COMMIT;

-- DO NOT INSERT into private.zavi_stage7_rpc_only_workspaces during migration.
-- DO NOT globally revoke UPDATE on public.zavi_workspaces until physical
-- upgrade, offline-export restore and customer data checks have passed.
-- Once certified, a separately approved owner-specific cutover can insert
-- an opt-in row for that exact workspace, closing raw PATCH for that owner
-- while the SECURITY DEFINER, device-checked Stage7 CAS RPC continues working.
