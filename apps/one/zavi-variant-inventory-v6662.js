/* V66.62: offline-first colour inventory derived from the SAME immutable invoice journal.
 * No second mutable stock total and no network writes. Fail closed on legacy/unassigned
 * transactions instead of pretending a colour balance is reliable.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviVariantInventory6662=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const scale=1000;
 const key=x=>String(x??'').trim().toLocaleLowerCase();
 const units=x=>{
  const s=String(x??'').trim();
  if(!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,3})?$/.test(s))throw Error('تعداد رنگ باید مثبت یا صفر و حداکثر سه رقم اعشار باشد.');
  const [a,b='']=s.split('.');return Number(a)*scale+Number(b.padEnd(3,'0'));
 };
 const numeric=x=>units(String(x));
 const decimal=x=>Math.round(x)/scale;
 function rows(p){
  const v=p?.industryDetails?.values?.colorVariants;
  if(!v)return [];
  let a;
  try{a=JSON.parse(v)}catch(_){throw Error('فهرست رنگ‌های محصول خراب است.')}
  if(!Array.isArray(a)||a.length>20)throw Error('حداکثر ۲۰ رنگ در یک محصول مجاز است.');
  const names=new Set(),codes=new Set();
  return a.map(x=>{
   const color=String(x?.color||'').trim(),barcode=String(x?.barcode||'').trim();
   if(!color||color.length>60)throw Error('نام رنگ معتبر نیست.');
   const id=key(color),qty=units(x.qty);
   if(names.has(id))throw Error('رنگ تکراری است: '+color);
   if(barcode&&(!/^[-a-zA-Z0-9_.]{1,70}$/.test(barcode)||codes.has(barcode.toLowerCase())))throw Error('بارکد رنگ نامعتبر یا تکراری است.');
   names.add(id);if(barcode)codes.add(barcode.toLowerCase());
   return {key:id,color,barcode,qty:decimal(qty)};
  });
 }
 function tracked(p){return p?.variantLedger?.version===1}
 function begin(p,requested,currentStock,tx){
  if(tracked(p))throw Error('دفتر رنگ‌ها قبلاً فعال شده است.');
  if(!requested.length)throw Error('برای فعال‌سازی، رنگ‌های محصول را ثبت کنید.');
  const expected=requested.reduce((sum,x)=>sum+units(String(x.qty)),0);
  if(expected!==units(String(currentStock)))throw Error('مجموع رنگ‌ها باید دقیقاً با موجودی فعلی محصول برابر باشد؛ ابتدا موجودی را تطبیق دهید.');
  p.variantLedger={version:1,startIndex:tx.length,previousTxId:tx.length?tx[tx.length-1].id:null,
    initial:requested.map(x=>({key:x.key,color:x.color,barcode:x.barcode,qty:x.qty}))};
  return p.variantLedger;
 }
 function balances(p,tx){
  const ledger=p?.variantLedger;if(!tracked(p))throw Error('دفتر مستقل رنگ‌ها هنوز فعال نشده است.');
  if(!Array.isArray(tx)||!Number.isSafeInteger(ledger.startIndex)||ledger.startIndex<0||ledger.startIndex>tx.length||
     (ledger.startIndex>0&&tx[ledger.startIndex-1]?.id!==ledger.previousTxId))
    throw Error('ترتیب اسناد قبل از دفتر رنگ‌ها تغییر کرده؛ موجودی نیاز به بررسی دارد.');
  const m=new Map((ledger.initial||[]).map(x=>[x.key,{key:x.key,color:x.color,barcode:x.barcode,scaled:units(String(x.qty))}]));
  function apply(k,quantity,sign){
   const row=m.get(k);
   if(!row)throw Error('سند به رنگ حذف‌شده یا ناشناس اشاره می‌کند: '+k);
   row.scaled+=sign*units(String(quantity));
  }
  for(const t of tx.slice(ledger.startIndex)){
   if(t.voided)continue;
   const sign=({purchase:1,sale:-1,sale_return:1,purchase_return:-1})[t.type];
   if(sign){
    for(const line of t.items||[]){
     if(line.productId!==p.id)continue;
     if(!line.variantKey)throw Error('سند بدون تعیین رنگ ثبت شده؛ موجودی رنگ قابل تأیید نیست: '+t.id);
     apply(key(line.variantKey),line.qty,sign);
    }
   }else if(t.type==='stock_adjust'&&t.productId===p.id){
    if(!t.variantKey)throw Error('اصلاح موجودی بدون رنگ ثبت شده: '+t.id);
    const amount=Number(t.delta);
    if(!Number.isFinite(amount)||Math.round(amount*1000)!==amount*1000)throw Error('مقدار اصلاح موجودی رنگ معتبر نیست.');
    apply(key(t.variantKey),String(Math.abs(amount)),Math.sign(amount));
   }
  }
  const result=[...m.values()].map(x=>({key:x.key,color:x.color,barcode:x.barcode,qty:decimal(x.scaled)}));
  if(result.some(x=>x.qty<0))throw Error('موجودی یک رنگ منفی شده؛ عملیات باید بررسی شود.');
  return result;
 }
 function verify(p,tx,total){
  const result=balances(p,tx);
  if(result.reduce((sum,x)=>sum+units(String(x.qty)),0)!==units(String(total)))
   throw Error('جمع موجودی رنگ‌ها با موجودی محصول یکی نیست؛ ثبت عملیات متوقف شد.');
  return result;
 }
 function changes(p,tx,total,requested){
  const before=verify(p,tx,total),old=new Map(before.map(x=>[x.key,x])),next=new Map(requested.map(x=>[x.key,x]));
  // Never silently remove/rename a colour with an accounting history.
  for(const x of before)if(!next.has(x.key))throw Error('برای حفظ سابقه مالی، رنگ قدیمی را حذف نکنید: '+x.color);
  const adjustments=[];
  for(const x of requested){
   const previous=old.get(x.key);
   const delta=units(String(x.qty))-units(String(previous?.qty??0));
   if(delta!==0)adjustments.push({variantKey:x.key,delta:decimal(delta)});
  }
  return adjustments;
 }
 function addNewColours(p,requested){
  const ledger=p.variantLedger,known=new Set(ledger.initial.map(x=>x.key));
  for(const x of requested)if(!known.has(x.key)){ledger.initial.push({key:x.key,color:x.color,barcode:x.barcode,qty:0});known.add(x.key)}
 }
 function verifyWorkspace(state){
  const catalog=new Map((state.products||[]).filter(tracked).map(p=>[p.id,p]));
  if(!catalog.size)return true;
  const totals=new Map([...catalog].map(([id,p])=>[id,units(String(p.openingQty||0))]));
  const seen=new Set();
  for(const t of state.tx||[]){
   if(seen.has(t.id))throw Error('سند تکراری در دفتر حسابداری پیدا شد: '+t.id);
   seen.add(t.id);
   if(t.voided)continue;
   const sign=({purchase:1,sale:-1,sale_return:1,purchase_return:-1})[t.type];
   if(sign)for(const line of t.items||[]){
    if(catalog.has(line.productId))totals.set(line.productId,totals.get(line.productId)+
      sign*units(String(line.qty)));
   }
   else if(t.type==='stock_adjust'&&catalog.has(t.productId)){
    const amount=Number(t.delta);
    if(!Number.isFinite(amount)||!Number.isInteger(Math.round(amount*1000))||
       Math.abs(amount*1000-Math.round(amount*1000))>0.000001)
      throw Error('سند اصلاح مقدار نامعتبر دارد.');
    totals.set(t.productId,totals.get(t.productId)+Math.round(amount*1000));
   }
  }
  for(const [id,p] of catalog)verify(p,state.tx||[],decimal(totals.get(id)));
  return true;
 }
 return Object.freeze({rows,units,key,tracked,begin,balances,verify,changes,addNewColours,verifyWorkspace});
});
