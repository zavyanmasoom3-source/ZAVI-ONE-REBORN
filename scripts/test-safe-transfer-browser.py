#!/usr/bin/env python3
"""Verify safe APK migration is an explicit user action with no silent data writes.

Disposable Chrome profile only; no Supabase accounts or real backup imports.
"""
from chrome_cdp import Session
import json

with Session() as browser:
    error=browser.unlock_one()
    if error:
        raise SystemExit('PIN setup failed: '+error)
    browser.route('settings')
    browser.until("!!document.querySelector('#zavi-safe-transfer-v1')",'migration card')
    state=browser.eval("""(()=>{
      const card=document.getElementById('zavi-safe-transfer-v1');
      const file=card.querySelector('[data-zavi-transfer-file]');
      const importButton=card.querySelector('[data-zavi-transfer-import]');
      const status=()=>card.querySelector('[data-zavi-transfer-status]').textContent;
      if(!window.ZaviSafeTransferV1||!card||!file||!importButton)throw Error('Missing transfer controls');
      if(window.zaviTenantIsBound?.())throw Error('QA profile unexpectedly tenant bound');
      let pickerCalls=0,importCalls=0;
      file.click=()=>{pickerCalls++;};
      window.importBackup=()=>{importCalls++;};
      const before=localStorage.length;
      importButton.click();
      const blocked=!pickerCalls&&!importCalls&&status().length>0;
      card.querySelector('[data-zavi-transfer-local]').checked=true;
      window.confirm=()=>true;
      importButton.click();
      const allowed=pickerCalls===1;
      const choice=new File(['{"version":1}'],'sample.json',{type:'application/json'});
      Object.defineProperty(file,'files',{configurable:true,value:[choice]});
      file.dispatchEvent(new Event('change'));
      const passed=importCalls===1;
      return {blocked,allowed,passed,importCalls,pickerCalls,before,
        after:localStorage.length,language:document.documentElement.lang,
        accept:file.accept,mode:window.ZaviSafeTransferV1.status()};
    })()""")
    print(json.dumps(state,ensure_ascii=False,indent=2))
    if not(state['blocked'] and state['allowed'] and state['passed']
           and state['mode']=='unbound' and '.zavibak' in state['accept']):
        raise SystemExit('FAIL: migration controls or local-mode consent')
    if state['before']!=state['after']:
        raise SystemExit('FAIL: migration UI changed local storage before actual import')
    browser.route('sales')
    browser.route('settings')
    duplicates=browser.eval("document.querySelectorAll('#zavi-safe-transfer-v1').length")
    if duplicates!=1:
        raise SystemExit('FAIL: duplicate migration card: '+str(duplicates))
    print('PASS: opt-in safe transfer UI, guarded file picker, no silent data writes')
