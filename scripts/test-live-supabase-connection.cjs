#!/usr/bin/env node
/* Read-only connection preflight. No credentials or customer data are logged. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const one=fs.readFileSync(path.join(root,'apps/one/cloud-config.js'),'utf8');
const admin=fs.readFileSync(path.join(root,'apps/admin/app.js'),'utf8');
const shared=fs.readFileSync(path.join(root,'packages/shared/database/supabase-config.js'),'utf8');
const project='wbbmwfnmurpphwxesssx';
const url='https://'+project+'.supabase.co';
const select=(value)=>{
  const m=value.match(/sb_publishable_[A-Za-z0-9_-]{20,}/);
  assert(m,'Client publishable key missing');
  return m[0];
};
assert(one.includes(url),'ONE points to another project');
assert(admin.includes(url),'ADMIN points to another project');
assert(shared.includes(project),'Shared client points to another project');
assert.equal(select(one),select(admin),'ONE and ADMIN must use the same public project key');
for(const [app,code] of [['one',one],['admin',admin]]){
  assert(!/key\s*:\s*['"]sb_secret_/.test(code),app+' embeds a secret key');
}
(async()=>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const r=await fetch(url+'/auth/v1/health',{method:'GET',headers:{'accept':'application/json','apikey':select(one)},signal:controller.signal,redirect:'error'});
  assert(r.ok,'Supabase Auth health HTTP '+r.status);
  const ct=r.headers.get('content-type')||'';
  assert(ct.includes('json'),'Expected JSON health response');
  console.log('PASS: same live Supabase project, public key and Auth health endpoint for ONE/ADMIN');
  console.log('READ-ONLY: no login performed; no customer records read; no writes or synchronization performed');
 }finally{clearTimeout(timer);}
})().catch(e=>{console.error('LIVE SUPABASE CHECK FAILED:',e.message);process.exitCode=1;});
