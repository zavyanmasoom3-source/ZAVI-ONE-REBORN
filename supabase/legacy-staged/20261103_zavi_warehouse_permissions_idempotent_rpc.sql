-- ZAVI ONE staged warehouse permissions and idempotent posting. NOT APPLIED.
-- Prerequisite: clone of current production, tested backup/restore, and first apply
-- 20261103_zavi_warehouse_no_negative_guard.sql. Run pgTAP under owner, viewer,
-- anonymous, and two concurrent owners of different workspaces.
BEGIN;

-- RLS does not protect TRUNCATE. Prevent user-issued table wiping and trigger changes.
REVOKE ALL ON TABLE public.zavi_warehouses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.zavi_warehouses TO authenticated;
REVOKE ALL ON TABLE public.zavi_warehouse_movements FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.zavi_warehouse_movements TO authenticated;

CREATE OR REPLACE FUNCTION public.zavi_warehouse_post_movement(
  p_operation_id uuid,
  p_workspace_id uuid,
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_product_ref text,
  p_quantity numeric,
  p_reference text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  existing public.zavi_warehouse_movements%ROWTYPE;
  result_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_operation_id IS NULL OR p_workspace_id IS NULL THEN RAISE EXCEPTION 'Missing operation or workspace'; END IF;
  IF p_product_ref IS NULL OR length(btrim(p_product_ref)) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'Invalid product reference';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 999999999999
    OR p_quantity::text IN ('NaN', 'Infinity', '-Infinity') OR scale(p_quantity) > 4 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  IF p_from_warehouse_id IS NOT NULL AND p_to_warehouse_id IS NOT NULL AND p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Source and destination must be different';
  END IF;
  IF p_from_warehouse_id IS NULL AND p_to_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'At least one endpoint required';
  END IF;
  IF p_reference IS NOT NULL AND length(p_reference) > 150 THEN RAISE EXCEPTION 'Reference too long'; END IF;
  -- Serialize retries sharing an operation UUID BEFORE the nonnegative trigger.
  -- A BEFORE INSERT guard would otherwise reject a duplicate stock withdrawal
  -- after the first successful operation had depleted the source warehouse.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('zavi-warehouse-operation:' || p_operation_id::text, 0));
  SELECT * INTO existing FROM public.zavi_warehouse_movements WHERE id=p_operation_id;
  IF FOUND THEN
    IF existing.workspace_id IS DISTINCT FROM p_workspace_id
      OR existing.from_warehouse_id IS DISTINCT FROM p_from_warehouse_id
      OR existing.to_warehouse_id IS DISTINCT FROM p_to_warehouse_id
      OR existing.product_ref IS DISTINCT FROM p_product_ref
      OR existing.quantity IS DISTINCT FROM p_quantity
      OR existing.reference IS DISTINCT FROM p_reference
      OR existing.created_by IS DISTINCT FROM auth.uid()
    THEN RAISE EXCEPTION 'Operation ID already used with different data'; END IF;
    -- Existing row is subject to RLS and was created by this same authenticated user.
    RETURN existing.id;
  END IF;
  -- Only the real workspace owner; product must exist in the authoritative
  -- cloud payload, so the stock table cannot invent a phantom product.
  IF NOT EXISTS (
    SELECT 1 FROM public.zavi_workspaces w
    WHERE w.id=p_workspace_id AND w.owner_uid=auth.uid()
      AND EXISTS(
        SELECT 1 FROM pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(w.payload->'products')='array'
          THEN w.payload->'products' ELSE '[]'::jsonb END
        ) AS product(item) WHERE product.item->>'id'=p_product_ref
      )
  ) THEN RAISE EXCEPTION 'Workspace or product unauthorized'; END IF;
  IF p_from_warehouse_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.zavi_warehouses
     WHERE id=p_from_warehouse_id AND workspace_id=p_workspace_id AND is_active=true
  ) THEN RAISE EXCEPTION 'Source warehouse unavailable'; END IF;
  IF p_to_warehouse_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.zavi_warehouses
     WHERE id=p_to_warehouse_id AND workspace_id=p_workspace_id AND is_active=true
  ) THEN RAISE EXCEPTION 'Destination warehouse unavailable'; END IF;

  -- Stable UUID supplied by the offline sync queue ensures safe retries.
  -- The first migration's trigger enforces non-negative stock under advisory locks.
  INSERT INTO public.zavi_warehouse_movements
   (id,workspace_id,from_warehouse_id,to_warehouse_id,product_ref,quantity,reference,created_by)
  VALUES
   (p_operation_id,p_workspace_id,p_from_warehouse_id,p_to_warehouse_id,p_product_ref,p_quantity,p_reference,auth.uid())
  ON CONFLICT (id) DO NOTHING RETURNING id INTO result_id;
  IF result_id IS NOT NULL THEN RETURN result_id; END IF;
  SELECT * INTO existing FROM public.zavi_warehouse_movements WHERE id=p_operation_id;
  IF NOT FOUND
    OR existing.workspace_id IS DISTINCT FROM p_workspace_id
    OR existing.from_warehouse_id IS DISTINCT FROM p_from_warehouse_id
    OR existing.to_warehouse_id IS DISTINCT FROM p_to_warehouse_id
    OR existing.product_ref IS DISTINCT FROM p_product_ref
    OR existing.quantity IS DISTINCT FROM p_quantity
    OR existing.reference IS DISTINCT FROM p_reference
    OR existing.created_by IS DISTINCT FROM auth.uid()
  THEN RAISE EXCEPTION 'Operation ID already used with different data'; END IF;
  RETURN existing.id;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.zavi_warehouse_post_movement(uuid,uuid,uuid,uuid,text,numeric,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zavi_warehouse_post_movement(uuid,uuid,uuid,uuid,text,numeric,text)
  TO authenticated;
COMMIT;

-- Rollback (keep safe grants, never restore TRUNCATE to client roles):
-- DROP FUNCTION IF EXISTS public.zavi_warehouse_post_movement(uuid,uuid,uuid,uuid,text,numeric,text);
-- IMPORTANT: do not start warehouse movement UI until both migrations pass
-- concurrent overspend, idempotent retry, unauthorized tenant, revoked warehouse,
-- and offline replay tests on a restored clone.
