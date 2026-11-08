-- Security hardening for intentionally RPC-only public tables.
-- Existing tables with RLS and zero policies are inaccessible to authenticated
-- clients (verified by has_table_privilege). Do not add permissive policies.
-- This migration only makes the already-existing deny posture explicit.
BEGIN;
DO $audit$
DECLARE r record;
BEGIN
 FOR r IN SELECT c.oid, c.relname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid=c.oid) LOOP
  IF pg_catalog.has_table_privilege('authenticated',r.oid,'SELECT') OR pg_catalog.has_table_privilege('authenticated',r.oid,'INSERT') OR pg_catalog.has_table_privilege('authenticated',r.oid,'UPDATE') OR pg_catalog.has_table_privilege('authenticated',r.oid,'DELETE') THEN
   RAISE EXCEPTION 'Review required: RLS no-policy table % has direct authenticated privileges',r.relname;
  END IF;
 END LOOP;
END $audit$;
-- Both newly added ADMIN RPCs already have SET search_path = '' and
-- owner authorization checks. No broad security-definer rewrite attempted.
COMMIT;
