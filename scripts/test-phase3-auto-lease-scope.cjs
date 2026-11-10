#!/usr/bin/env node
'use strict';
// Stage 3 regression: an old owner's late async offline-lease result must not
// consume a new owner's refresh or be displayed as the new owner's success.
// No network, real credentials, signatures or production data are used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,
 '../apps/one/zavi-store-v6579-auto-signed-offline.js'),'utf8');
const A='10000000-0000-4000-8000-000000000001';
const B='20000000-0000-4000-8000-000000000002';
const WA='30000000-0000-4000-8000-000000000003';
const WB='40000000-0000-4000-8000-000000000004';
async function flush(){for(let i=0;i<25;i++)await Promise.resolve()}
function fixture(hold){
 let user=A,workspace=WA,releaseOld,oldStarted=false;
 const calls=[],events=[],listeners={};
 const holdOld=new Promise(resolve=>{releaseOld=resolve});
 const on=(name,handler)=>(listeners[name]??=[]).push(handler);
 const emit=(name)=>{for(const f of listeners[name]||[])f({type:name})};
 const document={
  readyState:'loading',hidden:false,documentElement:{lang:'en'},
  querySelector:()=>null,addEventListener:on
 };
 const window={
  zaviCloudRestoreInfo:()=>({workspace,role:'owner'}),
  zaviCloudGetAuthSession:()=>({user:{id:user},access_token:'auth-'+user}),
  zaviCloudRefreshAuthSession:async()=>({user:{id:user},access_token:'auth-'+user}),
  zaviCloudGetPublicConfig:()=>({url:'https://fixture.invalid',key:'public-key'}),
  zaviSecureOfflineLicense:{
   device:()=> 'fixture-device-abcdefgh',
   workspace:()=>workspace,
   cached:async ws=>{
    if(hold==='cached'&&ws===WA){oldStarted=true;await holdOld;
     return {claims:{exp:Math.floor(Date.now()/1000)+360000}}}
    return null;
   },
   request:async(ws,session)=>{
    calls.push({kind:'lease',ws,session:session.access_token});
    return {claims:{exp:Math.floor(Date.now()/1000)+7200}};
   }
  },
  zaviAutoOffline:{prepare:async()=>({ready:true})},
  addEventListener:on,
  dispatchEvent:e=>events.push(e.detail),
 };
 const fetch=async (_url,opts)=>{
  const ws=JSON.parse(opts.body).p_workspace_id;
  calls.push({kind:'register',ws});
  if(hold==='register'&&ws===WA){oldStarted=true;await holdOld}
  return {ok:true,status:200,json:async()=> 'DEVICE_ALREADY_ACTIVE'};
 };
 class CustomEvent{constructor(type,{detail}={}){this.type=type;this.detail=detail}}
 vm.runInNewContext(source,{
  window,document,fetch,navigator:{onLine:true},CustomEvent,
  setTimeout:()=>0,setInterval:()=>0,console
 },{filename:'zavi-store-v6579-auto-signed-offline.js'});
 emit('DOMContentLoaded');
 return {
  start:()=>hold==='cached'?emit('focus'):window.ZaviAutoLease.refresh(),
  switch:()=>{user=B;workspace=WB;emit('zavi-cloud-workspace-selected')},
  release:()=>releaseOld(),
  get oldStarted(){return oldStarted},
  calls,events,
 };
}
async function scenario(hold){
 const f=fixture(hold);
 const started=f.start();
 await flush();
 assert.equal(f.oldStarted,true,'old '+hold+' call must be in flight');
 f.switch();await flush();
 assert.equal(f.calls.filter(c=>c.ws===WB).length,0,
  'new scope must wait for single-flight to finish');
 f.release();
 if(started?.then)await started;
 await flush();
 const newRegistrations=f.calls.filter(c=>c.kind==='register'&&c.ws===WB);
 const newLeases=f.calls.filter(c=>c.kind==='lease'&&c.ws===WB);
 const oldLeases=f.calls.filter(c=>c.kind==='lease'&&c.ws===WA);
 assert.equal(newRegistrations.length,1,'queued new scope activation');
 assert.equal(newLeases.length,1,'queued new scope signed lease');
 assert.equal(oldLeases.length,0,'stale owner must not receive a new lease');
 assert.equal(f.events.length,1,'one valid lease-ready event');
 assert.equal(f.events[0].workspace_id,WB,'only the new workspace is announced');
}
(async()=>{
 await scenario('register');
 await scenario('cached');
 console.log('PASS: new owner lease refresh is never lost after scope switch');
 console.log('PASS: stale activation and cached responses do not grant or publish');
})().catch(e=>{console.error(e);process.exitCode=1});
