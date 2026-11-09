#!/usr/bin/env node
'use strict';
/* Phase 3 — real device-activation JavaScript, isolated fake owner/server.
 * No production user, SQL write, network, real ledger or offline grant.
 * The test is intentionally stricter than the client-side preflight: the
 * primary-device RPC MUST NOT be called when the guard returns false.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../apps/one/device-activation.js'),'utf8');
const WS='00000000-0000-4000-8000-000000000101';
const DEVICE='00000000-0000-4000-8000-000000000102';

function fixture({guard=true,reason='previous_pending',online=true,owner=true,
  transferResponse='DEVICE_REPLACED',initialActive=false}={}){
 let calls=[],leases=0,guardCalls=0,serverActive=initialActive;
 const states=[],messages=[];
 const local=new Map([['zavi_v26_primary_device_uuid',DEVICE]]);
 const localStorage={
  getItem:key=>local.get(key)||null,
  setItem:(key,value)=>local.set(key,String(value))
 };
 const role=owner?'owner':'staff';
 const w={
  zaviPublicLanguage:()=> 'en',
  zaviCloudRestoreInfo:()=>({workspace:WS,role}),
  zaviCloudRefreshAuthSession:async()=>({access_token:'fixture-auth'}),
  ZAVI_CLOUD_DEFAULTS:{url:'https://fixture.invalid',key:'fixture-public'},
  ZaviDevices652:{
   guardTransfer:async()=>{guardCalls++;return guard},
   lastTransferBlock:()=>({code:reason,message:'BLOCKED: '+reason})
  },
  zaviSecureOfflineLicense:{request:async()=>{
    leases++;
    return {claims:{can_write:true,exp:Math.floor(Date.now()/1000)+7200}}
  }},
  zaviOfflineShell:{prepare:async()=>({
   ready:true,controlled:true,protocol:'zavi-shell-v2'
  })},
  zaviTenantIsBound:()=>true,
  dispatchEvent:event=>states.push(event?.type),
  addEventListener:()=>{},
  alert:message=>messages.push(String(message))
 };
 const document={
  documentElement:{lang:'en'},
  getElementById:()=>null,
  addEventListener:()=>{}
 };
 const navigator={onLine:online,platform:'FixtureOS'};
 class CustomEvent{constructor(type,config){this.type=type;this.detail=config?.detail}}
 const fetch=async(url,opts)=>{
  const name=url.split('/').pop();calls.push(name);
  assert.match(url,/^https:\/\/fixture\.invalid\/rest\/v1\/rpc\//);
  assert.match(opts.headers.Authorization,/^Bearer fixture-auth$/);
  const response=value=>({ok:true,status:200,json:async()=>value});
  if(name==='zavi_v26_check_device')
   return response([{device_allowed:serverActive,
     device_status:serverActive?'active':'pending'}]);
  if(name==='zavi_v6580_owner_one_tap_transfer'){
   if(transferResponse==='REJECTED')return {ok:false,status:409,
     json:async()=>({message:'PREVIOUS_DEVICE_HAS_UNSYNCED_DATA'})};
   serverActive=true;
   return response(transferResponse);
  }
  assert.fail('Unexpected fixture RPC: '+name);
 };
 const sandbox={window:w,document,navigator,localStorage,
  crypto,CustomEvent,AbortController,setTimeout,clearTimeout,fetch,console,
  HTMLDialogElement:undefined};
 vm.runInNewContext(source,sandbox,{filename:'device-activation.js'});
 return {api:w.zaviDeviceActivation,calls,states,messages,
  get leases(){return leases},get guardCalls(){return guardCalls}};
}

(async()=>{
 for(const reason of ['local_pending','previous_pending','previous_stale',
  'server_unavailable','unknown']){
  const f=fixture({guard:false,reason});
  const ok=await f.api.replacePrimary();
  assert.equal(ok,false,reason);
  assert.deepEqual(f.calls,['zavi_v26_check_device'],reason);
  assert.equal(f.leases,0,reason);
  assert.equal(f.api.getStatus().status,'transfer_blocked',reason);
  assert.match(f.api.getStatus().message,new RegExp(reason),reason);
 }
 const unowned=fixture({owner:false});
 await assert.rejects(unowned.api.replacePrimary(),/مالک|owner/i);
 assert.deepEqual(unowned.calls,[],'staff cannot request owner transfer');
 const offline=fixture({online:false});
 assert.equal(await offline.api.replacePrimary(),false);
 assert.deepEqual(offline.calls,[],'offline transfer must not call server');
 const denied=fixture({guard:true,transferResponse:'REJECTED'});
 assert.equal(await denied.api.replacePrimary(),false);
 assert.deepEqual(denied.calls,['zavi_v26_check_device',
  'zavi_v6580_owner_one_tap_transfer']);
 assert.equal(denied.leases,0,'server denial never results in lease');
 const allowed=fixture({guard:true});
 const [first,second]=await Promise.all([
  allowed.api.replacePrimary(),allowed.api.replacePrimary()
 ]);
 assert.equal(first,true);
 assert.equal(second,true);
 assert.equal(allowed.guardCalls,1,'one in-flight owner transfer');
 assert.equal(allowed.calls.filter(x=>x==='zavi_v6580_owner_one_tap_transfer').length,1);
 assert.equal(allowed.leases,1,'signed license requested only after server transfer');
 assert.equal(allowed.api.getStatus().status,'ready');
 assert.ok(allowed.states.includes('zavi-offline-lease-ready'));
 const existing=fixture({initialActive:true,guard:false});
 assert.equal(await existing.api.replacePrimary(),true);
 assert.equal(existing.guardCalls,0,'already-active owner device needs no transfer');
 assert.equal(existing.calls.includes('zavi_v6580_owner_one_tap_transfer'),false);
 assert.equal(existing.leases,1);
 console.log('PASS: denied transfer cannot bypass local/stale/pending preflight;');
 console.log('PASS: owner, offline, server denial, idempotence and signed lease order');
})().catch(e=>{console.error(e);process.exitCode=1});
