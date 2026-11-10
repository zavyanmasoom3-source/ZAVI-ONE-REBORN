#!/usr/bin/env node
'use strict';
// Execute the real ADMIN account-control click handler with synthetic RPCs.
// No live accounts, tokens, emails or Supabase requests.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('apps/admin/account-control.js','utf8');
const app=fs.readFileSync('apps/admin/app.js','utf8');
assert.doesNotMatch(source,/zavi_owner_delete_customer|data-v24="permanent-delete"/,
 'ADMIN account list must never expose permanent customer deletion');
assert.doesNotMatch(app,/DELETE ALL CUSTOMER ACCOUNTS|zavi_owner_delete_customer|p_preview\s*:\s*false/,
 'ADMIN bulk action must not call irreversible purge');
assert.match(app,/zavi_admin_trash_all_customer_accounts/,
 'Bulk action must use recoverable trash');
const a=source.indexOf('async function click(e){');
const b=source.indexOf('setInterval(init,2000)',a);
assert.ok(a>0&&b>a,'ADMIN click handler located');
const code=source.slice(a,b);
const id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const name='Synthetic Store';
const account={workspace_id:id,workspace_name:name,owner_email:'qa@example.invalid'};
function fixture({owner=true,agree=true,typed=name,reply=true}={}){
 const calls=[],logs=[];
 const context={accounts:[account],busy:false,opened:true,
  verifyOwner:async()=>owner,
  confirm:()=>{logs.push('confirm');return agree},
  prompt:()=>{logs.push('typed');return typed},
  alert:m=>logs.push('alert:'+m),
  api:()=>({notify:m=>logs.push('notify:'+m)}),
  rpc:async(method,body)=>{calls.push({method,body});return reply},
  refresh:async()=>logs.push('refresh'),
  close:()=>{},isMainAdmin:()=>owner
 };
 vm.createContext(context);
 vm.runInContext(code+'\nthis.invoke=click;',context);
 const click=op=>context.invoke({target:{id:'',closest:()=>({dataset:{v24:op,id}})}});
 return {click,calls,logs,context};
}
(async()=>{
 let f=fixture({owner:false});await f.click('archive');
 assert.equal(f.calls.length,0,'non-owner client blocked');
 f=fixture({agree:false});await f.click('archive');
 assert.equal(f.calls.length,0,'first confirmation required');
 f=fixture({typed:'WRONG'});await f.click('archive');
 assert.equal(f.calls.length,0,'exact name second confirmation required');
 f=fixture({reply:false});await f.click('archive');
 assert.equal(f.calls.length,1);
 assert.equal(f.logs.some(x=>x.startsWith('notify:')),false,'no success for server denial');
 f=fixture();await f.click('archive');
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].method,'zavi_admin_trash_customer');
 assert.equal(f.calls[0].body.p_workspace_id,id);
 assert.equal(f.logs.filter(x=>x==='confirm').length,1);
 assert.equal(f.logs.filter(x=>x==='typed').length,1);
 assert.equal(f.logs.filter(x=>x==='refresh').length,1);
 f=fixture();await f.click('restore');
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].method,'zavi_admin_restore_trash_customer');
 assert.equal(f.calls[0].body.p_workspace_id,id);
 f=fixture({owner:false});await f.click('restore');
 assert.equal(f.calls.length,0,'non-owner restore blocked');
 console.log('PASS: true ADMIN account handler requires central owner, two confirmations, reversible server trash and verified restore');
 console.log('PASS: no hard-delete RPC or UI route remains in active ADMIN source');
})().catch(e=>{console.error(e);process.exitCode=1});
