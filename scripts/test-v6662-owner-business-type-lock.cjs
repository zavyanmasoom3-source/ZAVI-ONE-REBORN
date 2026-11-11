#!/usr/bin/env node
/* Verify the actual owner v47 stage() rather than a source-only pattern. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('apps/one/v47-business.js','utf8');
const from=source.indexOf(' async function stage(allowTypeChange){');
const to=source.indexOf(' async function upsert(',from);
assert(from>0&&to>from,'original v47 business stage exists');
const extracted=source.slice(from,to);
const elements={
 type:{value:'mobile',selectedOptions:[{textContent:'فروشگاه موبایل'}]},
 saveProfile:{before(el){elements[el.id]=el;for(const child of el.children||[])if(child.id)elements[child.id]=child}}
};
const local=new Map(),calls=[];
const dom={createElement(tag){return {tag,id:'',style:{cssText:''},className:'',
 dataset:{},hidden:false,checked:false,textContent:'',
 children:[],append(...nodes){this.children.push(...nodes)}}}};
const base={business_type:'gold',display_name:'QA',currency_code:'AFN',locale:'fa-AF',features:{sales:true}};
const context={
 authorized:async()=>{},snapshot:()=>({business_type:elements.type.value,
  display_name:'QA',currency_code:'AFN',locale:'fa-AF',features:{barcode:true}}),
 committedType:()=> 'gold',
 getDraft:()=>null,getCached:()=>({data:base}),
 window:{},document:dom,
 $:key=>elements[key]||null,
 localStorage:{setItem(k,v){local.set(k,v)},getItem:k=>local.get(k)},
 draftKey:()=> 'QA-draft',uid:'owner-qa',ws:'workspace-qa',
 save:(k,v)=>{calls.push({k,v})},renderFeatures:()=>{},renderContextV638:()=>{}
};
const fn=vm.runInNewContext(extracted+'\nstage',context);
(async()=>{
 const noType=await fn(false);
 assert.equal(noType.business_type,'gold');
 assert.equal(elements.type.value,'gold','feature-only Save resets unsaved type');
 assert.equal(local.get('zavi_v638_business_type_owner-qa_workspace-qa'),'gold');
 assert.equal(calls.length,1);
 elements.type.value='mobile';
 await assert.rejects(()=>fn(true),/تیک تأیید/);
 assert.equal(calls.length,1,'unconfirmed change is never stored');
 assert(elements.z6662TradeApproval&&!elements.z6662ConfirmTrade.checked);
 elements.z6662ConfirmTrade.checked=true;
 const changed=await fn(true);
 assert.equal(changed.business_type,'mobile');
 assert.equal(local.get('zavi_v638_business_type_owner-qa_workspace-qa'),'mobile');
 assert.equal(calls.length,2);
 elements.type.value='exchange';
 elements.type.selectedOptions=[{textContent:'صرافی و تبدیل ارز'}];
 await assert.rejects(()=>fn(true),/تیک تأیید/);
 assert.equal(calls.length,2);
 assert.equal(elements.z6662ConfirmTrade.checked,false);
 console.log('PASS: owner trade fixed; feature-only save does not switch; new trade needs fresh explicit confirmation.');
})().catch(e=>{console.error(e);process.exitCode=1});
