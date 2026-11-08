#!/usr/bin/env python3
"""Checks ten genuinely *visible*, locally PIN-unlocked accounting app routes."""
from chrome_cdp import Session
import json
ROUTES=('dashboard','sales','purchases','products','contacts','debtors',
        'creditors','money','reports','settings')
with Session() as browser:
    error=browser.unlock_one()
    if error:raise SystemExit('PIN setup failed: '+error)
    results=[browser.route(r) for r in ROUTES]
    print(json.dumps(results,ensure_ascii=False,indent=2))
    failed=[r for r in results if not(r['selected'] and r['visible'] and r['active'] and not r['locked'])]
    if failed:raise SystemExit('FAIL: visible route smoke: '+','.join(r['route'] for r in failed))
    print('PASS: local PIN and 10 visible post-unlock routes; cloud/auth not tested')
