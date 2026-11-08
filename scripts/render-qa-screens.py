#!/usr/bin/env python3
"""Real Chrome screenshots of logged-in local QA, not lock-screen-only captures."""
from chrome_cdp import Session,ROOT
from pathlib import Path
import json
import time
OUT=ROOT/'qa-screens'
OUT.mkdir(exist_ok=True)
ROUTES=('dashboard','sales','purchases','products','money','debtors','settings')
with Session() as browser:
    entries=[]
    for theme in ('light','dark','glass'):
        # Use actual Settings preference in a disposable local test profile.
        browser.navigate('one')
        browser.eval("localStorage.setItem('zavi_theme_preference_v29',"+repr(theme)+")")
        error=browser.unlock_one()
        if error:raise SystemExit('PIN setup failed: '+error)
        time.sleep(2.5 if theme=='light' else .5)
        for route in ROUTES:
            state=browser.route(route)
            if not(state['selected'] and state['visible'] and not state['locked']):
                raise SystemExit('Unusable route '+route+' ('+theme+'): '+str(state))
            time.sleep(.15)
            p=OUT/('one-'+route+'-'+theme+'.png')
            p.write_bytes(browser.screenshot())
            entries.append({**state,'theme':theme,'file':p.name})
            print('CAPTURED',p.name,p.stat().st_size)
    browser.navigate('admin')
    time.sleep(2.5)
    p=OUT/'admin-login.png';p.write_bytes(browser.screenshot())
    entries.append({'route':'admin-login','file':p.name,'status':'anonymous login preview'})
    (OUT/'manifest.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
print('PASS: actual unlocked UI screenshots saved; PDF comparison still requires review')
