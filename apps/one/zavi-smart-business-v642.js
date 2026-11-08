/* ZAVI ONE Smart Business V64.2
   Pure presentation preferences. Never writes sales, stock, payment, user roles, or authorization.
   Owner must explicitly approve applying a profile; old preferences are retained for undo. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviSmartBusiness642=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){'use strict';
 const M=Object.freeze(['dashboard','sales','purchases','products','waste','contacts','debtors','creditors','money','hawala','expenses','reports','journal','repairs']);
 const CORE=Object.freeze(['dashboard','sales','purchases','products','money','reports']);
 const rules=Object.freeze({
 general:['contacts','debtors','creditors','expenses','journal'],
 supermarket:['contacts','debtors','expenses','waste'],
 pharmacy:['contacts','debtors','creditors','expenses','waste'],
 laboratory:['contacts','debtors','expenses'],
 gold:['contacts','debtors','creditors','expenses'],
 mobile:['contacts','debtors','expenses','repairs'],
 wholesale:['contacts','debtors','creditors','expenses'],
 distribution:['contacts','debtors','creditors','expenses'],
 clothing:['contacts','debtors','expenses'],
 footwear:['contacts','debtors','expenses'],
 bookstore:['contacts','debtors','expenses'],
 cosmetics:['contacts','debtors','expenses'],
 electronics:['contacts','debtors','expenses','repairs'],
 furniture:['contacts','debtors','expenses'],
 hardware:['contacts','debtors','creditors','expenses'],
 construction:['contacts','debtors','creditors','expenses'],
 exchange:['contacts','creditors','money','hawala','reports'],
 contractor:['contacts','debtors','creditors','expenses','journal'],
 services:['contacts','debtors','expenses'],
 company:['contacts','debtors','creditors','expenses','journal','hawala']
 });
 const safeType=type=>Object.prototype.hasOwnProperty.call(rules,String(type))?String(type):'general';
 const isPlain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 function preset(type){const allowed=new Set([...CORE,...rules[safeType(type)]]);return Object.fromEntries(M.map(id=>[id,allowed.has(id)]));}
 function preview(type,current){const original=isPlain(current)?current:{};const planned=preset(type);return Object.freeze({type:safeType(type),before:Object.freeze({...original}),after:Object.freeze({...original,...planned}),shown:Object.freeze(M.filter(id=>planned[id])),hidden:Object.freeze(M.filter(id=>!planned[id])),note:'تغییر فقط نمایش بخش‌هاست؛ داده مالی، موجودی، صلاحیت و اشتراک حذف یا تغییر نمی‌شود.'});}
 function restore(snapshot){if(!isPlain(snapshot))throw Error('نسخه قبلی تنظیمات پیدا نشد.');const out={};for(const [id,value] of Object.entries(snapshot)){if(M.includes(id)&&typeof value==='boolean')out[id]=value;}return out;}
 return Object.freeze({modules:M,core:CORE,types:Object.freeze(Object.keys(rules)),safeType,preset,preview,restore});
});
