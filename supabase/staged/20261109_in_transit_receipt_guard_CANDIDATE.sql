-- CANDIDATE ONLY. NOT DEPLOYED. NOT IN supabase/migrations.
-- Work on a restorable staging clone with disposable customers/warehouses FIRST.
-- Guards existing v671 receipt RPC's overdelivery path without deleting invoices.
-- The trigger intentionally blocks overreceipt instead of treating extra goods as
-- sellable inventory before a signed discrepancy/credit/return workflow exists.
BEGIN;
CREATE OR REPLACE FUNCTION public.zavi_in_transit_receipt_quantity_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $zavi$
DECLARE
  v_order public.zavi_in_transit_orders%ROWTYPE;
  v_line public.zavi_in_transit_lines%ROWTYPE;
  v_movement public.zavi_warehouse_movements%ROWTYPE;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Receipts are append-only' USING ERRCODE='23514';
  END IF;
  IF (SELECT auth.uid()) IS NULL OR NEW.created_by IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Authenticated owner required' USING ERRCODE='42501';
  END IF;
  -- Match the existing RPC lock order: order first, line second. Competing
  -- receipts cannot both spend the same outstanding quantity.
  SELECT * INTO v_order FROM public.zavi_in_transit_orders
    WHERE id=NEW.order_id AND workspace_id=NEW.workspace_id FOR UPDATE;
  IF NOT FOUND OR v_order.status IN ('cancelled','received') OR
     v_order.destination_warehouse_id IS DISTINCT FROM NEW.warehouse_id THEN
    RAISE EXCEPTION 'Invalid or closed receiving order' USING ERRCODE='23514';
  END IF;
  SELECT * INTO v_line FROM public.zavi_in_transit_lines
    WHERE id=NEW.line_id AND order_id=NEW.order_id
      AND workspace_id=NEW.workspace_id FOR UPDATE;
  IF NOT FOUND OR NEW.product_ref IS NULL OR length(btrim(NEW.product_ref))=0 OR
     (v_line.product_ref IS NOT NULL AND v_line.product_ref IS DISTINCT FROM NEW.product_ref) THEN
    RAISE EXCEPTION 'Invalid product mapping' USING ERRCODE='23514';
  END IF;
  IF NEW.quantity IS NULL OR NEW.quantity<=0 OR
     NEW.quantity::text IN ('NaN','Infinity','-Infinity') OR
     scale(NEW.quantity)>4 OR
     NEW.quantity>(v_line.ordered_qty-v_line.received_qty) OR
     coalesce(NEW.discrepancy_qty,0)<>0 THEN
    RAISE EXCEPTION 'Receipt exceeds remaining ordered quantity'
      USING ERRCODE='23514';
  END IF;
  -- Receipt must be backed by the exact same warehouse movement. This
  -- guards direct table writes from creating a fake receipt without stock.
  SELECT * INTO v_movement FROM public.zavi_warehouse_movements
    WHERE id=NEW.warehouse_movement_id AND workspace_id=NEW.workspace_id;
  IF NOT FOUND OR v_movement.from_warehouse_id IS NOT NULL OR
     v_movement.to_warehouse_id IS DISTINCT FROM NEW.warehouse_id OR
     v_movement.product_ref IS DISTINCT FROM NEW.product_ref OR
     v_movement.quantity IS DISTINCT FROM NEW.quantity OR
     v_movement.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Unmatched warehouse movement' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END
$zavi$;
REVOKE ALL ON FUNCTION public.zavi_in_transit_receipt_quantity_guard() FROM PUBLIC,anon,authenticated;
DO $trigger$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid='public.zavi_in_transit_receipts'::regclass
      AND tgname='zavi_in_transit_receipt_quantity_guard'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER zavi_in_transit_receipt_quantity_guard
      BEFORE INSERT ON public.zavi_in_transit_receipts FOR EACH ROW
      EXECUTE FUNCTION public.zavi_in_transit_receipt_quantity_guard();
  END IF;
END
$trigger$;
COMMIT;

-- STAGING acceptance gates BEFORE deployment:
-- 1. backup/restore & no existing invalid historical receipt
-- 2. owner vs unauthorized authenticated user, anon and other tenants
-- 3. two concurrent receipts competing for last stock (one must rollback)
-- 4. duplicate UUID with identical payload, collision with changed payload
-- 5. cancelled/received, wrong warehouse, unmapped product, missing movement
-- 6. purchase return accounting and historical legacy stock reconciliation
-- No data rewrite or production deployment is authorized by this file.
