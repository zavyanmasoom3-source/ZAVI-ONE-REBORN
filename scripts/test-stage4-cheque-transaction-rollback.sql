\set ON_ERROR_STOP on
-- PostgreSQL 17 disposable fixture, executed AFTER stage4 PostgreSQL and
-- two-connection concurrency tests. No production data or credentials.
INSERT INTO public.zavi_cheques
(id,workspace_id,direction,cheque_number,bank_name,counterparty_id,
 currency,amount,issue_date,due_date)
VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccc0007',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','ROLLBACK-10','Test Bank','c1','AFN',10,'2026-11-10','2026-11-11');

-- A valid posting performed within a caller transaction rolls back *all*
-- states, including cheque status, tx array, revision, event, postings.
BEGIN;
SELECT pg_catalog.set_config('request.jwt.claim.sub',
 '11111111-1111-4111-8111-111111111111',true);
SET LOCAL ROLE authenticated;
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0007',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0010','settle',10,'a_cash');
ROLLBACK;

DO $$
DECLARE c record;
BEGIN
 SELECT status,settled_amount,linked_transaction_id INTO c
 FROM public.zavi_cheques WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0007';
 IF c.status<>'pending' OR c.settled_amount<>0 OR c.linked_transaction_id IS NOT NULL
 THEN RAISE EXCEPTION 'ROLLBACK: original cheque state was modified'; END IF;
 IF EXISTS(SELECT 1 FROM public.zavi_cheque_events
  WHERE operation_id='eeeeeeee-eeee-4eee-8eee-eeeeeeee0010')
 THEN RAISE EXCEPTION 'ROLLBACK: event survived'; END IF;
 IF EXISTS(SELECT 1 FROM public.zavi_cheque_postings
  WHERE cheque_id='cccccccc-cccc-4ccc-8ccc-cccccccc0007')
 THEN RAISE EXCEPTION 'ROLLBACK: journal survived'; END IF;
 IF EXISTS(SELECT 1 FROM public.zavi_workspaces
   WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND
   (revision<>8 OR pg_catalog.jsonb_path_exists(payload,
      '$.tx[*] ? (@.chequeId == "cccccccc-cccc-4ccc-8ccc-cccccccc0007")')))
 THEN RAISE EXCEPTION 'ROLLBACK: workspace revision or payment changed'; END IF;
 IF pg_catalog.has_function_privilege('anon',
   'public.zavi_stage4_cheque_apply(uuid,uuid,uuid,text,numeric,text,numeric)',
   'EXECUTE') THEN RAISE EXCEPTION 'ACCESS: anonymous can execute settlement'; END IF;
 IF pg_catalog.has_table_privilege('authenticated','public.zavi_cheques','UPDATE')
   OR pg_catalog.has_table_privilege('authenticated','public.zavi_cheques','DELETE')
 THEN RAISE EXCEPTION 'ACCESS: authenticated can forge status/deletion'; END IF;
 IF pg_catalog.has_table_privilege('authenticated','public.zavi_cheque_postings','INSERT')
   OR pg_catalog.has_table_privilege('authenticated','public.zavi_cheque_events','INSERT')
 THEN RAISE EXCEPTION 'ACCESS: authenticated can forge immutable audit'; END IF;
END $$;
SELECT 'PASS: rollback preserves cheque, balances, journal, revision and protected privileges' AS result;
