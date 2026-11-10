#!/usr/bin/env bash
set -euo pipefail
# PostgreSQL 17 synthetic fixture only. Concurrent independent authenticated sessions.
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO public.zavi_cheques
(id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,amount,issue_date,due_date)
VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccc0005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','RACE-50','Test Bank','c1','AFN',50,'2026-11-10','2026-11-11'),
('cccccccc-cccc-4ccc-8ccc-cccccccc0006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'received','REPLAY-15','Test Bank','c1','AFN',15,'2026-11-10','2026-11-11');
SQL

owner_rpc() {
 local cheque="$1" op="$2" amount="$3"
 psql -X -q -At -v ON_ERROR_STOP=1 <<SQL
SELECT pg_catalog.set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
SELECT public.zavi_stage4_cheque_apply(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '$cheque', '$op', 'settle', $amount,'a_cash');
SQL
}
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
# Different operation UUIDs cannot jointly overpay a 50 AFN cheque with two 40 AFN attempts.
set +e
owner_rpc cccccccc-cccc-4ccc-8ccc-cccccccc0005 eeeeeeee-eeee-4eee-8eee-eeeeeeee0007 40 >"$tmpdir/a" 2>&1 &
a=$!
owner_rpc cccccccc-cccc-4ccc-8ccc-cccccccc0005 eeeeeeee-eeee-4eee-8eee-eeeeeeee0008 40 >"$tmpdir/b" 2>&1 &
b=$!
wait "$a"; exit_a=$?
wait "$b"; exit_b=$?
set -e
if ! { [[ "$exit_a" -eq 0 && "$exit_b" -ne 0 ]] ||
       [[ "$exit_b" -eq 0 && "$exit_a" -ne 0 ]]; }; then
 echo "FAIL: exactly one of competing operations must succeed"
 cat "$tmpdir/a" "$tmpdir/b"
 exit 1
fi
# Same operation UUID from two distinct connections: both must return the same durable result.
owner_rpc cccccccc-cccc-4ccc-8ccc-cccccccc0006 eeeeeeee-eeee-4eee-8eee-eeeeeeee0009 15 >"$tmpdir/c" 2>&1 &
c=$!
owner_rpc cccccccc-cccc-4ccc-8ccc-cccccccc0006 eeeeeeee-eeee-4eee-8eee-eeeeeeee0009 15 >"$tmpdir/d" 2>&1 &
d=$!
wait "$c"
wait "$d"
# Dropped ACK: discard returned response, then replay same durable operation.
owner_rpc cccccccc-cccc-4ccc-8ccc-cccccccc0006 eeeeeeee-eeee-4eee-8eee-eeeeeeee0009 15 >/dev/null

psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE cnt int; v numeric; rev bigint;
BEGIN
 SELECT count(*) INTO cnt FROM public.zavi_cheque_events
 WHERE operation_id IN ('eeeeeeee-eeee-4eee-8eee-eeeeeeee0007',
                         'eeeeeeee-eeee-4eee-8eee-eeeeeeee0008');
 IF cnt<>1 THEN RAISE EXCEPTION 'RACE: expected only one settlement event'; END IF;
 SELECT settled_amount INTO v FROM public.zavi_cheques
 WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccc0005';
 IF v<>40 THEN RAISE EXCEPTION 'RACE: wrong settled amount %',v; END IF;
 SELECT count(*) INTO cnt FROM public.zavi_cheque_events
 WHERE operation_id='eeeeeeee-eeee-4eee-8eee-eeeeeeee0009';
 IF cnt<>1 THEN RAISE EXCEPTION 'DROPPED ACK: repeated operation was posted'; END IF;
 SELECT count(*) INTO cnt FROM public.zavi_cheque_postings
 WHERE event_id=(SELECT id FROM public.zavi_cheque_events
  WHERE operation_id='eeeeeeee-eeee-4eee-8eee-eeeeeeee0009');
 IF cnt<>2 THEN RAISE EXCEPTION 'DROPPED ACK: duplicated journal legs'; END IF;
 SELECT revision INTO rev FROM public.zavi_workspaces
 WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF rev<>8 THEN RAISE EXCEPTION 'RACE: ledger revision % expected 8',rev; END IF;
 IF EXISTS(SELECT event_id FROM public.zavi_cheque_postings
 GROUP BY event_id HAVING
 COALESCE(sum(amount) FILTER (WHERE side='debit'),0) <>
 COALESCE(sum(amount) FILTER (WHERE side='credit'),0))
 THEN RAISE EXCEPTION 'RACE: journal is not balanced'; END IF;
END $$;
SQL
echo "PASS: concurrent clients, same UUID replay, different UUID overpayment denial, dropped ACK"
