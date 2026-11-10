#!/usr/bin/env bash
set -euo pipefail
# Validate exact guarded production SQL in a completely disposable PostgreSQL 17 database.
export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres PGDATABASE=zavi_stage4_production_qa
psql -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE zavi_stage4_production_qa'
awk 'index($0,"\\ir ")==1{exit} !/^CREATE ROLE /{print}' \
 scripts/test-stage4-cheque-postgres.sql |
 psql -d "$PGDATABASE" -v ON_ERROR_STOP=1
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO public.zavi_workspaces(id,owner_uid,name,payload)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111','Synthetic',
 '{"currency":"AFN","accounts":[],"contacts":[],"tx":[]}'::jsonb);
INSERT INTO public.zavi_cheques
(id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,amount,issue_date,due_date)
VALUES('cccccccc-cccc-4ccc-8ccc-cccccccc0001',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','QA-R1','QA Bank','c1','AFN',100,'2026-11-10','2026-11-11');
SQL
# Refuse any existing cheque before altering a schema, including valid pending rows.
if psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 \
 -f supabase/migrations/20261110_stage4_cheque_atomic_server.sql >/tmp/guarded-stage4.log 2>&1; then
 echo "FAIL: production guard allowed preexisting cheque";exit 1
fi
grep -q 'STAGE4_EXISTING_CHEQUE_OR_FUNCTION_REQUIRES_MANUAL_RECONCILIATION' /tmp/guarded-stage4.log
psql -d "$PGDATABASE" -At -c \
 "SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='zavi_cheque_initial_pending')" | grep -qx t
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 \
 -c "DELETE FROM public.zavi_cheques WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0001';"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 \
 -f supabase/migrations/20261110_stage4_cheque_atomic_server.sql
psql -d "$PGDATABASE" -At -c \
 "SELECT to_regprocedure('public.zavi_stage4_cheque_apply(uuid,uuid,uuid,text,numeric,text,numeric)') IS NOT NULL" | grep -qx t
psql -d "$PGDATABASE" -At -c \
 "SELECT NOT has_table_privilege('authenticated','public.zavi_cheques','UPDATE')" | grep -qx t
psql -d "$PGDATABASE" -At -c \
 "SELECT count(*)=0 FROM public.zavi_cheques" | grep -qx t
# No unreviewed repeat replacement of the function.
if psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 \
 -f supabase/migrations/20261110_stage4_cheque_atomic_server.sql >/tmp/guarded-stage4-repeat.log 2>&1; then
 echo "FAIL: guard allowed redeploy over an already existing settlement RPC";exit 1
fi
grep -q 'STAGE4_EXISTING_CHEQUE_OR_FUNCTION_REQUIRES_MANUAL_RECONCILIATION' /tmp/guarded-stage4-repeat.log
echo 'PASS: production migration refused old data, installed empty schema, denied repeated overwrites'
