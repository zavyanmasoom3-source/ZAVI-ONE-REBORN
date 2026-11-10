#!/usr/bin/env python3
"""Stage 4: REAL ZAVI ONE Money-page cheque UI with isolated fake HTTP.

No request touches production Supabase; this does NOT certify live finances.
Assert that cash is NEVER changed by an unconfirmed/queued cheque.
"""
from chrome_cdp import Session
import json

UID='11111111-1111-4111-8111-111111111111'
WS='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
CHEQUE='cccccccc-cccc-4ccc-8ccc-cccccccc0001'

with Session() as browser:
    browser.unlock_one()
    browser.eval("""(()=>{
      window.__s4={uid:%s,ws:%s,role:'owner',offline:false,
        calls:[],rows:[],acks:[],deferred:null};
      const original=window.fetch.bind(window);
      window.zaviCloudRestoreInfo=()=>({
        workspace:window.__s4.ws,role:window.__s4.role,pending:false,conflict:false});
      window.zaviCloudGetAuthSession=()=>({
        user:{id:window.__s4.uid},access_token:'fixture-auth-token'});
      window.zaviCloudRefreshAuthSession=async()=>window.zaviCloudGetAuthSession();
      window.zaviCloudGetPublicConfig=()=>({
        url:'https://cheque-stage4-fixture.invalid',key:'fixture-anon'});
      window.zaviCloudReconcileServer=async(expected)=>({revision:expected});
      window.fetch=async(url,opt={})=>{
        if(!String(url).startsWith('https://cheque-stage4-fixture.invalid'))
          return original(url,opt);
        const path=String(url).split('/rest/v1/')[1]||'',method=opt.method||'GET';
        const body=opt.body?JSON.parse(opt.body):null;
        window.__s4.calls.push({path,method,body});
        const make=(data,status=200)=>new Response(JSON.stringify(data),
          {status,headers:{'Content-Type':'application/json'}});
        if(method==='GET'&&path.startsWith('zavi_cheques?')){
          return make(window.__s4.rows);
        }
        if(method==='POST'&&path==='zavi_cheques'){
          if(body?.status!=='pending')
            return make({message:'Only pending allowed'},403);
          const entry={id:%s,...body,workspace_id:body.workspace_id,
            created_at:new Date().toISOString(),settled_amount:0};
          window.__s4.rows.push(entry);
          return make([entry],201);
        }
        if(method==='POST'&&path==='rpc/zavi_stage4_cheque_apply'){
          return new Promise(resolve=>{
            window.__s4.deferred={resolve,body};
          });
        }
        return make({message:'Unexpected mock path'},404);
      };
      db.contacts.push({id:'qa-stage4-customer',name:'QA Customer',
        type:'customer',openingReceivable:100,openingPayable:0});
      window.confirm=()=>true;
    })()"""%(json.dumps(UID),json.dumps(WS),json.dumps(CHEQUE)))
    browser.route('money')
    browser.until("""!!document.querySelector('#zaviStage4Cheques [data-cheque-register]')
      && !!window.ZaviChequeStage4""",'live Money page cheque form')
    browser.until("""document.querySelector('#zaviStage4Cheques [data-cheque-register] button[type=submit]')
      ?.disabled===false""",'server-fixture schema response unlocks registration')
    before=browser.eval("({cash:cashBalances().a_cash,tx:db.tx.length})")
    setup=browser.eval("""(()=>{
      const form=document.querySelector('[data-cheque-register]');
      const set=(field,value)=>{form.querySelector('[name="'+field+'"]').value=value};
      set('direction','received');set('cheque_number','QA-CHQ-100');
      set('bank_name','QA BANK');set('counterparty_id','qa-stage4-customer');
      set('amount','100.00');set('currency','AFN');
      set('issue_date','2026-11-10');set('due_date','2026-11-11');
      form.requestSubmit();
      return true;
    })()""")
    assert setup
    browser.until("""window.__s4.rows.length===1 &&
      !!document.querySelector('[data-cheque-id]')""",'pending cheque was registered')
    registered=browser.eval("""(()=>{
      const sent=window.__s4.calls.find(x=>x.path==='zavi_cheques'&&x.method==='POST');
      return {posted:sent?.body,status:window.__s4.rows[0].status,
        cash:cashBalances().a_cash,tx:db.tx.length};
    })()""")
    assert registered['posted']['status']=='pending',registered
    assert registered['status']=='pending',registered
    assert registered['cash']==before['cash'] and registered['tx']==before['tx'],registered
    browser.eval("""(()=>{
      const row=document.querySelector('[data-cheque-id]');
      row.querySelector('[data-cheque-action="settle"]').click();
      row.querySelector('[data-cheque-settle] [name=amount]').value='30.00';
      row.querySelector('[data-cheque-action="confirm-settle"]').click();
    })()""")
    browser.until("!!window.__s4.deferred",'settlement RPC in flight')
    during=browser.eval("""(()=>{
      const key='zavi_stage4_cheque_intents_'+window.__s4.uid+'_'+window.__s4.ws;
      return {queue:JSON.parse(localStorage.getItem(key)||'[]'),
        cash:cashBalances().a_cash,tx:db.tx.length};
    })()""")
    assert len(during['queue'])==1,during
    assert during['cash']==before['cash'] and during['tx']==before['tx'],during
    browser.eval("""(()=>{
      const d=window.__s4.deferred;
      window.__s4.deferred=null;
      d.resolve(new Response(JSON.stringify({ok:true,
        operation_id:d.body.p_operation,ledger_revision:3,
        status:'partially_cleared'}),
        {status:200,headers:{'Content-Type':'application/json'}}));
    })()""")
    browser.until("""(()=>{
      const key='zavi_stage4_cheque_intents_'+window.__s4.uid+'_'+window.__s4.ws;
      return JSON.parse(localStorage.getItem(key)||'[]').length===0;
    })()""",'server ACK removes only confirmed operation')
    after=browser.eval("({cash:cashBalances().a_cash,tx:db.tx.length})")
    assert after==before,after
    # No fabricated settled local record; a real backend must advance revision.
    # Mismatched or missing ACK is retained under the same operation id.
    browser.eval("""(()=>{
      const row=document.querySelector('[data-cheque-id]');
      row.querySelector('[data-cheque-action="settle"]').click();
      const form=row.querySelector('[data-cheque-settle]');
      if(form.hidden)row.querySelector('[data-cheque-action="settle"]').click();
      form.querySelector('[name=amount]').value='20.00';
      row.querySelector('[data-cheque-action="confirm-settle"]').click();
    })()""")
    browser.until("!!window.__s4.deferred",'second RPC in flight')
    browser.eval("""(()=>{
      const d=window.__s4.deferred;window.__s4.deferred=null;
      d.resolve(new Response(JSON.stringify({ok:true,
        operation_id:'99999999-9999-4999-8999-999999999999',ledger_revision:4}),
        {status:200,headers:{'Content-Type':'application/json'}}));
    })()""")
    browser.until("""document.querySelector('[data-cheque-message]')?.textContent.includes('SERVER_CONFIRMATION_MISMATCH')""",
       'mismatched ACK never counts as paid')
    rejection=browser.eval("""(()=>{
      const key='zavi_stage4_cheque_intents_'+window.__s4.uid+'_'+window.__s4.ws;
      return {queue:JSON.parse(localStorage.getItem(key)||'[]'),
        cash:cashBalances().a_cash,tx:db.tx.length};
    })()""")
    assert len(rejection['queue'])==1,rejection
    assert rejection['cash']==before['cash'] and rejection['tx']==before['tx'],rejection
    print('PASS: real Money route registers a server-pending cheque, never moves funds')
    print('PASS: outbox retains intent until matching server ACK and rejects mismatched ACK')
    print('NOT VERIFIED: production RPC, live signed auth, actual Android offline payment')
