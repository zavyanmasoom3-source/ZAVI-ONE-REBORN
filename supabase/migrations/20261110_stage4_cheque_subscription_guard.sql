-- Stage 4 security follow-up: only an authenticated active subscriber
-- owning this workspace may register a new pending cheque.
-- Schema/policy only; no existing customer or accounting rows are changed.
BEGIN;
DROP POLICY IF EXISTS zavi_cheques_owner_insert ON public.zavi_cheques;
CREATE POLICY zavi_cheques_owner_insert
 ON public.zavi_cheques FOR INSERT TO authenticated
 WITH CHECK (
  EXISTS(SELECT 1 FROM public.zavi_workspaces AS w
   WHERE w.id=workspace_id
    AND w.owner_uid=(SELECT auth.uid())
    AND private.zavi_subscription_is_active(w.id))
  AND status='pending' AND settled_amount=0
  AND cleared_at IS NULL AND linked_transaction_id IS NULL
 );
COMMIT;
