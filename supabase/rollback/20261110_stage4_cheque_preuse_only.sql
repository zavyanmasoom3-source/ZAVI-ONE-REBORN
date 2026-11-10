-- ROLLBACK PRE-USE ONLY. Never run after ANY Stage 4 settlement or event.
-- Does not delete customer, workspace, cheque, journal or accounting rows.
-- Refuses changes if ANY cheque has left pending or an event/posting exists.
BEGIN;
DO $fn$
BEGIN
 IF EXISTS(SELECT 1 FROM public.zavi_cheque_events WHERE operation_id IS NOT NULL)
   OR EXISTS(SELECT 1 FROM public.zavi_cheque_postings)
   OR EXISTS(SELECT 1 FROM public.zavi_cheques
       WHERE status<>'pending' OR settled_amount<>0
        OR cleared_at IS NOT NULL OR linked_transaction_id IS NOT NULL)
 THEN
  RAISE EXCEPTION 'STAGE4_ALREADY_USED_BACKUP_AND_MANUAL_RECONCILIATION_REQUIRED'
    USING ERRCODE='55000';
 END IF;
END $fn$;
DROP FUNCTION IF EXISTS public.zavi_stage4_cheque_apply(uuid,uuid,uuid,text,numeric,text,numeric);
DROP FUNCTION IF EXISTS public.zavi_stage4_cheque_balance(jsonb,text,text);
DROP TABLE public.zavi_cheque_postings;
DROP INDEX IF EXISTS public.zavi_stage4_event_idempotency;
ALTER TABLE public.zavi_cheque_events
 DROP COLUMN operation_id, DROP COLUMN actor_uid,
 DROP COLUMN request_data, DROP COLUMN response_data;
ALTER TABLE public.zavi_cheques
 DROP CONSTRAINT zavi_cheques_settlement_invariants,
 DROP CONSTRAINT zavi_cheques_status_check;
ALTER TABLE public.zavi_cheques ADD CONSTRAINT zavi_cheques_status_check
 CHECK(status IN ('pending','deposited','cleared','bounced','cancelled'));
ALTER TABLE public.zavi_cheques ADD CONSTRAINT zavi_cheque_initial_pending
 CHECK(status='pending' AND cleared_at IS NULL AND linked_transaction_id IS NULL);
DROP POLICY IF EXISTS zavi_cheques_owner_insert ON public.zavi_cheques;
CREATE POLICY zavi_cheques_owner_insert ON public.zavi_cheques FOR INSERT TO authenticated
 WITH CHECK (
 EXISTS(SELECT 1 FROM public.zavi_workspaces w
  WHERE w.id=workspace_id AND w.owner_uid=(SELECT auth.uid()))
 AND status='pending' AND cleared_at IS NULL AND linked_transaction_id IS NULL
 );
ALTER TABLE public.zavi_cheques DROP COLUMN settled_amount;
COMMIT;
