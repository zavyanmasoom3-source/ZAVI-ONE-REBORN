#!/usr/bin/env node
'use strict';
// Executes the REAL apps/one/cloud.js choose() in an isolated VM.
// Never logs into Supabase, contacts a customer, edits production data or
// simulates financial permission by changing the source under test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('apps/one/cloud.js','utf8');
const start=source.indexOf('async function choose(id,created=false){');
const stop=source.indexOf('async function loadMembers(force=false){',start);
assert.ok(start>=0&&stop>start,'actual cloud workspace selection found');
const chooseSource=source.slice(start,stop);
const owner='11111111-1111-4111-8111-111111111111';
const ws='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const store='Synthetic no-money QA store';
const localAt=Date.now()-120000;
const iso=ms=>new Date(ms).toISOString();
const local={updatedAt:localAt,tx:[
 {id:'LOCAL-SALE-UNSENT',type:'sale',paid:35.99},
 {id:'LOCAL-PURCHASE-UNSENT',type:'purchase',paid:15.50}],
 products:[{id:'p',stock:2}],contacts:[{id:'c'}]};
const remote={updatedAt:localAt-10000,tx:[],products:[],contacts:[]};
const pendingKey='zavi_v34_pending_'+owner+'_'+ws;
const localKey='zavi_v34_tenant_'+owner+'_'+ws;
function testCase({resetAt=null,revision=11,localCopy=local,marker=true,
 approve=true,typed=store,failQuarantine=false,failActivate=false,
 ownerSwitch=false}={}){
 const m=new Map();
 if(localCopy!==null)m.set(localKey,JSON.stringify(localCopy));
 if(marker)m.set(pendingKey,JSON.stringify({
  workspace_id:ws,owner_uid:owner,revision:10,
  local_updated_at:localAt,recorded_at:iso(localAt),source:'v43_precommit'
 }));
 const actions=[];
 const storage={
  getItem:k=>m.has(k)?m.get(k):null,
  setItem:(k,v)=>{
   if(failQuarantine&&k.startsWith('zavi_v35_reset_quarantine_'))
    throw Error('DISK_FULL');
   m.set(k,String(v));actions.push('set:'+k);
  },
  removeItem:k=>{m.delete(k);actions.push('remove:'+k)}
 };
 const server={id:ws,name:store,owner_uid:owner,revision,
  payload:{...remote,zaviMaintenanceResetAt:resetAt}};
 const ctx={
  session:{user:{id:owner}},workspace:null,role:null,priorRole:null,
  revision:0,pending:false,conflict:false,syncTimer:0,lastSync:'',
  navigator:{onLine:false},localStorage:storage,window:{
   zaviTenantHasCached:()=>localCopy!==null,
   zaviTenantActivate:(id,w,payload,preserve)=>{
    actions.push('activate:'+preserve);
    if(failActivate)throw Error('STORAGE_QUOTA_FAIL');
    if(!preserve)storage.setItem(localKey,JSON.stringify(payload));
   },
   dispatchEvent:e=>actions.push('event:'+e.type)
  },
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},
  request:async()=>{if(ownerSwitch)ctx.session={user:{id:'ANOTHER_USER'}};return[server]},
  tr:()=>'',readPending:()=>marker?JSON.parse(m.get(pendingKey)||'null'):null,
  readStorage:(store,key)=>{try{return JSON.parse(store.getItem(key)||'null')}catch{return null}},
  writeStorage:(store,key,val)=>val===null?store.removeItem(key):store.setItem(key,JSON.stringify(val)),
  tenantPendingKey:()=>pendingKey,OFFLINE_WORKSPACE_KEY:'offline-meta-',
  ROLECACHEKEY:'role',WSKEY:'selected',PREFERRED_WORKSPACE_PREFIX:'preferred-',
  saveOfflineWorkspace:()=>{},resetMemberState:()=>{},loadMembers:async()=>{},
  closeModal:()=>{},render:()=>{},changeInfo:msg=>actions.push('msg:'+msg),
  page:'dashboard',clearTimeout:()=>{},setTimeout:()=>0,
  push:()=>{actions.push('push')},
  confirm:()=>{actions.push('confirm');return approve},
  prompt:()=>{actions.push('prompt');return typed},
  console,Date
 };
 vm.createContext(ctx);
 vm.runInContext(chooseSource+'\nthis.runChoose=choose;',ctx);
 return {run:()=>ctx.runChoose(ws),ctx,m,actions};
}
const countQuarantine=m=>[...m.keys()].filter(k=>k.startsWith('zavi_v35_reset_quarantine_'));
(async()=>{
 // An OLD reset must never overwrite NEW local sale/purchase even though
 // server has advanced revision since the user last checked in.
 let x=testCase({resetAt:iso(localAt-60000)});
 await x.run();assert.equal(x.ctx.pending,true);assert.equal(x.ctx.conflict,true);
 assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
 assert.ok(x.m.has(pendingKey));assert.equal(countQuarantine(x.m).length,0);
 assert.equal(x.actions.includes('confirm'),false);
 // Unknown, malformed or future reset time must fail closed.
 for(const stamp of [null,'2026-11-10','not-a-date',iso(Date.now()+86400000)]){
  x=testCase({resetAt:stamp});await x.run();
  assert.equal(x.ctx.pending,true);assert.equal(x.ctx.conflict,true);
  assert.ok(x.m.has(pendingKey));assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
  assert.equal(x.actions.includes('confirm'),false);
 }
 // An actually later reset still requires first explicit approval.
 x=testCase({resetAt:iso(localAt+60000),approve:false});
 await x.run();assert.equal(x.ctx.pending,true);assert.equal(x.actions.includes('confirm'),true);
 assert.equal(x.actions.includes('prompt'),false);assert.ok(x.m.has(pendingKey));
 // Wrong shop name must not clear the durable unsent queue.
 x=testCase({resetAt:iso(localAt+60000),typed:'WRONG SHOP'});
 await x.run();assert.equal(x.ctx.pending,true);assert.equal(x.ctx.conflict,true);
 assert.ok(x.m.has(pendingKey));assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
 // Disk quota error on backup MUST preserve the complete local snapshot and marker.
 x=testCase({resetAt:iso(localAt+60000),failQuarantine:true});
 await assert.rejects(x.run(),/پشتیبان آفلاین تأیید نشد/);
 assert.ok(x.m.has(pendingKey));assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
 assert.equal(x.actions.some(a=>a.startsWith('activate:')),false);
 // If the app fails to activate the new ledger after quarantine, the
 // pending marker remains and original ledger survives.
 x=testCase({resetAt:iso(localAt+60000),failActivate:true});
 await assert.rejects(x.run(),/STORAGE_QUOTA_FAIL/);
 assert.ok(x.m.has(pendingKey));assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
 assert.equal(countQuarantine(x.m).length,1);
 // Only two confirmed owner actions and a verified backup allow clearing.
 x=testCase({resetAt:iso(localAt+60000)});
 await x.run();assert.equal(x.ctx.pending,false);assert.equal(x.ctx.conflict,false);
 assert.equal(x.actions.filter(a=>a==='confirm').length,1);
 assert.equal(x.actions.filter(a=>a==='prompt').length,1);
 assert.equal(countQuarantine(x.m).length,1);
 assert.deepEqual(JSON.parse(x.m.get(countQuarantine(x.m)[0])).tx,local.tx);
 assert.equal(x.m.has(pendingKey),false);
 assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,remote.tx);
 assert.ok(x.actions.indexOf('activate:false')<
           x.actions.findIndex(a=>a.startsWith('remove:')),'pending clear must follow activation');
 // No pending marker => no accidental quarantine/no prompt.
 x=testCase({resetAt:iso(localAt+60000),marker:false});
 await x.run();assert.equal(x.actions.includes('confirm'),false);
 // Other owner's delayed network reply must not rebind the old workspace.
 x=testCase({resetAt:iso(localAt+60000),ownerSwitch:true});
 await assert.rejects(x.run(),/نشست حساب تغییر کرده/);
 assert.ok(x.m.has(pendingKey));assert.deepEqual(JSON.parse(x.m.get(localKey)).tx,local.tx);
 console.log('PASS: actual cloud choose() protects unsent financial sales/purchases from stale reset and clock changes');
 console.log('PASS: two confirmations + verified quarantine required; crash/quota refuses discard; pending marker cleared ONLY after fresh activation');
})().catch(e=>{console.error(e);process.exitCode=1});
