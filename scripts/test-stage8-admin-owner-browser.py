#!/usr/bin/env python3
"""Real ADMIN login/resume/revocation browser regression with a fake Supabase.

Chrome loads untouched apps/admin/ JS/HTML on localhost. No remote requests,
customer accounts, real passwords, access tokens or payment data.
"""
import json
from chrome_cdp import Session

OWNER='changed.owner@qa.invalid'
OUTSIDER='ordinary.user@qa.invalid'
with Session() as browser:
    browser.command('Page.addScriptToEvaluateOnNewDocument',{'source':r"""
    (() => {
      const originalFetch=window.fetch.bind(window);
      const endpoint='https://wbbmwfnmurpphwxesssx.supabase.co';
      const respond=(value,status=200)=>Promise.resolve(new Response(
         JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));
      const state=window.__stage8Mock={
        calls:[],gateOwner:true,ownerEmail:'changed.owner@qa.invalid'
      };
      window.fetch=function(input,options={}){
        const url=String(typeof input==='string'?input:input?.url||'');
        if(!url.startsWith(endpoint+'/'))return originalFetch(input,options);
        const path=url.slice(endpoint.length);
        let data={};
        try{data=JSON.parse(options.body||'{}')}catch{}
        const token=String(options.headers?.Authorization||'');
        state.calls.push({path,token:token.startsWith('Bearer owner-')?'owner':
         token.startsWith('Bearer outsider-')?'outsider':'public'});
        if(path.startsWith('/auth/v1/token?grant_type=password')){
          const own=data.email===state.ownerEmail;
          return respond({
            access_token:own?'owner-access':'outsider-access',
            refresh_token:own?'owner-refresh':'outsider-refresh',
            expires_at:Math.floor(Date.now()/1000)+3600,
            user:{id:own?'11111111-1111-4111-8111-111111111111':
              '22222222-2222-4222-8222-222222222222',email:data.email}
          });
        }
        if(path.startsWith('/auth/v1/token?grant_type=refresh_token')){
          const own=data.refresh_token==='owner-refresh';
          return respond({
            access_token:own?'owner-access':'outsider-access',
            refresh_token:own?'owner-refresh':'outsider-refresh',
            expires_at:Math.floor(Date.now()/1000)+3600,
            user:{id:own?'11111111-1111-4111-8111-111111111111':
              '22222222-2222-4222-8222-222222222222',
              email:own?state.ownerEmail:'ordinary.user@qa.invalid'}
          });
        }
        if(path==='/rest/v1/rpc/zavi_stage8_admin_owner_session')
          return respond(token==='Bearer owner-access'&&state.gateOwner);
        if(path==='/rest/v1/rpc/zavi_admin_list_workspaces')
          return respond([{workspace_id:'qa-workspace',workspace_name:'QA only',
            owner_email:'qa@example.invalid',plan:'annual',
            status:'active',expires_at:'2026-12-01T00:00:00Z'}]);
        if(path==='/rest/v1/rpc/zavi_admin_v24_accounts')
          return respond([]);
        if(path==='/rest/v1/rpc/zavi_admin_get_report_period')
          return respond(null);
        if(path==='/auth/v1/logout')return respond({});
        if(path==='/auth/v1/user')return respond({id:token.includes('owner-')?'11111111-1111-4111-8111-111111111111':'other'});
        // Keep unrelated optional read-only ADMIN widgets in the fake test
        // without introducing a simulated financial write.
        if(path.startsWith('/rest/v1/rpc/'))return respond([]);
        return respond({message:'Unmocked endpoint blocked'},404);
      };
    })();
    """})
    browser.navigate('admin')
    browser.until("""!!document.getElementById('loginBtn') &&
        typeof window.ZaviAdminAPI==='object'""",'actual ADMIN boot')

    def login(email):
        browser.eval("""(()=>{
          document.getElementById('authEmail').value=%s;
          document.getElementById('authPassword').value='fake-test-password';
          document.getElementById('loginBtn').click();
        })()"""%json.dumps(email))
    login(OWNER)
    browser.until("document.getElementById('appScreen').hidden===false",
                  'new owner email validated using actual server-role RPC')
    owner=browser.eval("""(()=>{
      const calls=window.__stage8Mock.calls;
      return {
        rendered:document.getElementById('appScreen').hidden===false,
        email:document.getElementById('sidebarEmail').textContent.trim(),
        ownerChecks:calls.filter(c=>c.path.endsWith('zavi_stage8_admin_owner_session')).length,
        dataReads:calls.filter(c=>c.path.endsWith('zavi_admin_list_workspaces')).length,
        persisted:!!localStorage.getItem('zavi_admin_persistent_session_v23_1'),
        hasRealDemoLabel:document.getElementById('sidebarEmail').textContent.includes('DEMO')
      };
    })()""")
    assert owner['rendered'] and owner['email']==OWNER and owner['ownerChecks']==1,owner
    assert owner['dataReads']==1 and owner['persisted'] and not owner['hasRealDemoLabel'],owner
    print('PASS: actual ADMIN login works for newly authorized owner email; role checked before customer list')

    # A revoked or downgraded owner cannot keep cached customer pages visible.
    browser.eval("""(()=>{
      window.__stage8Mock.gateOwner=false;
      document.getElementById('refreshBtn').click();
    })()""")
    browser.until("document.getElementById('appScreen').hidden===true",
                  'revoked owner role locks old ADMIN screen')
    revoked=browser.eval("""(()=>({
      login:document.getElementById('authScreen').hidden===false,
      cachedRows:window.ZaviAdminAPI?.getRows?.().length||0,
      persisted:!!localStorage.getItem('zavi_admin_persistent_session_v23_1'),
      ownerChecks:window.__stage8Mock.calls.filter(c=>
        c.path.endsWith('zavi_stage8_admin_owner_session')).length
    }))()""")
    assert revoked['login'] and revoked['cachedRows']==0 and not revoked['persisted'],revoked
    assert revoked['ownerChecks']>=2,revoked
    print('PASS: revoked owner loses cached UI/customer data immediately, session is cleared')

    # A correctly authenticated ordinary user still cannot get any ADMIN rows;
    # even when fake server would return customer data on a list RPC.
    before=browser.eval("window.__stage8Mock.calls.filter(c=>c.path.endsWith('zavi_admin_list_workspaces')).length")
    login(OUTSIDER)
    browser.until("document.getElementById('loginBtn').disabled===false",
                  'unprivileged login rejected by central role')
    outsider=browser.eval("""(()=>({
      adminHidden:document.getElementById('appScreen').hidden,
      authVisible:!document.getElementById('authScreen').hidden,
      listReads:window.__stage8Mock.calls.filter(c=>
        c.path.endsWith('zavi_admin_list_workspaces')).length,
      saved:!!localStorage.getItem('zavi_admin_persistent_session_v23_1')
    }))()""")
    assert outsider['adminHidden'] and outsider['authVisible'] and not outsider['saved'],outsider
    assert outsider['listReads']==before,('customer list request before privilege check',outsider)
    print('PASS: ordinary account rejected; no list RPC and no persisted access')

    # Restore the fake backend owner's role before the separate re-entry
    # scenario: the earlier test intentionally revoked this exact role.
    browser.eval("window.__stage8Mock.gateOwner=true")
    # Successful login again must resume after an ordinary page reload with
    # refresh token: no fixed address whitelist or manual relogin.
    login(OWNER)
    browser.until("document.getElementById('appScreen').hidden===false",
                  'owner re-entry')
    browser.command('Page.reload',{'ignoreCache':True})
    browser.until("document.readyState==='complete'","ADMIN fresh page")
    browser.until("document.getElementById('appScreen').hidden===false",
                  'stored owner session revalidated after restart',30)
    resumed=browser.eval("""(()=>({
      email:document.getElementById('sidebarEmail').textContent.trim(),
      checks:window.__stage8Mock.calls.filter(c=>
        c.path.endsWith('zavi_stage8_admin_owner_session')).length,
      listReads:window.__stage8Mock.calls.filter(c=>
        c.path.endsWith('zavi_admin_list_workspaces')).length
    }))()""")
    assert resumed['email']==OWNER and resumed['checks']>=1 and resumed['listReads']>=1,resumed
    print('PASS: persistent owner session refresh+reauthorization survive page restart')
    print('NOT VERIFIED: real authenticated owner JWT, actual phone or Windows installer')
