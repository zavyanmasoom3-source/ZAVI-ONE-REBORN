/* ZAVI ONE V64.4 — verified client-side utilities.
   Never writes the accounting database. All state changes are controlled by
   the existing tenant-scoped commit() and backend ownership rules.
*/
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviBusinessPlus644=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const digits=x=>String(x??'').normalize('NFKC').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
 const code=x=>digits(x).trim().toUpperCase();
 const nameKey=x=>digits(x).trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
 const finiteNumber=x=>{const s=digits(x).trim();if(!/^(?:\d+)(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&n<=1e12?n:null};
 function previewImport(rows,existing){
  if(!Array.isArray(rows)||!Array.isArray(existing))throw Error('فایل یا گدام قابل بررسی نیست.');
  if(rows.length>10002)throw Error('حداکثر ده هزار محصول در یک فایل مجاز است.');
  const header=(rows[0]||[]).map(x=>nameKey(x));const idx=k=>header.indexOf(k.toLowerCase());
  if(idx('name')<0)throw Error('ستون name در فایل موجود نیست.');
  const value=(r,k,d='')=>{const i=idx(k);return i>=0?String(r[i]??'').trim():d};
  const seenCodes=new Map(),seenNames=new Set();
  for(const p of existing){if(!p||typeof p!=='object')continue;const pk=String(p.id||'existing');for(const c of [p.sku,...(Array.isArray(p.barcodes)?p.barcodes:[])])if(code(c))seenCodes.set(code(c),pk);if(p.name)seenNames.add(nameKey(p.name));}
  const accepted=[],rejected=[];let empty=0;
  for(let i=1;i<rows.length;i++){
   const r=rows[i]||[];if(!r.some(x=>String(x).trim())){empty++;continue}
   const line=i+1,rawName=value(r,'name'),name=rawName.slice(0,140),rawSku=code(value(r,'sku')),sku=rawSku.slice(0,70);
   const why=[];if(!name)why.push('نام محصول خالی است');
   if(sku&&seenCodes.has(sku))why.push('بارکد از قبل متعلق به محصول دیگر یا همین فایل است');
   if(!sku&&name&&seenNames.has(nameKey(name)))why.push('محصول بدون کد با همین نام قبلاً وجود دارد');
   const quantity=finiteNumber(value(r,'openingqty','0')||'0'),cost=finiteNumber(value(r,'openingcost','0')||'0'),
         sale=finiteNumber(value(r,'saleprice','0')||'0'),reorder=finiteNumber(value(r,'reorder','5')||'5');
   if([quantity,cost,sale,reorder].some(x=>x===null))why.push('تعداد/قیمت نامعتبر یا منفی است');
   if(rawName.length>140||rawSku.length>70)why.push('نام یا بارکد بیش از حد طولانی است');
   if(why.length){rejected.push({line,name,sku,reason:why.join('؛ ')});continue}
   const product={name,sku,category:value(r,'category','سایر محصولها').slice(0,90)||'سایر محصولها',openingQty:quantity,openingCost:cost,purchasePrice:cost,salePrice:sale,reorder};
   accepted.push({line,product});if(sku)seenCodes.set(sku,'file:'+line);else seenNames.add(nameKey(name));
  }
  return {accepted,rejected,empty,header:header.slice(),count:accepted.length,blocked:rejected.length};
 }
 function calcAlertSummary(db,stock,receivables=[],today=''){
  if(!db||!Array.isArray(db.products)||typeof stock!=='object'||!Array.isArray(receivables))throw Error('معلومات گزارش کامل نیست.');
  const lows=[];for(const p of db.products){const qty=Number(stock[p.id]?.qty??p.openingQty??0),minimum=Number(p.reorder??0);if(Number.isFinite(qty)&&Number.isFinite(minimum)&&minimum>0&&qty<=minimum)lows.push({id:String(p.id),name:String(p.name||''),qty,minimum});}
  const due=receivables.filter(c=>Number(c.amount)>0&&/^\d{4}-\d{2}-\d{2}$/.test(String(c.reminderDate||''))&&String(c.reminderDate)<=today)
    .map(c=>({id:String(c.id),name:String(c.name||''),amount:Number(c.amount)}));
  const pending=Array.isArray(db.tx)?db.tx.filter(t=>t&&t.sync_status==='failed').length:0;
  return {lowStock:lows,dueDebts:due,failedSync:pending,total:lows.length+due.length+pending};
 }
 function money(value){const n=Number(value);return Number.isFinite(n)?new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n):'—'}
 function thermalDocument(details,width=80){
  if(![58,80].includes(Number(width)))throw Error('عرض رول باید ۵۸ یا ۸۰ میلی‌متر باشد.');
  if(!details||!Array.isArray(details.items)||!details.items.length)throw Error('اقلام فاکتور یافت نشد.');
  const w=Number(width),data=details,rows=data.items.map(item=>{
   const q=Number(item.qty),p=Number(item.price);if(!Number.isFinite(q)||q<=0||!Number.isFinite(p)||p<0)throw Error('قیمت یا تعداد نامعتبر در فاکتور.');
   return `<div class="line"><div class="item-name">${escape(item.name)}</div><div class="line-numbers" dir="ltr"><span>${escape(digits(item.qty))} × ${money(p)}</span><b>${money(q*p)}</b></div></div>`;
  }).join('');
  const v=x=>escape(x||'—'),num=x=>money(x??0);
  const logo=data.showLogo===false?'':/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(String(data.logo||''))?`<img class=\"shop-logo\" alt=\"لوگو\" src=\"${data.logo}\">`:'';
  const accent=/^#[a-f0-9]{6}$/i.test(data.accent||'')?data.accent:'#154b8b';
  const extra=data.industryLabel?`<p>${v(data.industryLabel)}</p>`:'';
  const original=(data.originalCurrency&&data.originalCurrency!==data.currency&&Number.isFinite(Number(data.originalAmount)))?`<div><span>مبلغ اصلی خرید</span><b>${num(data.originalAmount)} ${v(data.originalCurrency)}</b></div>`:'';
  const body=`<header>${logo}<h1>${v(data.shop)}</h1>${data.showAddress===false?'':`<p>${v(data.address)}</p>`}${data.showPhone===false?'':`<p>${v(data.phone)}</p>`}</header><div class="rule"></div><div class="meta"><div>${v(data.kind)}</div>${extra}<div>شماره: <b dir="ltr">${v(data.code)}</b></div><div>تاریخ: ${v(data.date)}</div><div>مشتری: ${v(data.customer)}</div></div><div class="rule"></div><section>${rows}</section><div class="rule"></div><div class="totals"><div><span>تخفیف</span><b>${num(data.discount)}</b></div><div class="grand"><span>مبلغ نهایی</span><b>${num(data.total)} ${v(data.currency)}</b></div><div><span>پرداخت‌شده</span><b>${num(data.paid)}</b></div>${data.showBalance===false?'':`<div><span>باقی‌مانده</span><b>${num(data.remaining)}</b></div>`}${original}</div><div class="rule"></div><footer><p>${v(data.footer||'از خرید شما سپاسگزاریم')}</p></footer>`;
  return `<!doctype html><html lang="fa-AF" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>رسید ${v(data.code)}</title><style>
  @page{size:${w}mm auto;margin:0}html,body{padding:0;margin:0;color:#000;background:#fff}body{direction:rtl;font:12px/1.6 Tahoma,Arial,sans-serif;width:${w}mm;max-width:100%;box-sizing:border-box;padding:3mm;overflow-wrap:anywhere}header{text-align:center}.shop-logo{width:30mm;max-height:26mm;object-fit:contain;display:block;margin:0 auto 5px}h1{font-size:${w===58?14:18}px;margin:2px 0}p{margin:3px 0}.rule{border-top:1px dashed #222;margin:9px 0}.meta{line-height:1.8}.line{break-inside:avoid;margin-bottom:7px}.item-name{font-weight:700}.line-numbers{display:flex;justify-content:space-between;gap:8px;font-variant-numeric:tabular-nums}.totals>div{display:flex;justify-content:space-between;gap:8px;margin:5px 0}.grand{font-weight:900;border-block:1px solid ${accent};padding:6px 0}footer{text-align:center;margin:11px auto 2px}.toolbar{position:sticky;top:0;display:flex;gap:8px;background:#edf5ff;padding:8px;justify-content:center;direction:rtl}.toolbar button{background:${accent};color:#fff;border:0;border-radius:6px;padding:8px;font:inherit}
  @media print{.grand{border-color:#000!important}.toolbar{display:none}body{width:${w}mm;max-width:${w}mm;padding:1.5mm;margin:0}header,section,.totals,footer{filter:none}}@media screen{body{margin:auto;box-shadow:0 0 18px #0002;min-height:100vh}}
  </style></head><body><nav class="toolbar" role="toolbar" aria-label="چاپ و بستن رسید"><button type="button" onclick="window.print()">🖨 چاپ رسید</button><button type="button" aria-label="بستن پیش‌نمایش رسید و بازگشت به برنامه" onclick="if(window.opener&&!window.opener.closed){window.close()}else if(history.length>1){history.back()}else{window.location.replace('./index.html')}" style="background:#9b2730">✕ بستن</button></nav>${body}</body></html>`;
 }
 function quickStartCheck(data){
  const name=String(data?.name||'').trim();if(name.length<2||name.length>90)throw Error('نام تجارت باید بین ۲ تا ۹۰ حرف باشد.');
  const currency=String(data?.currency||'AFN').trim().toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error('کود ارز معتبر نیست.');
  return {name,currency,type:String(data?.type||'general')};
 }
 return Object.freeze({escape,digits,code,previewImport,calcAlertSummary,thermalDocument,quickStartCheck});
});
