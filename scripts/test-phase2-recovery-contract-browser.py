#!/usr/bin/env python3
"""Phase 2: exercise the actual private-PIN recovery client with a fake server.

Uses a disposable Chromium profile and a local fetch interceptor. It never
sends authentication details to Supabase, changes production accounts, or
claims to verify production RLS. The original JS handlers and local PIN
reset event are used; no direct privileged method calls are forged.
"""
from pathlib import Path
import json
from chrome_cdp import Session, ROOT

OUT=ROOT/'qa-phase2-recovery'
OUT.mkdir(exist_ok=True)

with Session() as browser:
    browser.unlock_one()
    browser.navigate('one')  # Real PIN created, real lock restored on reload.
    browser.until("document.documentElement.classList.contains('zawi-locked')",
                  'real local PIN lock restored')
    initial=browser.eval("""(()=>({
       stored:!!localStorage.getItem('zawi_store_personal_pin_v1'),
       locked:document.documentElement.classList.contains('zawi-locked')
    }))()""")
    assert initial=={'stored':True,'locked':True},initial
    # Genuine PBKDF2 login guard: five invalid PINs must enforce the
    # one-minute cooldown. This is ONLY a disposable browser profile.
    for attempt in range(1,6):
        browser.eval("""(()=>{
          document.getElementById('zawiPinOne').value='000000';
          document.getElementById('zawiPinForm').dispatchEvent(
            new Event('submit',{bubbles:true,cancelable:true}));
        })()""")
        if attempt<5:
            browser.until("""(()=>{
              const s=JSON.parse(localStorage.getItem(
                'zawi_store_private_attempts_v1')||'{}');
              return s.count==%d && !document.getElementById('zawiPinSubmit').disabled;
            })()""" % attempt,'incorrect PIN attempt %d counted' % attempt,seconds=15)
        else:
            browser.until("""(()=>{
              const s=JSON.parse(localStorage.getItem(
                'zawi_store_private_attempts_v1')||'{}');
              return s.count===0 && s.until>Date.now() &&
                !document.getElementById('zawiPinSubmit').disabled;
            })()""",'fifth invalid PIN starts cooldown',seconds=15)
        assert browser.eval("document.documentElement.classList.contains('zawi-locked')")
        assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    blocked=browser.eval("""(()=>{
       document.getElementById('zawiPinOne').value='987654321';
       document.getElementById('zawiPinForm').dispatchEvent(
         new Event('submit',{bubbles:true,cancelable:true}));
       return {
         locked:document.documentElement.classList.contains('zawi-locked'),
         message:document.getElementById('zawiPinError').textContent,
         until:JSON.parse(localStorage.getItem(
           'zawi_store_private_attempts_v1')).until
       };
    })()""")
    assert blocked['locked'] and blocked['until']>0 and blocked['message'],blocked
    # Only in-memory test state is cleared: this code never changes the app.
    browser.eval("""(()=>{
      localStorage.removeItem('zawi_store_private_attempts_v1');
      document.getElementById('zawiPinOne').value='';
    })()""")
    mocked=browser.eval("""(()=>{
      window.zaviPublicSetLang('en');
      document.dispatchEvent(new CustomEvent('zavi:language-change',
        {detail:{language:'en'}}));
      const original=window.fetch;
      const prefix='https://phase2-fixture.supabase.co/';
      window.__phase2RecoveryRequests=[];
      window.__phase2Approval='pending';
      window.__phase2Confirmations=[];
      window.__phase2Alerts=[];
      window.confirm=message=>{window.__phase2Confirmations.push(message);return true};
      window.alert=message=>{window.__phase2Alerts.push(message)};
      localStorage.setItem('z20_cloud_settings',JSON.stringify({
         url:'https://phase2-fixture.supabase.co',key:'fixture-public-only'
      }));
      window.fetch=async(url,init={})=>{
        const name=String(url);
        if(!name.startsWith(prefix))return original(url,init);
        window.__phase2RecoveryRequests.push({
          url:name,body:String(init.body||''),auth:String(init.headers?.Authorization||'')
        });
        const response=value=>({
          ok:true,status:200,json:async()=>value
        });
        if(name.includes('/auth/v1/token?grant_type=password'))
          return response({access_token:'fixture-access',user:{id:'fixture-owner'},
            expires_at:Math.floor(Date.now()/1000)+1200});
        if(name.includes('/rest/v1/zavi_workspaces?'))
          return response([{id:'fixture-shop',name:'Test only',owner_uid:'fixture-owner'}]);
        if(name.endsWith('/rpc/zavi_pin_reset_request'))
          return response('fixture-request-id');
        if(name.endsWith('/rpc/zavi_pin_reset_status'))
          return response([{workspace_id:'fixture-shop',
            request_status:window.__phase2Approval}]);
        if(name.endsWith('/rpc/zavi_pin_reset_consume'))
          return response(true);
        throw new Error('UNEXPECTED_FIXTURE_ENDPOINT: '+name);
      };
      document.getElementById('zawiForgotPinBtn').click();
      return {modal:!!document.getElementById('z24Recovery'),
        title:document.getElementById('z24RecoveryHeading')?.textContent};
    })()""")
    assert mocked=={'modal':True,'title':'Recover account'},mocked
    assert browser.eval("document.getElementById('z24Recovery').dataset.z24CurrentStage")=='1'
    # Missing credentials remain a client-side validation failure: no request.
    browser.eval("document.getElementById('z24Login').click()")
    browser.until("(document.getElementById('z24RecoveryStatus')?.textContent||'').includes('Enter your online account email and password.')",
                  'no-credentials refusal')
    assert browser.eval('window.__phase2RecoveryRequests.length')==0
    browser.eval("""(()=>{
      document.getElementById('z24Email').value='fixture@example.invalid';
      document.getElementById('z24Password').value='account-password-test-only';
      document.getElementById('z24Login').click();
    })()""")
    browser.until("""!!document.querySelector(
      '#z24Workspace option[value="fixture-shop"]') &&
      !document.getElementById('z24Next').disabled &&
      document.getElementById('z24Recovery').dataset.z24CurrentStage==='2'""",
      'owner-scoped store loaded in stage 2')
    login=browser.eval("""(()=>({
      noPasswordKept:!document.getElementById('z24Password').value,
      selected:document.getElementById('z24Workspace').value,
      message:document.getElementById('z24RecoveryStatus').textContent,
      pinStillStored:!!localStorage.getItem('zawi_store_personal_pin_v1')
    }))()""")
    assert login['noPasswordKept'] and login['selected']=='fixture-shop',login
    assert login['pinStillStored'],login
    # The approved UI must require store selection before the request step.
    browser.eval("document.getElementById('z24Next').click()")
    browser.until("document.getElementById('z24Recovery').dataset.z24CurrentStage==='3' && !document.getElementById('z24Ask').disabled",'stage 3 request visibly ready')
    assert browser.eval("document.querySelector('[data-z24-panel=\"2\"]').hidden")
    browser.eval("document.getElementById('z24Ask').click()")
    browser.until("""!document.getElementById('z24Check').disabled &&
      !!localStorage.getItem('zavi_v24_pin_request_fixture-shop')""",
      'server-approved request ID stored')
    assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    browser.eval("document.getElementById('z24Check').click()")
    browser.until("(document.getElementById('z24RecoveryStatus')?.textContent||'').includes('Waiting for management approval.')",
                  'pending request cannot reset PIN')
    assert browser.eval("document.getElementById('z24Recovery').dataset.z24CurrentStage")=='3'
    assert browser.eval("document.getElementById('z24Finish').disabled")
    assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    browser.eval("""(()=>{
      window.__phase2Approval='denied';
      document.getElementById('z24Check').click();
    })()""")
    browser.until("(document.getElementById('z24RecoveryStatus')?.textContent||'').includes('Request denied.')",
                  'denied request cannot reset PIN')
    assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    browser.eval("""(()=>{
      window.__phase2Approval='approved';
      document.getElementById('z24Check').click();
    })()""")
    browser.until("(document.getElementById('z24RecoveryStatus')?.textContent||'').includes('Management approved your request.')",
                  'approved status available')
    assert browser.eval("!!localStorage.getItem('zawi_store_personal_pin_v1')")
    browser.until("document.getElementById('z24Recovery').dataset.z24CurrentStage==='4' && !document.getElementById('z24Finish').disabled",'only approved server response reveals stage 4')
    assert browser.eval("document.querySelector('[data-z24-panel=\"3\"]').hidden")
    # Actual consume action must be the sole path that deletes the local PIN.
    browser.eval("document.getElementById('z24Finish').click()")
    browser.until("""!document.getElementById('z24Recovery') &&
        !localStorage.getItem('zawi_store_personal_pin_v1')""",
        'consumed server approval resets local PIN')
    result=browser.eval("""(()=>{
      const calls=window.__phase2RecoveryRequests;
      return {
        locked:document.documentElement.classList.contains('zawi-locked'),
        localPinMissing:!localStorage.getItem('zawi_store_personal_pin_v1'),
        requestMissing:!localStorage.getItem('zavi_v24_pin_request_fixture-shop'),
        endpoints:calls.map(c=>c.url.split('/').pop()),
        calls:calls.length,consumed:calls.filter(c=>c.url.includes(
          '/rpc/zavi_pin_reset_consume')).length,
        leakedPin:calls.some(c=>c.body.includes('987654321')),
        approvalMessage:window.__phase2Alerts.at(-1)||'',
        confirmations:window.__phase2Confirmations.length,
        originOnly:calls.every(c=>c.url.startsWith('https://phase2-fixture.supabase.co/'))
      };
    })()""")
    assert result['locked'] and result['localPinMissing'] and result['requestMissing'],result
    assert result['consumed']==1 and not result['leakedPin'] and result['originOnly'],result
    assert result['confirmations']==2, result
    assert 'Create a new' in result['approvalMessage'],result
    (OUT/'recovery-contract.json').write_text(
      json.dumps({**result,'endpoints':'fixture endpoints only'},ensure_ascii=False,indent=2)+'\n',
      encoding='utf-8')
print('PASS: real owner PIN recovery UI, fake login, request, pending, denied, approved, consume and local reset')
print('NOT VERIFIED: real Supabase authorization, owner approval backend, physical Android, release APK')
