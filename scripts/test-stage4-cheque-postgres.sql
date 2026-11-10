\set ON_ERROR_STOP on
-- Synthetic PostgreSQL 17 fixture ONLY. No Supabase credentials or customer rows.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
 LANGUAGE sql STABLE SET search_path TO ''
 AS $$ SELECT NULLIF(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE OR REPLACE FUNCTION private.zavi_subscription_is_active(p_workspace uuid)
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
 AS $$ SELECT pg_catalog.current_setting('zavi.test.license',true) IS DISTINCT FROM 'off' $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE public.zavi_workspaces(
 id uuid PRIMARY KEY,owner_uid uuid NOT NULL,name text NOT NULL,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 revision bigint NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.zavi_cheques(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.zavi_workspaces(id),
 direction text NOT NULL CHECK(direction IN ('received','issued')),
 cheque_number text NOT NULL,bank_name text NOT NULL,counterparty_id text NOT NULL,
 currency text NOT NULL,amount numeric(20,4) NOT NULL CHECK(amount>0),
 issue_date date NOT NULL,due_date date NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 cleared_at timestamptz,linked_transaction_id text,notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT zavi_cheque_initial_pending CHECK(status='pending' AND cleared_at IS NULL AND linked_transaction_id IS NULL),
 CONSTRAINT zavi_cheques_status_check CHECK(status IN ('pending','deposited','cleared','bounced','cancelled')));
CREATE TABLE public.zavi_cheque_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.zavi_workspaces(id),
 cheque_id uuid NOT NULL REFERENCES public.zavi_cheques(id),
 old_status text,new_status text NOT NULL,note text NOT NULL DEFAULT '',
 occurred_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.zavi_workspaces TO authenticated;
GRANT SELECT,INSERT ON public.zavi_cheques TO authenticated;
GRANT SELECT ON public.zavi_cheque_events TO authenticated;

-- Reproduce live owner-only SELECT grants and RLS before the staging change.
ALTER TABLE public.zavi_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY zavi_ws_select ON public.zavi_workspaces
 FOR SELECT TO authenticated USING (owner_uid=(SELECT auth.uid()));
ALTER TABLE public.zavi_cheques ENABLE ROW LEVEL SECURITY;
CREATE POLICY zavi_cheques_owner_read ON public.zavi_cheques
 FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.zavi_workspaces w
   WHERE w.id=workspace_id AND w.owner_uid=(SELECT auth.uid())));
CREATE POLICY zavi_cheques_owner_insert ON public.zavi_cheques
 FOR INSERT TO authenticated WITH CHECK(
  EXISTS(SELECT 1 FROM public.zavi_workspaces w
   WHERE w.id=workspace_id AND w.owner_uid=(SELECT auth.uid())));
ALTER TABLE public.zavi_cheque_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY zavi_cheque_events_owner_read ON public.zavi_cheque_events
 FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.zavi_workspaces w
   WHERE w.id=workspace_id AND w.owner_uid=(SELECT auth.uid())));

-- The staging migration explicitly removes the pending-only constraint,
-- deploys a strict RPC, and makes a private-by-default immutable posting table.
\ir ../supabase/staging/20261110_stage4_cheque_atomic_settlement.sql

INSERT INTO public.zavi_workspaces(id,owner_uid,name,payload,revision)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 'Synthetic A',
 '{
   "currency":"AFN",
   "accounts":[{"id":"a_cash","name":"Cash","opening":10}],
   "contacts":[
      {"id":"c1","openingReceivable":100,"openingPayable":0},
      {"id":"s1","openingReceivable":0,"openingPayable":60},
      {"id":"c_fx","openingReceivable":1000,"openingPayable":0}
   ],
   "tx":[]
 }'::jsonb,1),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 '22222222-2222-4222-8222-222222222222',
 'Synthetic B',
 '{"currency":"AFN","accounts":[{"id":"a_cash","opening":0}],
 "contacts":[{"id":"c1","openingReceivable":40}],"tx":[]}'::jsonb,1);

INSERT INTO public.zavi_cheques
(id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,amount,issue_date,due_date)
VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccc0001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','R1','Bank','c1','AFN',100,'2026-11-10','2026-11-11'),
('cccccccc-cccc-4ccc-8ccc-cccccccc0002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'issued','I1','Bank','s1','AFN',60,'2026-11-10','2026-11-11'),
('cccccccc-cccc-4ccc-8ccc-cccccccc0003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','FX1','Bank','c_fx','USD',12.34,'2026-11-10','2026-11-11'),
('cccccccc-cccc-4ccc-8ccc-cccccccc0004','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 'received','R2','Bank','c1','AFN',40,'2026-11-10','2026-11-11');

SELECT pg_catalog.set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;

-- Read-only privilege checks as real client role: no direct updates.
DO $$
BEGIN
 BEGIN
  UPDATE public.zavi_cheques SET status='cleared' WHERE cheque_number='R1';
  RAISE EXCEPTION 'Client update bypassed RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;

-- Only the atomic server RPC may create non-pending or pre-settled cheques.
DO $
BEGIN
 BEGIN
  INSERT INTO public.zavi_cheques
   (id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,
    amount,issue_date,due_date,status,settled_amount,cleared_at)
  VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccc0099',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'received','FORGED-CLEARED','Bank','c1','AFN',10,
   '2026-11-10','2026-11-11','cleared',10,now());
  RAISE EXCEPTION 'Forged cleared cheque INSERT unexpectedly accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.zavi_cheques
   (id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,
    amount,issue_date,due_date,status,settled_amount)
  VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccc0098',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'received','FORGED-PARTIAL','Bank','c1','AFN',10,
   '2026-11-10','2026-11-11','partially_cleared',5);
  RAISE EXCEPTION 'Forged partly-cleared cheque INSERT unexpectedly accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $;

SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0001','deposit');

SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0002','settle',30,'a_cash');

DO $$
DECLARE n int; r bigint; s text; v numeric;
BEGIN
 SELECT pg_catalog.jsonb_array_length(payload->'tx'),revision INTO n,r
 FROM public.zavi_workspaces WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF n<>1 OR r<>2 THEN RAISE EXCEPTION 'Partial settlement did not append exactly once: %, %',n,r; END IF;
 SELECT status,settled_amount INTO s,v FROM public.zavi_cheques
 WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0001';
 IF s<>'partially_cleared' OR v<>30 THEN RAISE EXCEPTION 'Partial cheque state wrong'; END IF;
 IF (SELECT count(*) FROM public.zavi_cheque_postings)<>2
  THEN RAISE EXCEPTION 'Two balanced journal legs required'; END IF;
END $$;

-- Same operation must replay response, not a second ledger posting.
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0002','settle',30,'a_cash');
DO $$
BEGIN
 IF (SELECT revision FROM public.zavi_workspaces
  WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>2
 THEN RAISE EXCEPTION 'Idempotency replay incremented revision'; END IF;
 IF (SELECT count(*) FROM public.zavi_cheque_events WHERE operation_id=
  'eeeeeeee-eeee-4eee-8eee-eeeeeeee0002')<>1
 THEN RAISE EXCEPTION 'Replay inserted duplicate event'; END IF;
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0002','settle',50,'a_cash');
  RAISE EXCEPTION 'Different payload reused operation ID';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0030','settle',100,'a_cash');
  RAISE EXCEPTION 'Overpayment accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0031','settle',20,'fake_bank');
  RAISE EXCEPTION 'Unknown bank account accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 IF (SELECT count(*) FROM public.zavi_cheque_events)<>2
 THEN RAISE EXCEPTION 'Failed attempts wrote events'; END IF;
END $$;

SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0003','settle',70,'a_cash');
DO $$
BEGIN
 IF (SELECT status FROM public.zavi_cheques
  WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0001')<>'cleared'
 THEN RAISE EXCEPTION 'Full settlement did not clear'; END IF;
 IF (SELECT count(*) FROM public.zavi_cheque_postings)<>4
 THEN RAISE EXCEPTION 'No exactly balanced pair for each partial settlement'; END IF;
 IF (SELECT COALESCE(sum((x->>'amount')::numeric),0)
 FROM public.zavi_workspaces w, pg_catalog.jsonb_array_elements(w.payload->'tx') x
 WHERE w.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 AND x->>'type'='customer_payment' AND COALESCE(x->>'voided','false')<>'true')<>100 THEN
 RAISE EXCEPTION 'Customer balance not zero after full receipt'; END IF;
END $$;

-- Bounce must preserve the prior tx as voided audit history and reverse each
-- immutable posting without a second cash impact.
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0004','bounce');
DO $$
DECLARE w jsonb;
BEGIN
 SELECT payload INTO w FROM public.zavi_workspaces
  WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF (SELECT count(*) FROM pg_catalog.jsonb_array_elements(w->'tx') x
   WHERE x->>'voided'='true')<>2
 THEN RAISE EXCEPTION 'Bounce must void both original payment tx'; END IF;
 IF (SELECT count(*) FROM public.zavi_cheque_postings)<>8
  OR (SELECT count(*) FROM public.zavi_cheque_postings WHERE reverses_posting_id IS NOT NULL)<>4
 THEN RAISE EXCEPTION 'Bounce must record four immutable reversal legs'; END IF;
 IF (SELECT COALESCE(sum((x->>'amount')::numeric),0) FROM pg_catalog.jsonb_array_elements(w->'tx') x
 WHERE x->>'type'='customer_payment' AND COALESCE(x->>'voided','false')<>'true')<>0 THEN
  RAISE EXCEPTION 'Bounce did not restore receivable'; END IF;
 IF (SELECT settled_amount FROM public.zavi_cheques
  WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0001')<>0 THEN
  RAISE EXCEPTION 'Bounce did not reset partial amounts'; END IF;
END $$;

-- Issued cheque reverses the debit/credit direction relative to receipt.
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0002',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0005','settle',60,'a_cash');
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_cheque_postings p
  JOIN public.zavi_cheque_events e ON e.id=p.event_id
  WHERE e.operation_id='eeeeeeee-eeee-4eee-8eee-eeeeeeee0005'
   AND p.side='debit' AND p.account_code='accounts_payable:s1') THEN
   RAISE EXCEPTION 'Issued cheque debit incorrectly mapped'; END IF;
 IF (SELECT COALESCE(sum((x->>'amount')::numeric),0)
 FROM public.zavi_workspaces w, pg_catalog.jsonb_array_elements(w.payload->'tx') x
 WHERE w.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 AND x->>'type'='supplier_payment' AND COALESCE(x->>'voided','false')<>'true')<>60 THEN RAISE EXCEPTION 'Supplier payable not settled'; END IF;
END $$;

DO $$
BEGIN
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0003',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0032','settle',12.34,'a_cash');
  RAISE EXCEPTION 'Missing FX accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
END $$;
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'cccccccc-cccc-4ccc-8ccc-cccccccc0003',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeee0006','settle',12.34,'a_cash',72.345678);
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_cheque_postings p
  JOIN public.zavi_cheque_events e ON e.id=p.event_id
 WHERE e.operation_id='eeeeeeee-eeee-4eee-8eee-eeeeeeee0006' AND p.amount=892.75)
 THEN RAISE EXCEPTION 'Wrong half-up FX rounding'; END IF;
 IF (SELECT count(*) FROM public.zavi_cheque_events WHERE operation_id=
  'eeeeeeee-eeee-4eee-8eee-eeeeeeee0032')<>0 THEN
  RAISE EXCEPTION 'Failed FX attempt left an audit mutation'; END IF;
END $$;

-- Cross-tenant account and anonymous calls must be rejected even with
-- guessed cheque IDs. Test is not tied to any real Supabase Auth sessions.
SELECT pg_catalog.set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
DO $$
BEGIN
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0002',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0033','bounce');
  RAISE EXCEPTION 'Cross-tenant modification accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT pg_catalog.set_config('request.jwt.claim.sub','',false);
DO $$
BEGIN
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0002',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0034','bounce');
  RAISE EXCEPTION 'Anonymous auth claim accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT pg_catalog.set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT pg_catalog.set_config('zavi.test.license','off',false);
DO $$
BEGIN
 BEGIN
  PERFORM public.zavi_stage4_cheque_apply(
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'cccccccc-cccc-4ccc-8ccc-cccccccc0002',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeee0035','bounce');
  RAISE EXCEPTION 'Unlicensed owner accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.zavi_cheque_events)<>6 THEN
  RAISE EXCEPTION 'Unexpected audit count or leaked invalid operation'; END IF;
 IF EXISTS(SELECT event_id FROM public.zavi_cheque_postings
  GROUP BY event_id HAVING
  COALESCE(sum(amount) FILTER(WHERE side='debit'),0) <>
  COALESCE(sum(amount) FILTER(WHERE side='credit'),0))
 THEN RAISE EXCEPTION 'Unbalanced immutable journal'; END IF;
 IF (SELECT revision FROM public.zavi_workspaces
   WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>6 THEN
  RAISE EXCEPTION 'Unexpected financial workspace revision'; END IF;
END $$;
SELECT 'PASS: stage4 synthetic cheque atomic, owner, idempotence, partial/full, bounce, FX, journal' AS result;
