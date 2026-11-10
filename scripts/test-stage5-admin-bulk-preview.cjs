#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('apps/admin/zavi-admin-recovery-v141.js','utf8');
const start=source.indexOf('async function trashAll(){'),end=source.indexOf('function intercept(event)',start);
assert.ok(start>0&&end>start,'real recoverable bulk handler located');
const handler=source.slice(start,end);
assert.doesNotMatch(handler,/DELETE ALL CUSTOMER ACCOUNTS|zavi_owner_delete_customer|p_preview\s*:\s*false/);
function fixture({online=true,mode='live',preview={customer_count:2,completed:false},
 agree=true,typed='TRASH ALL CUSTOMER ACCOUNTS',result=2}={}){
 const calls=[],events=[];
 const context={busy:false,navigator:{onLine:online},
  api:()=>({getMode:()=>mode}),
  t:()=>({bulkAsk:'Move to recoverable trash?',bulkCheck:'Confirm typed phrase',bulkDone:' moved',empty:'No accounts',error:'Failure: '}),
  rpc:async(method,body)=>{calls.push({method,body});
   return method==='zavi_owner_reset_customer_accounts'?preview:result;},
  confirm:()=>{events.push('confirm');return agree},
  prompt:()=>{events.push('prompt');return typed},
  alert:x=>events.push('alert:'+x),
  refreshAccountControl:()=>events.push('refresh')
 };
 vm.createContext(context);vm.runInContext(handler+'\nthis.qa=trashAll;',context);
 return {run:()=>context.qa(),calls,events,context};
}
(async()=>{
 let f=fixture({online:false});await f.run();assert.equal(f.calls.length,0);
 f=fixture({mode:'demo'});await f.run();assert.equal(f.calls.length,0);
 f=fixture({preview:null});await f.run();
 assert.equal(f.calls.length,1);assert.equal(f.events.includes('refresh'),false);
 f=fixture({agree:false});await f.run();assert.equal(f.calls.length,1);
 f=fixture({typed:'WRONG'});await f.run();assert.equal(f.calls.length,1);
 f=fixture({result:false});await f.run();assert.equal(f.calls.length,2);
 assert.equal(f.events.includes('refresh'),false,'bad server count not trusted');
 f=fixture();await f.run();
 assert.deepEqual(f.calls.map(x=>x.method),[
  'zavi_owner_reset_customer_accounts',
  'zavi_admin_trash_all_customer_accounts'
 ]);
 assert.equal(f.calls[0].body.p_preview,true);
 assert.equal(f.calls[1].body.p_confirmation,'TRASH ALL CUSTOMER ACCOUNTS');
 assert.equal(f.events.filter(x=>x==='confirm').length,1);
 assert.equal(f.events.filter(x=>x==='prompt').length,1);
 assert.equal(f.events.filter(x=>x==='refresh').length,1);
 assert.equal(f.context.busy,false);
 console.log('PASS: real ADMIN bulk archive requires server count preview, consent, exact phrase and committed server result');
 console.log('PASS: offline, demo, invalid count and cancelled requests never mutate customer accounts');
})().catch(e=>{console.error(e);process.exitCode=1});
