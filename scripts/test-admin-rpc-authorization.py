#!/usr/bin/env python3
"""Production-facing read-only authorization gate for ZAVI ONE ADMIN.

No user login, service-role key, fixture/customer records or mutations. Calls
only known READ-ONLY admin RPCs as an unauthenticated visitor with the browser
publishable key; they must deny access before returning any sensitive payload.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import re
import sys
import time

ROOT=Path(__file__).resolve().parents[1]
cfg=(ROOT/'apps/one/cloud-config.js').read_text(encoding='utf-8')
url=re.search(r"\burl:\s*'(https://[a-z0-9.-]+\.supabase\.co)'",cfg)
key=re.search(r"\bkey:\s*'(sb_publishable_[a-zA-Z0-9_]+)'",cfg)
if not url or not key:
    raise SystemExit('Missing known public project config; do not silently skip authorization tests')

READ_ONLY=(
    'zavi_admin_list_workspaces',
    'zavi_admin_finance_snapshot',
    'zavi_admin_v24_accounts',
    'zavi_admin_v24_events',
    'zavi_admin_recovery_catalog',
    'zavi_admin_v241_overview',
    'zavi_admin_v241_audit',
    'zavi_admin_support_list',
    'zavi_admin_registration_contacts',
    'zavi_admin_message_history_v6595',
    'zavi_admin_v6573_industry_edition_report',
)
failures=[]
for name in READ_ONLY:
    endpoint=url.group(1)+'/rest/v1/rpc/'+name
    request=Request(endpoint,data=b'{}',method='POST',
                    headers={'apikey':key.group(1),'Content-Type':'application/json'})
    status=None
    for attempt in range(2):
        try:
            with urlopen(request,timeout=12) as response:
                status=response.status
            break
        except HTTPError as e:
            status=e.code
            break
        except (URLError,TimeoutError,OSError):
            if attempt==0:
                time.sleep(1)
            else:
                failures.append(name+': network unavailable (not verified)')
    # Never print or persist server response; even a 200 could contain customer data.
    if status in (401,403):
        print('PASS: anonymous request denied for '+name+' (HTTP '+str(status)+')')
    elif status is not None:
        failures.append(name+': expected access denied, received HTTP '+str(status))
if failures:
    for issue in failures:print('ADMIN RPC SECURITY GATE FAILED: '+issue,file=sys.stderr)
    sys.exit(1)
print('PASS: anonymous session cannot read protected administrative RPCs')
