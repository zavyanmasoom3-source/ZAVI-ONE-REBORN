-- STAGING ONLY / NOT PRODUCTION DEPLOYABLE WITHOUT SIGN-OFF.
-- Run on disposable PostgreSQL 17 with synthetic accounts, never real ledgers.
-- All updates, the workspace revision and immutable balanced postings are atomic.
-- Based on live 2026-11-10 schema. Keep this file OUT of supabase/migrations.
BEGIN;

ALTER TABLE public.zavi_cheques
  ADD COLUMN IF NOT EXISTS settled_amount numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE public.zavi_cheques
  DROP CONSTRAINT IF EXISTS zavi_cheque_initial_pending;
ALTER TABLE public.zavi_cheques
  DROP CONSTRAINT IF EXISTS zavi_cheques_status_check;
ALTER TABLE public.zavi_cheques
  ADD CONSTRAINT zavi_cheques_status_check
  CHECK (status IN ('pending','deposited','partially_cleared','cleared','bounced','cancelled'));
ALTER TABLE public.zavi_cheques
  ADD CONSTRAINT zavi_cheques_settlement_invariants
  CHECK (settled_amount >= 0 AND settled_amount <= amount
    AND (status <> 'cleared' OR settled_amount = amount)
    AND (status <> 'partially_cleared' OR (settled_amount > 0 AND settled_amount < amount))
    AND (status NOT IN ('pending','deposited','cancelled','bounced') OR settled_amount = 0)
    AND (status <> 'cleared' OR cleared_at IS NOT NULL)
    AND (status = 'cleared' OR cleared_at IS NULL));

ALTER TABLE public.zavi_cheque_events
  ADD COLUMN IF NOT EXISTS operation_id uuid,
  ADD COLUMN IF NOT EXISTS actor_uid uuid,
  ADD COLUMN IF NOT EXISTS request_data jsonb,
  ADD COLUMN IF NOT EXISTS response_data jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS zavi_stage4_event_idempotency
  ON public.zavi_cheque_events(workspace_id,operation_id)
  WHERE operation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.zavi_cheque_postings (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.zavi_workspaces(id),
  cheque_id uuid NOT NULL REFERENCES public.zavi_cheques(id),
  event_id uuid NOT NULL REFERENCES public.zavi_cheque_events(id),
  side text NOT NULL CHECK (side IN ('debit','credit')),
  account_code text NOT NULL CHECK (length(account_code) BETWEEN 3 AND 160),
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  reverses_posting_id uuid REFERENCES public.zavi_cheque_postings(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS zavi_stage4_no_repeat_reversal
  ON public.zavi_cheque_postings(reverses_posting_id)
  WHERE reverses_posting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS zavi_stage4_postings_cheque
  ON public.zavi_cheque_postings(workspace_id,cheque_id,event_id);
ALTER TABLE public.zavi_cheque_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS zavi_stage4_owner_posting_read ON public.zavi_cheque_postings;
CREATE POLICY zavi_stage4_owner_posting_read ON public.zavi_cheque_postings
 FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.zavi_workspaces w
   WHERE w.id=workspace_id AND w.owner_uid=(SELECT auth.uid())));
REVOKE ALL ON public.zavi_cheque_postings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.zavi_cheque_postings TO authenticated;

-- Uses the actual JSONB workspace ledger (currency, accounts, contacts, tx).
-- Refuses unsupported/invalid historical amounts rather than assuming 0.
CREATE OR REPLACE FUNCTION public.zavi_stage4_cheque_balance(
 p_payload jsonb, p_counterparty text, p_direction text
) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $fn$
DECLARE c jsonb; t jsonb; i jsonb; v numeric:=0; n numeric; paid numeric;
BEGIN
 IF p_direction NOT IN ('received','issued') OR p_counterparty IS NULL
    OR pg_catalog.jsonb_typeof(p_payload->'contacts') <> 'array'
    OR pg_catalog.jsonb_typeof(p_payload->'tx') <> 'array' THEN
  RAISE EXCEPTION 'INVALID_LEDGER' USING ERRCODE='22023';
 END IF;
 SELECT x INTO c FROM pg_catalog.jsonb_array_elements(p_payload->'contacts') x
 WHERE x->>'id'=p_counterparty LIMIT 1;
 IF c IS NULL THEN RAISE EXCEPTION 'COUNTERPARTY_NOT_FOUND' USING ERRCODE='22023'; END IF;
 v:=COALESCE(NULLIF(c->>(CASE WHEN p_direction='received' THEN 'openingReceivable'
                          ELSE 'openingPayable' END),''),'0')::numeric;
 FOR t IN SELECT value FROM pg_catalog.jsonb_array_elements(p_payload->'tx')
 LOOP
  IF t->>'contactId' IS DISTINCT FROM p_counterparty OR
       COALESCE(t->>'voided','false')='true' THEN CONTINUE; END IF;
  IF t->>'type' IN ('sale','sale_return','purchase','purchase_return') THEN
   IF t->>'purchaseSchemaVersion'='2' AND t ? 'accountingTotal' THEN
    n:=(t->>'accountingTotal')::numeric;
   ELSE
    n:=0;
    FOR i IN SELECT value FROM pg_catalog.jsonb_array_elements(
      CASE WHEN pg_catalog.jsonb_typeof(t->'items')='array' THEN t->'items' ELSE '[]'::jsonb END
    ) LOOP
     n:=n+COALESCE(NULLIF(i->>'qty',''),'0')::numeric*
       COALESCE(NULLIF(i->>'price',''),'0')::numeric;
    END LOOP;
    n:=pg_catalog.round(n-COALESCE(NULLIF(t->>'discount',''),'0')::numeric+
       CASE WHEN t->>'type'='purchase'
         THEN COALESCE(NULLIF(t->>'shipping',''),'0')::numeric ELSE 0 END,2);
   END IF;
   paid:=COALESCE(NULLIF(t->>'paid',''),'0')::numeric;
   n:=pg_catalog.round(n-paid,2);
   IF p_direction='received' AND t->>'type'='sale' THEN v:=v+n;
   ELSIF p_direction='received' AND t->>'type'='sale_return' THEN v:=v-n;
   ELSIF p_direction='issued' AND t->>'type'='purchase' THEN v:=v+n;
   ELSIF p_direction='issued' AND t->>'type'='purchase_return' THEN v:=v-n;
   END IF;
  ELSIF p_direction='received' THEN
   IF t->>'type'='customer_payment' THEN
     v:=v-COALESCE(NULLIF(t->>'amount',''),'0')::numeric;
   ELSIF t->>'type'='customer_loan' THEN
     v:=v+COALESCE(NULLIF(t->>'amount',''),'0')::numeric; END IF;
  ELSE
   IF t->>'type'='supplier_payment' THEN
     v:=v-COALESCE(NULLIF(t->>'amount',''),'0')::numeric;
   ELSIF t->>'type' IN ('creditor_loan','supplier_debt') THEN
     v:=v+COALESCE(NULLIF(t->>'amount',''),'0')::numeric; END IF;
  END IF;
  v:=pg_catalog.round(v,2);
 END LOOP;
 RETURN v;
END $fn$;

CREATE OR REPLACE FUNCTION public.zavi_stage4_cheque_apply(
 p_workspace uuid, p_cheque uuid, p_operation uuid, p_kind text,
 p_amount numeric DEFAULT NULL, p_account text DEFAULT NULL,
 p_exchange_rate numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
  ws record; ch record; prior record; e record; posting record;
  v_request jsonb; v_response jsonb; v_new_status text;
  v_amount numeric; v_base_amount numeric; v_debt numeric;
  v_currency text; v_account jsonb; v_txid text; v_tx jsonb;
  v_txs jsonb; v_reversed_count integer:=0; v_settled numeric;
  v_actor uuid:=auth.uid(); v_total_debit numeric:=0; v_total_credit numeric:=0;
  v_p_1 uuid; v_p_2 uuid; v_from text; v_to text;
BEGIN
 IF v_actor IS NULL OR p_workspace IS NULL OR p_cheque IS NULL OR p_operation IS NULL
   OR p_kind IS NULL OR p_kind NOT IN ('deposit','settle','bounce','cancel') THEN
  RAISE EXCEPTION 'INVALID_OR_UNAUTHENTICATED_REQUEST' USING ERRCODE='42501';
 END IF;
 -- Lock order workspace -> cheque -> operations is consistent for racing callers.
 SELECT id,owner_uid,payload,revision INTO ws
 FROM public.zavi_workspaces WHERE id=p_workspace FOR UPDATE;
 IF NOT FOUND OR ws.owner_uid IS DISTINCT FROM v_actor THEN
  RAISE EXCEPTION 'WORKSPACE_OWNER_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF NOT private.zavi_subscription_is_active(p_workspace) THEN
  RAISE EXCEPTION 'ACTIVE_SUBSCRIPTION_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF pg_catalog.jsonb_typeof(ws.payload->'tx') <> 'array'
   OR pg_catalog.jsonb_typeof(ws.payload->'accounts') <> 'array'
   OR pg_catalog.jsonb_typeof(ws.payload->'contacts') <> 'array'
   OR COALESCE(ws.payload->>'currency','') !~ '^[A-Z]{3}$' THEN
  RAISE EXCEPTION 'WORKSPACE_LEDGER_NOT_READY' USING ERRCODE='22023';
 END IF;
 v_request:=pg_catalog.jsonb_build_object('workspace_id',p_workspace,
  'cheque_id',p_cheque,'operation_id',p_operation,'kind',p_kind,
  'amount',p_amount,'account',p_account,'exchange_rate',p_exchange_rate);
 SELECT * INTO prior FROM public.zavi_cheque_events
   WHERE workspace_id=p_workspace AND operation_id=p_operation;
 IF FOUND THEN
  IF prior.request_data IS DISTINCT FROM v_request THEN
   RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED' USING ERRCODE='23505';
  END IF;
  RETURN prior.response_data;
 END IF;
 SELECT * INTO ch FROM public.zavi_cheques
 WHERE id=p_cheque AND workspace_id=p_workspace FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CHEQUE_NOT_FOUND' USING ERRCODE='22023'; END IF;
 v_currency:=ws.payload->>'currency';
 v_settled:=ch.settled_amount;
 v_new_status:=ch.status;
 IF p_kind='settle' THEN
  IF ch.status NOT IN ('pending','deposited','partially_cleared')
    OR ch.amount<>pg_catalog.round(ch.amount,2)
    OR p_amount IS NULL OR p_amount<=0 OR p_amount<>pg_catalog.round(p_amount,2)
    OR p_amount>ch.amount-v_settled THEN
   RAISE EXCEPTION 'INVALID_SETTLEMENT_AMOUNT_OR_STATE' USING ERRCODE='22023';
  END IF;
  IF p_account IS NULL OR length(p_account) NOT BETWEEN 1 AND 90 THEN
   RAISE EXCEPTION 'INVALID_ACCOUNT' USING ERRCODE='22023';
  END IF;
  SELECT x INTO v_account FROM pg_catalog.jsonb_array_elements(ws.payload->'accounts') x
   WHERE x->>'id'=p_account LIMIT 1;
  IF v_account IS NULL OR (v_account ? 'currency' AND v_account->>'currency'<>v_currency) THEN
   RAISE EXCEPTION 'ACCOUNT_NOT_IN_BASE_CURRENCY' USING ERRCODE='22023';
  END IF;
  IF ch.currency=v_currency THEN
   IF p_exchange_rate IS NOT NULL AND p_exchange_rate<>1 THEN
    RAISE EXCEPTION 'UNNECESSARY_FX_RATE' USING ERRCODE='22023'; END IF;
   v_base_amount:=p_amount;
  ELSE
   IF p_exchange_rate IS NULL OR p_exchange_rate<=0 OR p_exchange_rate>100000000
      OR p_exchange_rate<>pg_catalog.round(p_exchange_rate,6) THEN
    RAISE EXCEPTION 'VALID_FX_RATE_REQUIRED' USING ERRCODE='22023';
   END IF;
   v_base_amount:=pg_catalog.round(p_amount*p_exchange_rate,2);
  END IF;
  IF v_base_amount<=0 OR v_base_amount>=100000000000000 THEN
   RAISE EXCEPTION 'INVALID_BASE_AMOUNT' USING ERRCODE='22023'; END IF;
  v_debt:=public.zavi_stage4_cheque_balance(ws.payload,ch.counterparty_id,ch.direction);
  IF v_base_amount>v_debt THEN
   RAISE EXCEPTION 'SETTLEMENT_EXCEEDS_COUNTERPARTY_BALANCE' USING ERRCODE='22023';
  END IF;
  v_txid:='cheque:'||ch.id::text||':'||p_operation::text;
  IF EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(ws.payload->'tx') x
     WHERE x->>'id'=v_txid) THEN
   RAISE EXCEPTION 'EXISTING_TRANSACTION_CONFLICT' USING ERRCODE='23505';
  END IF;
  v_tx:=pg_catalog.jsonb_build_object(
    'id',v_txid,'code','CHQ-'||pg_catalog.left(p_operation::text,8),
    'type',CASE WHEN ch.direction='received' THEN 'customer_payment' ELSE 'supplier_payment' END,
    'amount',v_base_amount,'accountId',p_account,'contactId',ch.counterparty_id,
    'date',pg_catalog.to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD'),
    'created',now(),'note','Cheque settlement (server confirmed)',
    'originalAmount',p_amount,'originalCurrency',ch.currency,
    'exchangeRate',CASE WHEN ch.currency=v_currency THEN 1 ELSE p_exchange_rate END,
    'chequeId',p_cheque,'chequeOperationId',p_operation);
  v_new_status:=CASE WHEN ch.amount=v_settled+p_amount
    THEN 'cleared' ELSE 'partially_cleared' END;
 ELSIF p_kind='deposit' THEN
  IF ch.status<>'pending' THEN
   RAISE EXCEPTION 'DEPOSIT_REQUIRES_PENDING' USING ERRCODE='22023'; END IF;
  v_new_status:='deposited';
 ELSIF p_kind='cancel' THEN
  IF ch.status<>'pending' OR v_settled<>0 THEN
   RAISE EXCEPTION 'CANNOT_CANCEL_SETTLED_CHEQUE' USING ERRCODE='22023'; END IF;
  v_new_status:='cancelled';
 ELSIF p_kind='bounce' THEN
  IF ch.status NOT IN ('pending','deposited','partially_cleared','cleared') THEN
   RAISE EXCEPTION 'INVALID_BOUNCE_STATE' USING ERRCODE='22023'; END IF;
  v_new_status:='bounced';
 END IF;
 IF p_kind<>'settle' AND (p_amount IS NOT NULL OR p_account IS NOT NULL OR p_exchange_rate IS NOT NULL) THEN
  RAISE EXCEPTION 'UNEXPECTED_OPERATION_PARAMETERS' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.zavi_cheque_events
   (id,workspace_id,cheque_id,old_status,new_status,note,occurred_at,
    operation_id,actor_uid,request_data,response_data)
 VALUES (pg_catalog.gen_random_uuid(),p_workspace,p_cheque,ch.status,v_new_status,
    'Stage 4 atomic cheque operation',now(),p_operation,v_actor,v_request,'{}'::jsonb)
 RETURNING id INTO e;
 IF p_kind='settle' THEN
  -- Immutable, balanced debit / credit pair. Posting sums checked below.
  v_from:=CASE WHEN ch.direction='received' THEN 'bank:'||p_account
     ELSE 'accounts_payable:'||ch.counterparty_id END;
  v_to:=CASE WHEN ch.direction='received' THEN 'accounts_receivable:'||ch.counterparty_id
     ELSE 'bank:'||p_account END;
  INSERT INTO public.zavi_cheque_postings
    (workspace_id,cheque_id,event_id,side,account_code,amount,currency)
  VALUES (p_workspace,p_cheque,e.id,'debit',v_from,v_base_amount,v_currency),
         (p_workspace,p_cheque,e.id,'credit',v_to,v_base_amount,v_currency);
  UPDATE public.zavi_workspaces
   SET payload=pg_catalog.jsonb_set(payload,'{tx}',payload->'tx'||pg_catalog.jsonb_build_array(v_tx)),
    revision=revision+1,updated_at=now()
   WHERE id=p_workspace;
  v_settled:=v_settled+p_amount;
 ELSIF p_kind='bounce' THEN
  v_txs:=ws.payload->'tx';
  FOR prior IN
   SELECT id,operation_id FROM public.zavi_cheque_events
   WHERE workspace_id=p_workspace AND cheque_id=p_cheque
      AND new_status IN ('partially_cleared','cleared') AND operation_id IS NOT NULL
   ORDER BY occurred_at,id
  LOOP
   v_txid:='cheque:'||p_cheque::text||':'||prior.operation_id::text;
   IF NOT EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(v_txs) x
      WHERE x->>'id'=v_txid AND COALESCE(x->>'voided','false')<>'true') THEN
    RAISE EXCEPTION 'MISSING_OR_VOIDED_CHEQUE_TRANSACTION' USING ERRCODE='22023';
   END IF;
   SELECT pg_catalog.jsonb_agg(
      CASE WHEN x->>'id'=v_txid THEN x||pg_catalog.jsonb_build_object(
        'voided',true,'voidReason','Cheque bounced - reversal in immutable postings',
        'voidedAt',now(),'reversalOperationId',p_operation) ELSE x END)
    INTO v_txs FROM pg_catalog.jsonb_array_elements(v_txs) x;
   IF (SELECT count(*) FROM public.zavi_cheque_postings
     WHERE event_id=prior.id AND reverses_posting_id IS NULL)<>2 THEN
    RAISE EXCEPTION 'SETTLEMENT_POSTINGS_CORRUPT' USING ERRCODE='22023';
   END IF;
   FOR posting IN SELECT * FROM public.zavi_cheque_postings
      WHERE event_id=prior.id AND reverses_posting_id IS NULL
   LOOP
     INSERT INTO public.zavi_cheque_postings
       (workspace_id,cheque_id,event_id,side,account_code,amount,currency,reverses_posting_id)
     VALUES(p_workspace,p_cheque,e.id,
       CASE WHEN posting.side='debit' THEN 'credit' ELSE 'debit' END,
       posting.account_code,posting.amount,posting.currency,posting.id);
     v_reversed_count:=v_reversed_count+1;
   END LOOP;
  END LOOP;
  IF v_settled>0 AND v_reversed_count=0 THEN
   RAISE EXCEPTION 'SETTLED_CHEQUE_WITHOUT_POSTINGS' USING ERRCODE='22023';
  END IF;
  IF v_reversed_count>0 THEN
   UPDATE public.zavi_workspaces
     SET payload=pg_catalog.jsonb_set(payload,'{tx}',v_txs),
      revision=revision+1,updated_at=now()
     WHERE id=p_workspace;
  END IF;
  v_settled:=0;
 END IF;
 UPDATE public.zavi_cheques
 SET status=v_new_status,settled_amount=v_settled,
     cleared_at=CASE WHEN v_new_status='cleared' THEN now() ELSE NULL END,
     linked_transaction_id=CASE WHEN p_kind='settle' THEN
       COALESCE(linked_transaction_id,v_tx->>'id') ELSE linked_transaction_id END
 WHERE id=p_cheque AND workspace_id=p_workspace;
 SELECT COALESCE(sum(amount) FILTER(WHERE side='debit'),0),
        COALESCE(sum(amount) FILTER(WHERE side='credit'),0)
 INTO v_total_debit,v_total_credit FROM public.zavi_cheque_postings WHERE event_id=e.id;
 IF v_total_debit<>v_total_credit THEN
  RAISE EXCEPTION 'UNBALANCED_JOURNAL_ABORT' USING ERRCODE='23514';
 END IF;
 v_response:=pg_catalog.jsonb_build_object('ok',true,'workspace_id',p_workspace,
  'cheque_id',p_cheque,'operation_id',p_operation,'status',v_new_status,
  'settled_amount',v_settled,'posting_count',
    (SELECT count(*) FROM public.zavi_cheque_postings WHERE event_id=e.id),
  'ledger_revision',(SELECT revision FROM public.zavi_workspaces WHERE id=p_workspace),
  'transaction_id',CASE WHEN p_kind='settle' THEN v_tx->>'id' ELSE null END);
 UPDATE public.zavi_cheque_events SET response_data=v_response WHERE id=e.id;
 RETURN v_response;
END $fn$;

REVOKE ALL ON FUNCTION public.zavi_stage4_cheque_apply(uuid,uuid,uuid,text,numeric,text,numeric)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.zavi_stage4_cheque_apply(uuid,uuid,uuid,text,numeric,text,numeric)
 TO authenticated;
REVOKE ALL ON FUNCTION public.zavi_stage4_cheque_balance(jsonb,text,text)
 FROM PUBLIC,anon,authenticated;

-- Do not weaken existing direct client write restrictions.
REVOKE UPDATE,DELETE ON public.zavi_cheques FROM authenticated,anon;
REVOKE INSERT,UPDATE,DELETE ON public.zavi_cheque_events FROM authenticated,anon;

COMMIT;
