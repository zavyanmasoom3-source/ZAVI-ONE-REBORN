#!/usr/bin/env python3
"""Integration regression: never upload unknown-revision recovered accounting.

Uses a disposable browser and a fully mocked URL (https://qa.invalid), NOT
production Supabase, customer data or a user-authenticated device.
"""
import json
from chrome_cdp import Session

UID='00000000-0000-4000-8000-000000000001'
WID='00000000-0000-4000-8000-000000000002'
URL='https://qa.invalid'
TOKEN='qa-disposable-token-only-not-a-credential'
KEY='qa-public-key-this-is-only-a-test'

with Session() as browser:
    error=browser.unlock_one()
    if error:
        raise SystemExit('Local QA PIN setup failed: '+error)

    staged=browser.eval("""(()=>{
      const uid=%s,wid=%s;
      const cached=blankDB(),cloud=blankDB();
      cached.storeName='QA SAVED LOCALLY';
      cached.updatedAt=2345678901;
      cached.tx=[{id:'offline-sale',code:'QA-1',date:'2026-11-08',
        type:'sale',paid:10,items:[]}];
      cloud.storeName='QA REMOTE VERSION';
      cloud.updatedAt=2345678000;
      cloud.tx=[{id:'remote-sale',code:'QA-2',date:'2026-11-08',
        type:'sale',paid:5,items:[]}];
      const config={url:%s,key:%s};
      const session={user:{id:uid,email:'qa@example.invalid'},access_token:%s,
        refresh_token:'qa-refresh-not-real',expires_at:4102444800};
      localStorage.setItem('z20_cloud_settings',JSON.stringify(config));
      localStorage.setItem('z20_auth_session_persistent_v23_1',JSON.stringify(session));
      localStorage.setItem('z20_workspace_id',JSON.stringify(wid));
      localStorage.setItem('zavi_v34_tenant_'+uid+'_'+wid,JSON.stringify(cached));
      localStorage.removeItem('zavi_v34_pending_'+uid+'_'+wid);
      localStorage.removeItem('z20_workspace_offline_metadata_v31_'+wid);
      return {localSale:cached.tx[0].id,remote:cloud};
    })()""" % (json.dumps(UID),json.dumps(WID),json.dumps(URL),
                json.dumps(KEY),json.dumps(TOKEN)))
    if staged['localSale']!='offline-sale':
        raise SystemExit('Test fixture did not initialize')

    remote={'id':WID,'name':'QA REMOTE VERSION','owner_uid':UID,
            'revision':17,'payload':staged['remote']}
    injection="""(()=>{
      const original=window.fetch.bind(window),url=%s,remote=%s;
      window.__zaviQaCloudRequests=[];
      window.fetch=(input,opts={})=>{
        const href=typeof input==='string'?input:input?.url||'';
        if(!href.startsWith(url+'/'))return original(input,opts);
        const method=opts.method||'GET';
        window.__zaviQaCloudRequests.push({method,path:href.slice(url.length)});
        if(method!=='GET'){
          return Promise.resolve(new Response(JSON.stringify({message:'Mock denies writes'}),
            {status:403,headers:{'Content-Type':'application/json'}}));
        }
        return Promise.resolve(new Response(JSON.stringify([remote]),{
          status:200,headers:{'Content-Type':'application/json'}}));
      };
    })();""" % (json.dumps(URL),json.dumps(remote))
    browser.command('Page.addScriptToEvaluateOnNewDocument',{'source':injection})
    browser.command('Page.reload',{'ignoreCache':True})
    browser.until("""(()=>{
      const info=window.zaviCloudRestoreInfo?.();
      return info?.workspace===%s && info?.conflict===true &&
        info?.pending===true && info?.revision===-1;
    })()""" % json.dumps(WID),'unknown-revision sync quarantined',seconds=30)
    final=browser.eval("""(()=>{
      window.dispatchEvent(new Event('online'));
      const info=window.zaviCloudRestoreInfo?.();
      const saved=JSON.parse(localStorage.getItem('zavi_v34_tenant_'+%s+'_'+%s)||'null');
      const pending=JSON.parse(localStorage.getItem('zavi_v34_pending_'+%s+'_'+%s)||'null');
      return {info,requests:window.__zaviQaCloudRequests||[],
        localSale:saved?.tx?.[0]?.id,activeSale:db?.tx?.[0]?.id,
        pendingRevision:pending?.revision};
    })()"""%(json.dumps(UID),json.dumps(WID),json.dumps(UID),json.dumps(WID)))
    # Device-registration and offline-license checks may POST to their own RPCs.
    # The mock rejects those requests (403). Only workspace payload writes
    # can corrupt an accounting ledger, so assert the exact protected endpoint.
    ledger_writes=[x for x in final['requests']
                   if x['method'] in ('PATCH','PUT','POST')
                   and x['path'].startswith('/rest/v1/zavi_workspaces')]
    if ledger_writes:
        raise SystemExit('FAIL recovered ledger attempted cloud write: '+str(ledger_writes))
    if (final['localSale']!='offline-sale' or final['activeSale']!='offline-sale'
            or final['pendingRevision']!=-1):
        raise SystemExit('FAIL local ledger was replaced or revision misreported: '+str(final))
    print(json.dumps(final,ensure_ascii=False,indent=2))
    print('PASS: real browser startup preserves offline sale and rejects unknown-base upload')
