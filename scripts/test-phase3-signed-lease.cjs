#!/usr/bin/env node
'use strict';
/* Stage 3: signed-lease contract without production credentials or ledgers.
 * A deliberately stubbed successful signature lets the real claim-validation
 * code be exercised. An actual WebCrypto P-256 import checks the public JWK.
 * This cannot certify a live issued server lease or Android secure storage.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {TextEncoder,TextDecoder}=require('node:util');
const src=fs.readFileSync(path.join(__dirname,'../apps/one/offline-license-secure.js'),'utf8');
const pubMatch=src.match(/const PUBLIC_KEY=(\{[^\n]+\});/);
assert.ok(pubMatch,'Pinned public key missing from the real app');
const pinned=JSON.parse(pubMatch[1]);
assert.equal(pinned.kty,'EC');
assert.equal(pinned.crv,'P-256');

let currentUser='fixture-owner',currentWorkspace='fixture-workspace',
    currentDevice='fixture-device',nextToken=null,nextStatus=200;
const store=new Map(),requests=[],importedKeys=[];
const window={
 zaviCloudGetAuthSession:()=>({user:{id:currentUser}}),
 zaviCloudRestoreInfo:()=>({workspace:currentWorkspace,role:'owner'}),
 zaviDeviceActivation:{getDeviceId:()=>currentDevice}
};
const crypto={
 subtle:{
   async importKey(format,jwk,alg,extractable,uses){
     assert.equal(format,'jwk');assert.equal(jwk.x,pinned.x);
     importedKeys.push({alg,uses});
     return {key:'fixture-key'};
   },
   async verify(_algorithm,_key,signature){
     return Buffer.from(signature).toString('utf8')==='valid-test-signature';
   }
 }
};
const localStorage={
 getItem:k=>store.get(k)||null,
 setItem:(k,v)=>store.set(k,String(v))
};
const sandbox={
 window,crypto,localStorage,TextEncoder,TextDecoder,AbortController,
 setTimeout,clearTimeout,console,
 atob:s=>Buffer.from(s,'base64').toString('latin1'),
 fetch:async(url,opts)=>{
   requests.push({url,method:opts.method,body:JSON.parse(opts.body)});
   return {ok:nextStatus===200,status:nextStatus,json:async()=>nextStatus===200?
     {token:nextToken}:{error:'Subscription inactive'}};
 }
};
vm.runInNewContext(src,sandbox,{filename:'offline-license-secure.js'});
const api=window.zaviSecureOfflineLicense;
assert.equal(typeof api.verify,'function');
const encode=object=>Buffer.from(JSON.stringify(object)).toString('base64url');
const sig=word=>Buffer.from(word).toString('base64url');
const now=Math.floor(Date.now()/1000);
const basic={
 iss:'zavi-one-lease-v1',aud:'zavi-one-client',
 sub:'fixture-owner',workspace_id:'fixture-workspace',device_id:'fixture-device',
 plan:'trial',status:'active',can_write:true,
 iat:now-10,exp:now+300,subscription_exp:now+600,
 offline_days:7
};
function jwt(claims=basic,header={alg:'ES256',typ:'JWT'},signature='valid-test-signature'){
 return encode(header)+'.'+encode(claims)+'.'+sig(signature);
}
(async()=>{
 // Confirm that the pinned key is importable in actual WebCrypto without
 // ever requesting, deriving or exposing the private signing key.
 const key=await webcrypto.subtle.importKey('jwk',pinned,
  {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 assert.equal(key.type,'public');
 const valid=jwt();
 assert.equal((await api.verify(valid,'fixture-workspace','fixture-device')).sub,'fixture-owner');
 assert.ok(importedKeys.length===1,'Verify must import the pinned key');
 for(const [kind,claims,expected] of [
  ['owner',{sub:'other-owner'},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['workspace',{workspace_id:'other-workspace'},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['device',{device_id:'other-device'},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['write denied',{can_write:false},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['not active',{status:'suspended'},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['unsupported plan',{plan:'free'},'WRONG_USER_WORKSPACE_OR_DEVICE'],
  ['expired',{exp:now-1},'LEASE_EXPIRED_OR_DEVICE_TIME_INVALID'],
  ['future start',{iat:now+180},'LEASE_EXPIRED_OR_DEVICE_TIME_INVALID'],
  ['oversized lease',{exp:now+400*86400,subscription_exp:now+500*86400},
   'LEASE_EXPIRED_OR_DEVICE_TIME_INVALID'],
  ['past subscription',{subscription_exp:now+200},'SUBSCRIPTION_EXPIRY_INVALID']
 ]){
  await assert.rejects(api.verify(jwt({...basic,...claims}),
    'fixture-workspace','fixture-device'),
    error=>error.message===expected,kind);
 }
 await assert.rejects(api.verify(jwt(basic,{alg:'none',typ:'JWT'}),
   'fixture-workspace','fixture-device'),/INVALID_ALGORITHM/);
 await assert.rejects(api.verify(jwt(basic,undefined,'invalid-signature'),
   'fixture-workspace','fixture-device'),/INVALID_SIGNATURE/);
 await assert.rejects(api.verify('not-a-jwt','fixture-workspace','fixture-device'),
   /INVALID_TOKEN_STRUCTURE/);

 store.set('zavi_v38_signed_lease_fixture-owner_fixture-workspace',valid);
 assert.equal((await api.cached('fixture-workspace')).claims.sub,'fixture-owner');
 currentUser='another-owner';
 assert.equal(await api.cached('fixture-workspace'),null,'other owner must not reuse cached lease');
 currentUser='fixture-owner';
 currentDevice='another-device';
 assert.equal(await api.cached('fixture-workspace'),null,'other device must not reuse cached lease');
 currentDevice='fixture-device';
 nextToken=valid;
 const lease=await api.request('fixture-workspace',
   {access_token:'fixture-session'},
   {url:'https://fixture.invalid',key:'fixture-public'});
 assert.equal(lease.claims.sub,'fixture-owner');
 assert.equal(requests.length,1);
 assert.equal(requests[0].method,'POST');
 assert.deepEqual(requests[0].body,{workspace_id:'fixture-workspace',device_id:'fixture-device'});
 const existing=store.get('zavi_v38_signed_lease_fixture-owner_fixture-workspace');
 nextToken=jwt({...basic,device_id:'another-device'});
 await assert.rejects(api.request('fixture-workspace',
   {access_token:'fixture-session'},
   {url:'https://fixture.invalid',key:'fixture-public'}));
 assert.equal(store.get('zavi_v38_signed_lease_fixture-owner_fixture-workspace'),existing,
  'invalid lease must not replace the valid cached one');
 nextStatus=403;
 await assert.rejects(api.request('fixture-workspace',
   {access_token:'fixture-session'},
   {url:'https://fixture.invalid',key:'fixture-public'}));
 assert.equal(store.get('zavi_v38_signed_lease_fixture-owner_fixture-workspace'),existing,
  'server denial must not replace existing verified token');
 console.log('PASS: ES256 public JWK import, owner/device/workspace/expiry constraints,');
 console.log('PASS: invalid signature, denied writes, 403, cache isolation and token retention');
})().catch(e=>{console.error(e);process.exitCode=1});
