-- Disposable PostgreSQL 17 ONLY. Synthetic IDs. Never connects to Supabase.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.zavi_in_transit_orders(id uuid PRIMARY KEY, workspace_id uuid NOT NULL,destination_warehouse_id uuid NOT NULL,status text NOT NULL);
CREATE TABLE public.zavi_in_transit_lines(id uuid PRIMARY KEY,order_id uuid NOT NULL,workspace_id uuid NOT NULL,product_ref text,ordered_qty numeric NOT NULL,received_qty numeric NOT NULL DEFAULT 0);
CREATE TABLE public.zavi_warehouse_movements(id uuid PRIMARY KEY,workspace_id uuid NOT NULL,from_warehouse_id uuid,to_warehouse_id uuid,product_ref text NOT NULL,quantity numeric NOT NULL,created_by uuid NOT NULL);
CREATE TABLE public.zavi_in_transit_receipts(id uuid PRIMARY KEY,order_id uuid NOT NULL,line_id uuid NOT NULL,workspace_id uuid NOT NULL,warehouse_id uuid NOT NULL,product_ref text NOT NULL,quantity numeric NOT NULL,discrepancy_qty numeric NOT NULL DEFAULT 0,warehouse_movement_id uuid NOT NULL,created_by uuid NOT NULL);
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
INSERT INTO public.zavi_in_transit_orders VALUES
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','ordered'),
('11111111-1111-4111-8111-111111111112','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','partially_received');
INSERT INTO public.zavi_in_transit_lines VALUES
('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','product-1',3,0),
('44444444-4444-4444-8444-444444444445','11111111-1111-4111-8111-111111111112','22222222-2222-4222-8222-222222222222','product-1',3,2);
\i supabase/staged/20261109_in_transit_receipt_guard_CANDIDATE.sql
DO $$BEGIN
 IF (SELECT count(*) FROM public.zavi_warehouse_movements)<>0 THEN RAISE EXCEPTION 'ORDER_CREATED_STOCK';END IF;
 RAISE NOTICE 'PASS PG: in transit order adds no stock';
END$$;
INSERT INTO public.zavi_warehouse_movements VALUES
('55555555-5555-4555-8555-555555555551','22222222-2222-4222-8222-222222222222',NULL,'33333333-3333-4333-8333-333333333333','product-1',2,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
INSERT INTO public.zavi_in_transit_receipts VALUES
('66666666-6666-4666-8666-666666666661','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',2,0,'55555555-5555-4555-8555-555555555551','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
UPDATE public.zavi_in_transit_lines SET received_qty=2 WHERE id='44444444-4444-4444-8444-444444444444';
UPDATE public.zavi_in_transit_orders SET status='partially_received' WHERE id='11111111-1111-4111-8111-111111111111';
DO $$BEGIN
 IF(SELECT sum(quantity) FROM public.zavi_warehouse_movements)<>2 THEN RAISE EXCEPTION 'PARTIAL_RECEIPT_BAD';END IF;
 RAISE NOTICE 'PASS PG: 2 units received; 1 unit remains';
END$$;
DO $$BEGIN
 BEGIN
  INSERT INTO public.zavi_warehouse_movements VALUES
  ('55555555-5555-4555-8555-555555555552','22222222-2222-4222-8222-222222222222',NULL,'33333333-3333-4333-8333-333333333333','product-1',2,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  INSERT INTO public.zavi_in_transit_receipts VALUES
  ('66666666-6666-4666-8666-666666666662','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',2,1,'55555555-5555-4555-8555-555555555552','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  RAISE EXCEPTION 'OVERRECEIPT_ACCEPTED';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS PG: server blocked overreceipt';END;
 IF EXISTS(SELECT 1 FROM public.zavi_warehouse_movements WHERE id='55555555-5555-4555-8555-555555555552') THEN RAISE EXCEPTION 'ROLLBACK_FAILED';END IF;
 RAISE NOTICE 'PASS PG: failed receipt rolled back warehouse movement';
END$$;
DO $$BEGIN
 BEGIN
  INSERT INTO public.zavi_in_transit_receipts VALUES
  ('66666666-6666-4666-8666-666666666663','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',1,0,'55555555-5555-4555-8555-555555555552','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  RAISE EXCEPTION 'UNBACKED_RECEIPT_ACCEPTED';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS PG: unbacked receipt blocked';END;
END$$;
INSERT INTO public.zavi_warehouse_movements VALUES
('55555555-5555-4555-8555-555555555553','22222222-2222-4222-8222-222222222222',NULL,'33333333-3333-4333-8333-333333333333','product-1',1,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
INSERT INTO public.zavi_in_transit_receipts VALUES
('66666666-6666-4666-8666-666666666664','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',1,0,'55555555-5555-4555-8555-555555555553','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
UPDATE public.zavi_in_transit_lines SET received_qty=3 WHERE id='44444444-4444-4444-8444-444444444444';
UPDATE public.zavi_in_transit_orders SET status='received' WHERE id='11111111-1111-4111-8111-111111111111';
DO $$BEGIN
 IF(SELECT sum(quantity) FROM public.zavi_warehouse_movements)<>3 THEN RAISE EXCEPTION 'TOTAL_POSTED_BAD';END IF;
 RAISE NOTICE 'PASS PG: all 3 units received exactly once';
END$$;
DO $$BEGIN
 BEGIN
  INSERT INTO public.zavi_warehouse_movements VALUES
  ('55555555-5555-4555-8555-555555555554','22222222-2222-4222-8222-222222222222',NULL,'33333333-3333-4333-8333-333333333333','product-1',1,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  INSERT INTO public.zavi_in_transit_receipts VALUES
  ('66666666-6666-4666-8666-666666666665','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',1,0,'55555555-5555-4555-8555-555555555554','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  RAISE EXCEPTION 'CLOSED_ORDER_ACCEPTED';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS PG: closed order blocked';END;
END$$;
DO $$BEGIN
 PERFORM set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
 BEGIN
  INSERT INTO public.zavi_in_transit_receipts VALUES
  ('66666666-6666-4666-8666-666666666666','11111111-1111-4111-8111-111111111112','44444444-4444-4444-8444-444444444445','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','product-1',1,0,'55555555-5555-4555-8555-555555555553','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  RAISE EXCEPTION 'ACTOR_MISMATCH_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS PG: mismatched actor blocked';END;
 PERFORM set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
END$$;
DO $$BEGIN
 IF (SELECT count(*) FROM public.zavi_in_transit_receipts)<>2 OR
    (SELECT sum(quantity) FROM public.zavi_warehouse_movements)<>3 THEN
  RAISE EXCEPTION 'REJECTED_MUTATION_LEAK';END IF;
 RAISE NOTICE 'PASS PG: ledger intact after rejected operations';
END$$;
