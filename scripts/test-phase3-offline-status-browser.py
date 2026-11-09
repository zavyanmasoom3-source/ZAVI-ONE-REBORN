#!/usr/bin/env python3
"""Phase 3: real offline licence status UI stays scoped to current owner/store.

Exercise a late server reply with a disposable Chrome profile and *intercepted*
fixture URLs. Never send an RPC to the production server or alter a real lease.
"""
from chrome_cdp import Session
import json

with Session() as browser:
    browser.unlock_one()
    browser.route('settings')
    browser.until("""!!document.querySelector('#z70-store-status') &&
      !!document.querySelector('#z70-store-refresh')""",
      'real offline licence detail card in settings')
    for lang,heading in [
        ('fa-AF','وضعیت مجوز آفلاین من'),
        ('ps-AF','زما د آفلاین جواز حالت'),
        ('en','My offline licence'),
    ]:
        result=browser.eval("""(()=>{
          window.zaviPublicSetLang(%s);
          document.dispatchEvent(new CustomEvent('zavi:language-change',
            {detail:{language:%s}}));
          return {lang:document.documentElement.lang,
            heading:document.querySelector('#z70-store-status .z70-store-title strong')
              ?.textContent};
        })()""" %(json.dumps(lang),json.dumps(lang)))
        browser.until("""document.querySelector('#z70-store-status
           .z70-store-title strong')?.textContent===%s"""%json.dumps(heading),
           'live offline licence language '+lang)
        assert result['lang']==lang,result

    mocked=browser.eval("""(()=>{
      window.__p3owner='owner-one';
      window.__p3workspace='00000000-0000-4000-8000-000000000001';
      const originalFetch=window.fetch;
      window.__p3requests=[];
      window.zaviCloudRestoreInfo=()=>({workspace:window.__p3workspace,role:'owner'});
      window.zaviCloudGetAuthSession=()=>({
        user:{id:window.__p3owner},access_token:'fixture-only'});
      window.zaviCloudRefreshAuthSession=async()=>window.zaviCloudGetAuthSession();
      window.zaviCloudGetPublicConfig=()=>({
        url:'https://stage3-license-fixture.invalid',key:'fixture-public-only'});
      window.zaviSecureOfflineLicense={cached:async()=>null};
      window.zaviOfflineStatus=()=>({valid_now:false});
      window.fetch=(url,opts={})=>{
        if(!String(url).startsWith('https://stage3-license-fixture.invalid'))
          return originalFetch(url,opts);
        return new Promise(resolve=>{
          window.__p3requests.push({body:JSON.parse(opts.body),resolve});
        });
      };
      document.getElementById('z70-store-refresh').click();
      return true;
    })()""")
    assert mocked
    browser.until("window.__p3requests?.length===1",'first fake server request')
    browser.eval("""(()=>{
      window.__p3owner='owner-two';
      window.__p3workspace='00000000-0000-4000-8000-000000000002';
      document.getElementById('z70-store-refresh').click();
      window.__p3requests[0].resolve({
        ok:true,json:async()=>({
          offline_enabled:true,offline_allowed_days:365,
          subscription_expires_at:'2030-12-31T00:00:00Z'})
      });
    })()""")
    browser.until("window.__p3requests?.length===2",
                  'new owner queued after stale reply')
    pending=browser.eval("""(()=>window.__p3requests.map(x=>x.body.p_workspace_id))()""")
    assert pending==['00000000-0000-4000-8000-000000000001',
                    '00000000-0000-4000-8000-000000000002'],pending
    browser.eval("""(()=>{
      window.__p3requests[1].resolve({
        ok:true,json:async()=>({
          offline_enabled:true,offline_allowed_days:7,
          subscription_expires_at:'2030-12-31T00:00:00Z'})
      });
    })()""")
    browser.until("""(()=>{
      const text=document.getElementById('z70-store-details')?.textContent||'';
      return text.includes('7') && !text.includes('365');
    })()""",'only new owner policy is rendered')
    result=browser.eval("""(()=>{
      const card=document.getElementById('z70-store-status');
      const note=card.querySelector('#z70-store-message');
      return {scope:window.__p3owner+'|'+window.__p3workspace,
        title:card.querySelector('.z70-store-title strong')?.textContent,
        body:card.querySelector('#z70-store-details')?.textContent,
        status:note?.textContent};
    })()""")
    assert 'owner-two' in result['scope'],result
    assert '7' in result['body'] and '365' not in result['body'],result
    assert result['title']=='My offline licence',result
    print('PASS: offline status follows 3 locales and discards cross-account late results')
    print('NOT VERIFIED: real Supabase owner session, issued ES256 token or Android hardware')
