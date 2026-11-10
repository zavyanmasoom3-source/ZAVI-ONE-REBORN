-- READ-ONLY inspection of the actual primary Supabase catalog for stage 5.
-- This never calls an action RPC, never reads personal customer rows, and
-- never modifies any account, archive, subscription or invoice.
SELECT
 (SELECT count(*) FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (p.proname LIKE 'zavi_admin_%' OR p.proname LIKE 'zavi_owner_%')
 ) AS reviewed_management_rpc_count,
 (SELECT count(*) FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (p.proname LIKE 'zavi_admin_%' OR p.proname LIKE 'zavi_owner_%')
    AND pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE')
 ) AS anonymous_rpc_exposures,
 (SELECT count(*) FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (p.proname LIKE 'zavi_admin_%' OR p.proname LIKE 'zavi_owner_%')
    AND p.prosecdef
    AND pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE')
    AND (
      p.proconfig IS NULL OR NOT ('search_path=""'=ANY(p.proconfig))
      OR NOT (
       pg_catalog.pg_get_functiondef(p.oid) ILIKE '%billing_admin%'
       OR pg_catalog.pg_get_functiondef(p.oid) ILIKE '%zavi_admin_roles%'
      )
    )
 ) AS exposed_admin_definers_needing_review,
 pg_catalog.has_function_privilege(
   'authenticated','public.zavi_owner_delete_customer(uuid,text)','EXECUTE'
 ) AS authenticated_can_hard_delete,
 pg_catalog.pg_get_functiondef(
  'public.zavi_owner_reset_customer_accounts(boolean,text)'::regprocedure
 ) LIKE '%PERMANENT_BULK_DELETE_DISABLED_USE_RECOVERABLE_TRASH%'
 AS permanent_bulk_delete_disabled,
 pg_catalog.pg_get_functiondef(
  'public.zavi_admin_v24_archive(uuid,boolean,text)'::regprocedure
 ) LIKE '%MAIN_OWNER_WORKSPACE_PROTECTED%' AS main_owner_archive_protected,
 pg_catalog.has_table_privilege(
   'authenticated','private.zavi_customer_admin_events','INSERT'
 ) AS user_can_forge_management_audit,
 pg_catalog.has_table_privilege(
   'authenticated','private.zavi_customer_archives','UPDATE'
 ) AS user_can_bypass_archive_rpc,
 (SELECT count(*) FROM public.zavi_workspaces) AS workspace_count,
 (SELECT count(*) FROM private.zavi_customer_archives) AS recoverable_archive_rows,
 (SELECT count(*) FROM private.zavi_customer_admin_events) AS admin_audit_rows;

-- The report checks exposed grant and source text only. It cannot prove
-- cross-tenant or revoked-JWT runtime authorization, which still needs
-- real authenticated HTTP acceptance tests with disposable owner/users.
