#!/usr/bin/env python3
"""Owner-selected business is stable unless owner explicitly confirms Save.

Browser-only offline fixture: fake owner/session/lease is strictly local to the
disposable Chrome profile. No requests, real sessions or business rows modified.
"""
from chrome_cdp import Session

with Session() as browser:
    uri=browser.web+'/apps/one/v25-business.html'
    browser.command('Page.navigate',{'url':uri})
    browser.until('document.readyState==="complete" && !!document.getElementById("type")',
                  'offline business settings loaded')
    browser.eval("""(()=>{
       localStorage.setItem('z20_cloud_settings',JSON.stringify({
         url:'https://invalid.example.invalid',key:'qa-public-placeholder'}));
       localStorage.setItem('z20_workspace_id',JSON.stringify('qa-no-cloud-workspace'));
       localStorage.setItem('z20_auth_session_persistent_v23_1',JSON.stringify({
         access_token:'QA_NO_REAL_TOKEN',user:{id:'qa-no-real-owner'}}));
       localStorage.setItem('z20_workspace_offline_metadata_v31_qa-no-cloud-workspace',
         JSON.stringify({id:'qa-no-cloud-workspace',workspace_id:'qa-no-cloud-workspace',
           owner_uid:'qa-no-real-owner',user_uid:'qa-no-real-owner'}));
       const saved={business_type:'gold',display_name:'QA ONLY',
         locale:'fa-AF',currency_code:'AFN',features:{products:true}};
       localStorage.setItem('zavi_v47_business_snapshot_qa-no-real-owner_qa-no-cloud-workspace',
         JSON.stringify({owner_uid:'qa-no-real-owner',workspace_id:'qa-no-cloud-workspace',data:saved}));
       localStorage.setItem('zavi_v638_business_type_qa-no-real-owner_qa-no-cloud-workspace','gold');
    })()""")
    browser.command('Page.navigate',{'url':uri})
    browser.until('document.readyState==="complete" && !!document.getElementById("saveFeatures")',
                  'business settings reload')
    browser.eval("""(()=>{
      Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});
      window.zaviSecureOfflineLicense={cached:async()=>({claims:{can_write:true}})};
    })()""")
    browser.until("""document.getElementById('type')?.value==='gold'""",
      'stored gold profile restored without changing it')
    first=browser.eval("""(async()=>{
       const sel=document.getElementById('type');
       sel.value='accessories';sel.dispatchEvent(new Event('change',{bubbles:true}));
       document.getElementById('saveFeatures').click();
       await new Promise(r=>setTimeout(r,100));
       const key='zavi_v638_business_type_qa-no-real-owner_qa-no-cloud-workspace';
       const draft=JSON.parse(localStorage.getItem(
         'zavi_v47_business_draft_qa-no-real-owner_qa-no-cloud-workspace')||'null');
       return {stored:localStorage.getItem(key),select:sel.value,
         draft:draft?.data?.business_type,
         error:document.getElementById('status')?.textContent};
    })()""")
    assert first['stored']=='gold' and first['select']=='gold',first
    assert first['draft']=='gold',first
    cancelled=browser.eval("""(async()=>{
       const sel=document.getElementById('type');
       sel.value='accessories';sel.dispatchEvent(new Event('change',{bubbles:true}));
       document.getElementById('saveProfile').click();
       await new Promise(r=>setTimeout(r,100));
       const approval=document.getElementById('z6662TradeApproval');
       const check=document.getElementById('z6662ConfirmTrade');
       return {stored:localStorage.getItem(
         'zavi_v638_business_type_qa-no-real-owner_qa-no-cloud-workspace'),
         select:sel.value,approvalVisible:approval?.hidden===false,
         unchecked:check?.checked===false};
    })()""")
    assert cancelled['stored']=='gold' and cancelled['select']=='accessories',cancelled
    assert cancelled['approvalVisible'] and cancelled['unchecked'],cancelled
    accepted=browser.eval("""(async()=>{
       const sel=document.getElementById('type');
       sel.value='accessories';sel.dispatchEvent(new Event('change',{bubbles:true}));
       const checkbox=document.getElementById('z6662ConfirmTrade');
       if(!checkbox)throw Error('Owner confirmation checkbox is required');
       checkbox.checked=true;
       document.getElementById('saveProfile').click();
       await new Promise(r=>setTimeout(r,100));
       const draft=JSON.parse(localStorage.getItem(
         'zavi_v47_business_draft_qa-no-real-owner_qa-no-cloud-workspace')||'null');
       return {stored:localStorage.getItem(
         'zavi_v638_business_type_qa-no-real-owner_qa-no-cloud-workspace'),
         pending:draft?.pending,kind:draft?.data?.business_type,
         confirmationCleared:document.getElementById('z6662ConfirmTrade')?.checked===false};
    })()""")
    assert accepted['stored']=='accessories' and accepted['pending'] is True,accepted
    assert accepted['kind']=='accessories' and accepted['confirmationCleared'],accepted
    print('PASS: feature Save never changes business type even after selector preview')
    print('PASS: unconfirmed owner change cannot modify saved trade')
    print('PASS: owner-confirmed Save stages new type offline only (no server write)')
