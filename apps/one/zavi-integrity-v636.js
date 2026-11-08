/* ZAVI ONE V63.6: read-only local accounting data integrity diagnostics.
 * Never mutates snapshots, contacts, transactions, or remote data.
 * Results are tenant-local and only displayed when the user opens the diagnostics.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviIntegrityAudit=api;}) (typeof window==='object'?window:null,function(){'use strict';
 const MAX_ISSUES=300;
 const barcodeCode=x=>String(x??'').normalize('NFKC').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).trim().toLowerCase();
 const validISODate=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;const d=new Date(x+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===x;};
 function audit(input){
  const findings=[],stats={products:0,contacts:0,transactions:0,accounts:0},levelOrder={critical:0,high:1,medium:2,low:3};
  function add(level,code,message,ref){if(findings.length>=MAX_ISSUES)return;findings.push({severity:level,code,message,reference:typeof ref==='string'?ref.slice(0,90):''})}
  if(!input||typeof input!=='object'||!['products','contacts','accounts','tx'].every(k=>Array.isArray(input[k]))){add('critical','INVALID_SNAPSHOT','ساختار معلومات حسابداری ناقص یا نامعتبر است.','');return {status:'invalid',stats,findings,truncated:false}}
  const products=input.products,contacts=input.contacts,accounts=input.accounts,tx=input.tx;
  stats.products=products.length;stats.contacts=contacts.length;stats.accounts=accounts.length;stats.transactions=tx.length;
  function checkIDs(rows,type){const seen=new Set();for(const record of rows){const id=String(record?.id??'').trim();if(!id){add('high','MISSING_ID',`شناسه ${type} موجود نیست.`);continue;}if(seen.has(id))add('critical','DUPLICATE_ID',`شناسه ${type} تکراری است.`,id);seen.add(id)}return seen}
  const productIds=checkIDs(products,'محصول'),contactIds=checkIDs(contacts,'مشتری'),accountIds=checkIDs(accounts,'حساب'),txIds=checkIDs(tx,'سند');
  const codes=new Map();
  for(const p of products){
   if(!p||typeof p!=='object'){add('high','INVALID_PRODUCT','ساختار محصول معتبر نیست.');continue;}
   const aliases=[p.sku,...(Array.isArray(p.barcodes)?p.barcodes:[])].map(barcodeCode).filter(Boolean);
   for(const code of new Set(aliases)){
    if(codes.has(code)&&codes.get(code)!==p.id)add('high','DUPLICATE_BARCODE','بارکد به بیش از یک محصول تعلق دارد.',code);
    else codes.set(code,p.id);
   }
   for(const field of ['openingQty','openingCost','salePrice','purchasePrice']){
    const raw=p[field];if(raw!==undefined&&raw!==null&&raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<0))add('high','BAD_PRODUCT_NUMBER',`عدد نامعتبر یا منفی در ${field} محصول.`,String(p.id||''));
   }
  }
  const receiptCodes=new Set();
  for(const t of tx){
   if(!t||typeof t!=='object'){add('high','INVALID_TX','ساختار سند معتبر نیست.');continue;}
   const id=String(t.id??'');const code=String(t.code??'').trim();
   if(code){if(receiptCodes.has(code))add('high','DUPLICATE_INVOICE','شماره سند/فاکتور تکراری است.',code);receiptCodes.add(code)}
   if(!validISODate(t.date))add('medium','BAD_DATE','تاریخ سند معتبر نیست.',id);
   if(t.contactId&&!contactIds.has(String(t.contactId)))add('medium','MISSING_CONTACT','سند به طرف حسابی اشاره می‌کند که در فهرست موجود نیست.',id);
   if(t.accountId&&!accountIds.has(String(t.accountId)))add('high','MISSING_ACCOUNT','سند به حساب مالی ناموجود اشاره می‌کند.',id);
   if(t.fromAccountId&&!accountIds.has(String(t.fromAccountId)))add('high','MISSING_ACCOUNT','حساب مبدأ سند وجود ندارد.',id);
   if(t.toAccountId&&!accountIds.has(String(t.toAccountId)))add('high','MISSING_ACCOUNT','حساب مقصد سند وجود ندارد.',id);
   for(const field of ['amount','paid','discount','shipping','fee','exchangeRate']){
    const raw=t[field];if(raw!==undefined&&raw!==null&&raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<0))add('high','BAD_TX_NUMBER',`عدد نامعتبر یا منفی در ${field} سند.`,id);
   }
   if(t.items!==undefined&&!Array.isArray(t.items)){add('critical','BAD_ITEMS','اقلام سند باید فهرست باشند.',id);continue}
   for(const line of t.items||[]){
    if(!line||typeof line!=='object'){add('high','BAD_LINE','ردیف نامعتبر در سند.',id);continue}
    if(line.productId&&!productIds.has(String(line.productId)))add('high','MISSING_PRODUCT','ردیف سند به محصولی اشاره می‌کند که دیگر موجود نیست.',id);
    for(const key of ['qty','price','cost']){
     const raw=line[key];if(raw!==undefined&&raw!==null&&raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<0))add('high','BAD_LINE_NUMBER',`عدد نامعتبر در ${key} سند.`,id);
    }
   }
  }
  const severityCounts={critical:0,high:0,medium:0,low:0};for(const f of findings)severityCounts[f.severity]++;
  findings.sort((a,b)=>levelOrder[a.severity]-levelOrder[b.severity]);
  return {status:'complete',stats,severityCounts,findings,truncated:findings.length===MAX_ISSUES,checkedAt:new Date().toISOString()};
 }
 return Object.freeze({audit});
});
