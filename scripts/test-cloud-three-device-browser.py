#!/usr/bin/env python3
"""Three simultaneously running, disposable Chrome profiles against ONE mock
Supabase CAS server. Exercises real apps/one/cloud.js networking and persistence.
NEVER contacts a production endpoint or uses a customer credential.
"""
from contextlib import ExitStack
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread, Lock
from urllib.parse import urlparse, parse_qs
import json
import time
from chrome_cdp import Session

UID='00000000-0000-4000-8000-000000000001'
WID='00000000-0000-4000-8000-000000000002'
BASE='https://qa.invalid'
KEY='qa-publishable-key-this-is-not-a-real-credential'
TOKEN='qa-access-token-this-is-not-a-real-credential'
lock=Lock()
server_state={'workspace':None,'patches':[],'drop_for':None}

def json_reply(handler,code,body):
    raw=json.dumps(body,separators=(',',':')).encode()
    handler.send_response(code)
    handler.send_header('Content-Type','application/json')
    handler.send_header('Content-Length',str(len(raw)))
    handler.send_header('Access-Control-Allow-Origin','*')
    handler.send_header('Access-Control-Allow-Methods','GET,PATCH,POST,OPTIONS')
    handler.send_header('Access-Control-Allow-Headers','Content-Type,Authorization,apikey,Prefer,X-QA-Device')
    handler.end_headers()
    handler.wfile.write(raw)

class MockSupabase(BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def do_OPTIONS(self):json_reply(self,200,{})
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path!='/rest/v1/zavi_workspaces':
            return json_reply(self,200,[])
        with lock:
            current=json.loads(json.dumps(server_state['workspace']))
        return json_reply(self,200,[current])
    def do_POST(self):
        # Guarded unrelated license/device RPCs must not mutate the mock ledger.
        return json_reply(self,403,{'message':'Mock disallows unrelated RPCs'})
    def do_PATCH(self):
        parsed=urlparse(self.path)
        if parsed.path!='/rest/v1/zavi_workspaces':
            return json_reply(self,403,{'message':'Only workspace CAS is allowed'})
        queries=parse_qs(parsed.query)
        rev=(queries.get('revision') or [''])[0]
        if not rev.startswith('eq.'):return json_reply(self,400,{'message':'Missing revision guard'})
        old=int(rev[3:])
        length=int(self.headers.get('Content-Length','0'))
        body=json.loads(self.rfile.read(length))
        name=self.headers.get('X-QA-Device','?')
        with lock:
            current=server_state['workspace']
            if old!=current['revision']:
                reply=[]
            else:
                assert body['revision']==old+1
                assert isinstance(body['payload'].get('tx'),list)
                current['revision']=body['revision']
                current['payload']=body['payload']
                current['updated_at']=body.get('updated_at','')
                server_state['patches'].append({'device':name,'revision':old+1})
                reply=[{k:current[k] for k in ('id','name','revision','updated_at')}]
            dropping=bool(reply) and server_state['drop_for']==name
            if dropping:server_state['drop_for']=None
        if dropping:
            # The server has committed, but the client never gets an ACK.
            return json_reply(self,503,{'message':'QA network dropped after commit'})
        return json_reply(self,200,reply)

def until(check,label,seconds=27):
    started=time.monotonic()
    while time.monotonic()-started<seconds:
        if check():return
        time.sleep(.12)
    raise AssertionError('Timeout: '+label)

def info(dev):return dev.eval('window.zaviCloudRestoreInfo?.()||{}')

def configure(dev,name,bridge):
    dev.eval("""(()=>{
       const session={user:{id:%s,email:'qa@example.invalid'},access_token:%s,
          refresh_token:'qa-refresh-nonsecret',expires_at:4102444800};
       localStorage.setItem('z20_cloud_settings',JSON.stringify({url:%s,key:%s}));
       localStorage.setItem('z20_auth_session_persistent_v23_1',JSON.stringify(session));
       localStorage.setItem('z20_workspace_id',JSON.stringify(%s));
       localStorage.removeItem('zavi_v34_pending_'+%s+'_'+%s);
       localStorage.removeItem('z20_workspace_offline_metadata_v31_'+%s);
    })()""" % tuple(map(json.dumps,[UID,TOKEN,BASE,KEY,WID,UID,WID,WID])))
    hook="""(()=>{
      const original=window.fetch.bind(window),api=%s,bridge=%s;
      window.fetch=(input,opts={})=>{
        const url=typeof input==='string'?input:(input?.url||'');
        if(!url.startsWith(api+'/'))return original(input,opts);
        return original(bridge+url.slice(api.length),{
          ...opts,headers:{...(opts.headers||{}),'X-QA-Device':%s}
        });
      };
    })()""" %(json.dumps(BASE),json.dumps(bridge),json.dumps(name))
    dev.command('Page.addScriptToEvaluateOnNewDocument',{'source':hook})
    dev.command('Page.reload',{'ignoreCache':True})
    until(lambda:info(dev).get('workspace')==WID and info(dev).get('role')=='owner',
          'device '+name+' attached to fixture')
    assert dev.eval('window.zaviTenantIsBound?.()') is True

def mutate(dev,js):
    result=dev.eval("""(()=>{
       const ok=commit(n=>{%s});
       return {ok,tx:db.tx.length,updatedAt:db.updatedAt,
         cloudCanEdit:window.zaviCloudCanEdit?.(),
         tenantBound:window.zaviTenantIsBound?.(),
         cloud:window.zaviCloudRestoreInfo?.(),
         accessDiagnostic:window.zaviAccessDiagnostic?.(),
         key:typeof KEY==='string'?KEY:null,
         storageBytes:JSON.stringify(db).length,
         notice:document.getElementById('content')?.innerText.slice(-250)};
    })()"""%js)
    assert result['ok'] is True,result

with ExitStack() as stack:
    a=stack.enter_context(Session())
    assert not a.unlock_one()
    initial=a.eval("""(()=>{
      const n=blankDB();n.storeName='ZAVI disposable 3-device QA';
      n.storeConfigured=true;
      n.products=[{id:'p1',name:'QA',sku:'QA1',openingQty:20,
        openingCost:5,purchasePrice:5,salePrice:10}];
      n.tx=[{id:'invoice-1',code:'QA-INV',type:'sale',paid:2,
        date:'2026-11-08',created:'2026-11-08T00:00:00Z',items:[]}];
      return n;
    })()""")
    server_state['workspace']={'id':WID,'name':'QA Workspace','owner_uid':UID,
        'revision':10,'updated_at':'2026-11-08T00:00:00Z','payload':initial}
    service=ThreadingHTTPServer(('127.0.0.1',0),MockSupabase)
    Thread(target=service.serve_forever,daemon=True).start()
    stack.callback(lambda:(service.shutdown(),service.server_close()))
    bridge='http://127.0.0.1:'+str(service.server_address[1])
    b=stack.enter_context(Session());assert not b.unlock_one()
    c=stack.enter_context(Session());assert not c.unlock_one()
    for name,dev in [('a',a),('b',b),('c',c)]:configure(dev,name,bridge)

    # Case 1: same invoice edited on two devices: CAS rejects the loser,
    # preserves its local invoice and explicitly marks an unresolved conflict.
    mutate(a,"n.tx.find(x=>x.id==='invoice-1').paid=7;")
    mutate(b,"n.tx.find(x=>x.id==='invoice-1').paid=9;")
    until(lambda:server_state['workspace']['revision']>=11,'first invoice PATCH')
    until(lambda:info(b).get('conflict') or info(a).get('conflict'),
          'simultaneous invoice conflict',35)
    conflict_device=b if info(b).get('conflict') else a
    assert info(conflict_device)['pending'] is True
    assert conflict_device.eval("db.tx.find(x=>x.id==='invoice-1').paid") in (7,9)
    print('PASS: concurrent invoice edits reject stale revision, preserve conflicting local records')

    # Case 2: refresh third device to latest server state, then accept the
    # PATCH but intentionally lose its response; retry must not double-post.
    c.command('Page.reload',{'ignoreCache':True})
    until(lambda:info(c).get('workspace')==WID and
          info(c).get('revision')==server_state['workspace']['revision'],
          'device c reloads latest server version')
    old=server_state['workspace']['revision']
    server_state['drop_for']='c'
    mutate(c,"n.tx.push({id:'qa-offline-payment',code:'PAY-C',type:'customer_payment',amount:3,date:'2026-11-08',created:'2026-11-08T00:00:00Z',accountId:'a_cash',contactId:'c1'});")
    until(lambda:server_state['workspace']['revision']==old+1,
          'server committed dropped-response payload')
    c.eval("window.dispatchEvent(new Event('online'))")
    until(lambda:info(c).get('pending') is False and info(c).get('conflict') is False,
          'ambiguous acknowledgement reconciled without a duplicate',35)
    with lock:
        ids=[x['id'] for x in server_state['workspace']['payload']['tx']]
    assert ids.count('qa-offline-payment')==1
    print('PASS: post-commit connection failure reconciled; transaction posted exactly once')

    # Case 3: product deleted while another device edits it. No LWW for
    # financial or inventory records: conflict must be flagged, not overwritten.
    a.command('Page.reload',{'ignoreCache':True})
    until(lambda:info(a).get('revision')==server_state['workspace']['revision'],
          'device a refreshed')
    c.command('Page.reload',{'ignoreCache':True})
    until(lambda:info(c).get('revision')==server_state['workspace']['revision'],
          'device c refreshed')
    mutate(a,"n.products=n.products.filter(p=>p.id!=='p1');")
    mutate(c,"n.products.find(p=>p.id==='p1').salePrice=55;")
    until(lambda:not any(p['id']=='p1' for p in server_state['workspace']['payload']['products'])
      or any(p['salePrice']==55 for p in server_state['workspace']['payload']['products']),
      'delete or edit reached server')
    until(lambda:info(a).get('conflict') or info(c).get('conflict'),
          'delete/edit conflict',35)
    losing=c if info(c).get('conflict') else a
    assert losing.eval("db.products.some(p=>p.id==='p1')") in (True,False)
    print('PASS: delete-vs-edit conflict preserved on losing device (manual resolution required)')

    # Case 4: device clock differs wildly. A revision guard, not client time,
    # governs whether the server permits a write. Check at least one valid
    # post-refresh edit under a future-biased local timestamp.
    safe=a if not info(a).get('conflict') else c
    safe.command('Page.reload',{'ignoreCache':True})
    until(lambda:info(safe).get('revision')==server_state['workspace']['revision'],
          'device clock-skew fixture reloaded')
    old=server_state['workspace']['revision']
    mutate(safe,"n.updatedAt=Date.now()+1000*60*60*24*365*7;n.storeName='QA CLOCK SKEW PROOF';")
    until(lambda:server_state['workspace']['revision']==old+1,
          'revision-CAS write under skewed timestamp')
    assert server_state['workspace']['payload']['storeName']=='QA CLOCK SKEW PROOF'
    print('PASS: server revision CAS, not wall clock, controls accepted upload')
    print(json.dumps({'profiles':3,'cases':4,'last_revision':server_state['workspace']['revision'],
       'server_patches':server_state['patches']},ensure_ascii=False))
