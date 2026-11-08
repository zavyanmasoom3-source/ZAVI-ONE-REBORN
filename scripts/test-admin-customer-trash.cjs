#!/usr/bin/env node
/* Regression: old ADMIN customer delete buttons must never bypass the second
 * confirmation. All RPCs are simulated; no live customer is touched.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('apps/admin/zavi-admin-recovery-v141.js','utf8');
const from=source.indexOf('async function trashOne(button)');
const to=source.indexOf('async function trashAll()',from);
assert.ok(from>0&&to>from,'Legacy soft-delete handler is present');
const handler=source.slice(from,to);
assert.ok(!/permanent[_-]delete|DELETE\s+FROM|hard[_-]delete/i.test(handler),
  'No hard-deletion path may be introduced');
const uuid='00000000-0000-4000-8000-000000000002';
const name='Test Shop — ONLY QA';
const button={
 dataset:{id:uuid},
 closest:()=>({querySelector:()=>({textContent:name})})
};
function fixture({agree=false,typed=null,result=true}={}){
 const actions=[];
 const context={
  busy:false,
  t:()=>({trashConfirm:'Move to recoverable trash?',trashDone:'Archived',error:'Error'}),
  confirm:msg=>{actions.push({type:'confirm',msg});return agree},
  prompt:msg=>{actions.push({type:'prompt',msg});return typed},
  alert:msg=>actions.push({type:'alert',msg}),
  rpc:async(method,body)=>{actions.push({type:'rpc',method,body});return result},
  refreshAccountControl:()=>actions.push({type:'refresh'})
 };
 vm.createContext(context);vm.runInContext(handler,context);
 return{run:()=>vm.runInContext('trashOne',context)(button),actions,context};
}
(async()=>{
 const cancelled=fixture({agree:false,typed:name});await cancelled.run();
 assert.equal(cancelled.actions.filter(x=>x.type==='rpc').length,0);
 assert.equal(cancelled.actions.filter(x=>x.type==='prompt').length,0);
 const mismatch=fixture({agree:true,typed:'Wrong shop'});await mismatch.run();
 assert.equal(mismatch.actions.filter(x=>x.type==='rpc').length,0);
 assert.equal(mismatch.actions.filter(x=>x.type==='refresh').length,0);
 const empty=fixture({agree:true,typed:null});await empty.run();
 assert.equal(empty.actions.filter(x=>x.type==='rpc').length,0);
 const success=fixture({agree:true,typed:name});await success.run();
 const calls=success.actions.filter(x=>x.type==='rpc');
 assert.equal(calls.length,1);
 assert.equal(calls[0].method,'zavi_admin_trash_customer');
 assert.equal(calls[0].body.p_workspace_id,uuid);
 assert.match(calls[0].body.p_reason,/دو تأیید/);
 assert.equal(success.actions.filter(x=>x.type==='refresh').length,1);
 const denied=fixture({agree:true,typed:name,result:false});await denied.run();
 assert.equal(denied.actions.filter(x=>x.type==='refresh').length,0);
 assert.equal(denied.context.busy,false);
 console.log('PASS: legacy ADMIN soft-delete needs two exact confirmations, only vetted RPC, no success on denial');
})().catch(e=>{console.error(e);process.exitCode=1});
