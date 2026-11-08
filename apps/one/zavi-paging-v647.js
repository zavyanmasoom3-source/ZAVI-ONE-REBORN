/* ZAVI ONE V64.7: client-side paging of EXISTING records; never mutates ledger. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviPaging647=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const SIZE=60;
 function page(items,index=0,size=SIZE){
  if(!Array.isArray(items))throw new TypeError('items must be an array');
  const safeSize=Number.isInteger(size)&&size>=10&&size<=200?size:SIZE;
  const pages=Math.max(1,Math.ceil(items.length/safeSize));
  const at=Number.isInteger(index)&&index>=0?Math.min(index,pages-1):0;
  return Object.freeze({rows:items.slice(at*safeSize,(at+1)*safeSize),page:at,pages,total:items.length,from:items.length?at*safeSize+1:0,to:Math.min(items.length,(at+1)*safeSize),size:safeSize});
 }
 const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function controls(result,name){
  if(!result||result.pages<2)return '';
  const key=escape(name);return `<nav class="z647-pages" aria-label="صفحه‌بندی ${key}"><span aria-live="polite">${result.from}–${result.to} از ${result.total}</span><button type="button" data-zavi-page="${key}" data-direction="prev" ${result.page===0?'disabled':''} aria-label="صفحه قبلی">قبلی</button><strong>${result.page+1} / ${result.pages}</strong><button type="button" data-zavi-page="${key}" data-direction="next" ${result.page===result.pages-1?'disabled':''} aria-label="صفحه بعدی">بعدی</button></nav>`;
 }
 return Object.freeze({page,controls,SIZE});
});
