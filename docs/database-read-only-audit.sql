-- ZAVI ONE / ADMIN read-only prepublication database audit
-- No customer data is read or altered. Do not run migration DDL against production blindly.
-- Execute with a database owner in a controlled session.
begin transaction read only;
select n.nspname as schema_name,
 count(*) filter(where c.relkind='r') as table_count,
 count(*) filter(where c.relkind='v') as view_count,
 count(*) filter(where c.relkind='r' and c.relrowsecurity) as rls_tables
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private')
group by n.nspname order by n.nspname;
select c.relname as table_name,c.relrowsecurity as rls_enabled,
 count(pol.policyname) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
left join pg_policies pol on pol.schemaname=n.nspname and pol.tablename=c.relname
where n.nspname='public' and c.relkind='r'
group by c.relname,c.relrowsecurity order by c.relname;
select p.proname,pg_get_function_identity_arguments(p.oid) as args,
 p.prosecdef as security_definer,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_callable
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'zavi_admin%'
order by p.proname;
select n.nspname as schema_name,c.relname as view_name,
 c.reloptions
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='v' order by c.relname;
commit;
-- Required before accepting production: tested backup restoration, cross-tenant RLS,
-- owner-only ADMIN RPC authorization, transaction idempotence and offline sync behavior.
