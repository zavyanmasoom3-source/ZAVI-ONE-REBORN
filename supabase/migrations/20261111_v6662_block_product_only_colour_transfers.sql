-- V66.62 fail-closed guard for legacy product-only warehouse RPC.
-- ADDITIVE: no table rewrite, no customer payload changes, no historical row update.
-- Colour stock movements are journal events in the CAS-protected workspace
-- snapshot, not rows with only product_ref in the old warehouse movement table.
CREATE OR REPLACE FUNCTION public.zavi_warehouse_guard_colour_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.zavi_workspaces AS w
    CROSS JOIN LATERAL pg_catalog.jsonb_array_elements(
      CASE WHEN pg_catalog.jsonb_typeof(w.payload -> 'products') = 'array'
       THEN w.payload -> 'products' ELSE '[]'::jsonb END
    ) AS item(product)
    WHERE w.id = NEW.workspace_id
      AND item.product ->> 'id' = NEW.product_ref
      AND (
        item.product #>> '{variantLedger,version}' = '1'
        OR nullif(item.product #>> '{industryDetails,values,colorVariants}','') IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'Colour variants require warehouse-specific accounting journal'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.zavi_warehouse_guard_colour_product() FROM PUBLIC;
DROP TRIGGER IF EXISTS zavi_warehouse_guard_colour_product_before_insert
  ON public.zavi_warehouse_movements;
CREATE TRIGGER zavi_warehouse_guard_colour_product_before_insert
  BEFORE INSERT ON public.zavi_warehouse_movements
  FOR EACH ROW EXECUTE FUNCTION public.zavi_warehouse_guard_colour_product();

-- Rollback, if absolutely necessary after review:
-- DROP TRIGGER IF EXISTS zavi_warehouse_guard_colour_product_before_insert
--   ON public.zavi_warehouse_movements;
-- DROP FUNCTION IF EXISTS public.zavi_warehouse_guard_colour_product();
