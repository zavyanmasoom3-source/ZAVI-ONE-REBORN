/* ZAVI ONE 64.1 — Offline-safe barcode ownership and catalog matching.
 * Pure functions: never create products, modify stock, send network requests,
 * or infer a price for an unregistered barcode.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ZaviBarcodeV641=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
 'use strict';
 const fa='۰۱۲۳۴۵۶۷۸۹',ar='٠١٢٣٤٥٦٧٨٩';
 function code(value){return String(value??'').replace(/[۰-۹]/g,x=>String(fa.indexOf(x))).replace(/[٠-٩]/g,x=>String(ar.indexOf(x))).trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US')}
 function codes(product){return [product?.sku,...(Array.isArray(product?.barcodes)?product.barcodes:[])].map(code).filter(Boolean)}
 // A workspace snapshot gets a new products array on every committed change.
 // Build the barcode map once per immutable snapshot rather than scanning every
 // product on every keystroke (especially important for USB/Bluetooth scanners).
 const snapshots=new WeakMap();
 function catalog(products){
  if(!Array.isArray(products))return new Map();
  const saved=snapshots.get(products);
  if(saved&&saved.length===products.length)return saved.byCode;
  const byCode=new Map();
  for(const product of products){
   for(const barcode of new Set(codes(product))){
    const list=byCode.get(barcode);
    if(list)list.push(product);else byCode.set(barcode,[product]);
   }
  }
  snapshots.set(products,{length:products.length,byCode});
  return byCode;
 }
 function invalidate(products){if(Array.isArray(products))snapshots.delete(products)}
 function lookup(products,raw,excludeId){
  const q=code(raw);if(!q)return [];
  const found=catalog(products).get(q)||[];
  return excludeId==null?found.slice():found.filter(p=>p.id!==excludeId);
 }
 function unique(products,raw){const matches=lookup(products,raw);return matches.length===1?matches[0]:null}
 function inspect(products,sku,extras,currentId){
  const rawTokens=[sku,...(Array.isArray(extras)?extras:[])].map(x=>String(x??'').trim()).filter(Boolean);
  const forbiddenControl=rawTokens.some(x=>/[\x00-\x1f\x7f]/.test(String(x??'')));
  const tokens=rawTokens.map(code).filter(Boolean);
  const uniqueCodes=[...new Set(tokens)];
  const invalid=forbiddenControl?'[control character]':uniqueCodes.find(c=>c.length>70||/[\x00-\x1f\x7f]/.test(c));
  const owners=[];
  for(const token of uniqueCodes){const matches=lookup(products,token,currentId);for(const p of matches)if(!owners.some(x=>x.product.id===p.id&&x.code===token))owners.push({code:token,product:p})}
  const primary=code(sku);
  return {ok:!invalid&&uniqueCodes.filter(c=>c!==code(sku)).length<=16&&!owners.length,
   invalid:invalid||'',tooMany:uniqueCodes.filter(c=>c!==code(sku)).length>16,
   duplicateCount:tokens.length-uniqueCodes.length,primary,
   barcodes:uniqueCodes.filter(c=>c!==primary),owners,hasCode:uniqueCodes.length>0};
 }
 function moneyDisplay(value,currency){
  const n=Number(value);return Number.isFinite(n)?new Intl.NumberFormat('fa-AF',{maximumFractionDigits:2}).format(n)+' '+String(currency||'AFN'):'—';
 }
 return Object.freeze({code,codes,lookup,unique,inspect,moneyDisplay,invalidate});
});
