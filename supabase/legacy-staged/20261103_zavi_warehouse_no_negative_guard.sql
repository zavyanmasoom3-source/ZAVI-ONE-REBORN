-- ZAVI ONE staged migration. NOT applied to production.
-- Preconditions: verified restorable database backup, test on clone, RLS/tenant tests.
-- The existing zavi_warehouse_movements ledger is append-only for authenticated users.
-- Owner-only row access remains controlled by existing RLS policies.
BEGIN;
CREATE OR REPLACE FUNCTION public.zavi_warehouse_no_negative_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $func$
DECLARE
  v_source text;
  v_dest text;
  v_lock text;
  v_available numeric;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Warehouse movements must be append-only';
  END IF;
  -- Lock both affected stock buckets in consistent lexical order.
  -- Prevent two concurrent transfers from simultaneously spending the same stock.
  IF NEW.from_warehouse_id IS NOT NULL THEN
    v_source := NEW.workspace_id::text || ':' ||
                NEW.from_warehouse_id::text || ':' || NEW.product_ref;
  END IF;
  IF NEW.to_warehouse_id IS NOT NULL THEN
    v_dest := NEW.workspace_id::text || ':' ||
              NEW.to_warehouse_id::text || ':' || NEW.product_ref;
  END IF;
  FOR v_lock IN
    SELECT lock_key
    FROM (SELECT unnest(ARRAY[v_source,v_dest]) AS lock_key) AS keys
    WHERE lock_key IS NOT NULL
    ORDER BY lock_key
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_lock, 0));
  END LOOP;
  IF NEW.from_warehouse_id IS NOT NULL THEN
    SELECT coalesce(sum(
      CASE WHEN m.to_warehouse_id = NEW.from_warehouse_id THEN m.quantity
           WHEN m.from_warehouse_id = NEW.from_warehouse_id THEN -m.quantity
           ELSE 0 END
    ), 0)
    INTO v_available
    FROM public.zavi_warehouse_movements AS m
    WHERE m.workspace_id = NEW.workspace_id
      AND m.product_ref = NEW.product_ref
      AND (m.from_warehouse_id = NEW.from_warehouse_id
           OR m.to_warehouse_id = NEW.from_warehouse_id);
    IF v_available < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient warehouse stock: available %, requested %',
          v_available, NEW.quantity USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;
REVOKE ALL ON FUNCTION public.zavi_warehouse_no_negative_guard() FROM PUBLIC;
DROP TRIGGER IF EXISTS zavi_warehouse_before_movement_guard
  ON public.zavi_warehouse_movements;
CREATE TRIGGER zavi_warehouse_before_movement_guard
BEFORE INSERT ON public.zavi_warehouse_movements
FOR EACH ROW EXECUTE FUNCTION public.zavi_warehouse_no_negative_guard();
COMMIT;

-- Rollback after review:
-- BEGIN;
-- DROP TRIGGER IF EXISTS zavi_warehouse_before_movement_guard ON public.zavi_warehouse_movements;
-- DROP FUNCTION IF EXISTS public.zavi_warehouse_no_negative_guard();
-- COMMIT;
--
-- Test checklist on a separate clone before deployment:
-- (1) owner inserts a stock receipt, then a valid transfer;
-- (2) overspend rejected without inserting rows;
-- (3) two concurrent overspends cannot both commit;
-- (4) cross-tenant insert and ordinary colleague insert fail under RLS;
-- (5) unmodified historical invoices remain readable;
-- (6) retry/idempotency and out-of-order offline sync require separate work.
