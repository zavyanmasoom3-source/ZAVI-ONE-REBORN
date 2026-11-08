#!/usr/bin/env python3
"""ADMIN settings DOM smoke in disposable Chrome, with NO authenticated server.

Opens the application's built-in localhost-only demo and clicks the real
Settings navigation in a throwaway browser. No live RPC, auth or billing writes.
This is not an authorization or authenticated visual acceptance test.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

out=ROOT/'qa-admin-compact'
out.mkdir(exist_ok=True)

with Session() as browser:
    browser.navigate('admin')
    # localhost-only demo is an existing read-only preview; it never gains an
    # authenticated account or access to real customer billing data.
    browser.until("!!document.getElementById('demoBtn')&&!!document.querySelector('.nav-item[data-page=\"settings\"]')",
                  'admin local demo and settings navigation ready')
    browser.eval("document.getElementById('demoBtn').click()")
    browser.until("!document.getElementById('appScreen').hidden",
                  'admin local preview opened without live credentials')
    browser.eval("document.querySelector('.nav-item[data-page=\"settings\"]').click()")
    browser.until("!!document.getElementById('zaviChangePasswordForm')",
                  'original settings content rendered by real admin navigation')
    browser.until("!!document.querySelector('#view [data-zavi-admin-settings-hub]')",
                  'ADMIN native settings grouped')
    state=browser.eval("""(()=>{
      const hub=document.querySelector('#view [data-zavi-admin-settings-hub]');
      const groups=[...hub.querySelectorAll('[data-zah-group]')];
      const form=document.getElementById('zaviChangePasswordForm');
      const original= {
        groupCount:groups.length,
        passwordForm:!!form&&form.closest('[data-zah-group="security"]')!==null,
        supportButton:!!hub.querySelector('#z30SupportSettings'),
        receiptButton:!!hub.querySelector('#z30ReceiptsSettings'),
        logoutButton:!!hub.querySelector('[data-logout="1"]'),
        originalPasswordInputs:form?.querySelectorAll('input[type=password]').length||0
      };
      const input=hub.querySelector('#zaviAdminSettingsSearch');
      input.value='تمدید';input.dispatchEvent(new Event('input',{bubbles:true}));
      original.filtered=groups.some(g=>g.hidden)&&groups.some(g=>!g.hidden);
      input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
      original.restored=groups.filter(g=>!g.hidden).length>=4;
      return original;
    })()""")
    assert state['groupCount']==6 and state['originalPasswordInputs']==3,state
    assert all(state[k] for k in [
      'passwordForm','supportButton','receiptButton','logoutButton','filtered','restored'
    ]),state
    # Real local demo workflow, not a manually unhidden unauthorized screen.
    browser.eval("document.querySelector('[data-zah-group=\"security\"]').open=true")
    (out/'admin-settings-template-only.png').write_bytes(browser.screenshot())
    (out/'report.json').write_text(json.dumps({
      'test':'localhost-only demo, real settings navigation, no server authorization',
      'result':state,'server_authorization_tested':False,'customer_data_accessed':False
    },ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('PASS: ADMIN five active compact settings groups + advanced fallback; original forms and buttons survive')
    print('NOT TESTED: owner access, server permissions, actual payment or customer records')
