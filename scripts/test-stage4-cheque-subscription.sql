\set ON_ERROR_STOP on
-- Isolated fixture data only, never on Supabase customer rows.
-- Executed after the initial Stage4 SQL and existing synthetic ledger tests.
\ir ../supabase/migrations/20261110_stage4_cheque_subscription_guard.sql
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',false);
SELECT pg_catalog.set_config('zavi.test.license','off',false);
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  INSERT INTO public.zavi_cheques(workspace_id,direction,cheque_number,
    bank_name,counterparty_id,currency,amount,issue_date,due_date)
  VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','received',
    'EXPIRED-TEST','Test Bank','c1','AFN',10,'2026-11-10','2026-11-11');
  RAISE EXCEPTION 'EXPIRED_SUBSCRIPTION_INSERT_ALLOWED';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END
$test$;
SELECT pg_catalog.set_config('zavi.test.license','on',false);
INSERT INTO public.zavi_cheques(workspace_id,direction,cheque_number,
 bank_name,counterparty_id,currency,amount,issue_date,due_date)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','received',
 'ACTIVE-TEST','Test Bank','c1','AFN',10,'2026-11-10','2026-11-11');
RESET ROLE;
DO $test$
DECLARE blocked int; allowed int;
BEGIN
 SELECT count(*) INTO blocked FROM public.zavi_cheques WHERE cheque_number='EXPIRED-TEST';
 SELECT count(*) INTO allowed FROM public.zavi_cheques WHERE cheque_number='ACTIVE-TEST' AND status='pending';
 IF blocked<>0 OR allowed<>1 THEN
  RAISE EXCEPTION 'Subscription RLS registration failed: %, %',blocked,allowed;
 END IF;
END
$test$;
SELECT 'PASS: expired owner denied pending registration; active owner allowed' AS result;
