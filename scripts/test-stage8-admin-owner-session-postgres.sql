\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17: real Stage 8 SQL against synthetic Auth sessions,
-- never production customers, invoices, payment data, passwords or tokens.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE SET search_path TO ''
AS $f$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $f$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE SET search_path TO ''
AS $f$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $f$;
CREATE TABLE auth.sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL, not_after timestamptz
);
CREATE TABLE private.zavi_admin_roles (
 user_id uuid PRIMARY KEY,role text NOT NULL
);
CREATE TABLE private.zavi_billing_admins (
 admin_uid uuid PRIMARY KEY
);
CREATE TABLE public.qa_financial_invoices(
 id text PRIMARY KEY, paid numeric NOT NULL
);
INSERT INTO public.qa_financial_invoices VALUES ('QA-INVOICE-1',100.55);
INSERT INTO private.zavi_billing_admins VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('33333333-3333-4333-8333-333333333333');
INSERT INTO private.zavi_admin_roles VALUES
 ('11111111-1111-4111-8111-111111111111','owner'),
 ('33333333-3333-4333-8333-333333333333','agent');
INSERT INTO auth.sessions VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',NULL),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '22222222-2222-4222-8222-222222222222',NULL),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '33333333-3333-4333-8333-333333333333',NULL);
\ir ../supabase/migrations/20261110_stage8_admin_owner_live_session.sql
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated;
SELECT set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","email":"new-owner@example.invalid"}',false);
SET ROLE authenticated;
DO $owner$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'REAL_OWNER_REJECTED_DUE_TO_CHANGED_EMAIL'; END IF;
END $owner$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',
 '33333333-3333-4333-8333-333333333333',false);
SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'DELEGATED_BILLING_AGENT_ESCALATED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',
 '22222222-2222-4222-8222-222222222222',false);
SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'UNRELATED_USER_ADMITTED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'STOLEN_FOREIGN_SESSION_ACCEPTED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"not-a-uuid"}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'MALFORMED_SESSION_CLAIM_ACCEPTED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":true,"session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'ANONYMOUS_AUTH_ROLE_ESCALATED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
 '{"role":"authenticated","is_anonymous":false,"session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',false);
UPDATE auth.sessions SET not_after=now()-interval '1 minute'
WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'EXPIRED_SESSION_ADMITTED'; END IF;
END $test$;
RESET ROLE;

UPDATE auth.sessions SET not_after=NULL
WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DELETE FROM auth.sessions
WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'REVOKED_OWNER_SESSION_ADMITTED'; END IF;
END $test$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claims','{}',false);
SET ROLE authenticated;
DO $test$
BEGIN
 IF public.zavi_stage8_admin_owner_session() IS NOT FALSE
 THEN RAISE EXCEPTION 'MISSING_JWT_OWNER_ADMITTED'; END IF;
END $test$;
RESET ROLE;

DO $proof$
BEGIN
 IF has_function_privilege('anon','public.zavi_stage8_admin_owner_session()','EXECUTE')
 THEN RAISE EXCEPTION 'ANON_OWNER_GATE_EXPOSED'; END IF;
 IF (SELECT paid FROM public.qa_financial_invoices WHERE id='QA-INVOICE-1')<>100.55
 THEN RAISE EXCEPTION 'ADMIN_GATE_MODIFIED_FINANCE'; END IF;
END $proof$;
SELECT 'PASS: owner account survives changed email, outsider/delegated/revoked/expired/malformed sessions rejected, finance untouched' AS result;
