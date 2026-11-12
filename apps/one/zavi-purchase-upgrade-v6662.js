/* Owner approved purchase form additions. The native ledger stays authoritative. */
(function(root){'use strict';
const lang=()=>{const l=document.documentElement.lang||'fa-AF';return l.startsWith('en')?2:l.startsWith('ps')?1:0};
const tr=(fa,ps,en)=>[fa,ps,en][lang()];
const rnd=n=>Math.round((n+Number.EPSILON)*100)/100;
const get=(f,k)=>f.namedItem?.(k);
const val=(f,k,d='0')=>get(f,k)?.value??d;
function number(v,label){
 const s=String(v??'').trim().replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[٬,]/g,'').replace('٫','.');
 if(!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(s))throw Error(label+' نامعتبر است.');
 return Number(s);
}
function calculate(f,gross,discount){
 if(!Number.isFinite(gross)||!Number.isFinite(discount)||gross<0||discount<0||discount>gross)throw Error('تخفیف یا مجموع نامعتبر است.');
 const customs=number(val(f,'pCustoms'),'گمرک'),insurance=number(val(f,'pInsurance'),'بیمه'),other=number(val(f,'pOther'),'هزینه دیگر');
 const taxOn=!!get(f,'pTaxOn')?.checked,rate=taxOn?number(val(f,'pTaxRate'),'درصد مالیات'):0;
 if(rate>100)throw Error('درصد مالیات بیشتر از ۱۰۰ نیست.');
 const included=taxOn&&!!get(f,'pTaxIncluded')?.checked,base=rnd(gross-discount);
 const tax=taxOn?rnd(included?base*rate/(100+rate):base*rate/100):0;
 const extra=rnd(customs+insurance+other+(included?0:tax));
 const split=!!get(f,'pSplitPay')?.checked,second=split?number(val(f,'pSecondPaid'),'پرداخت دوم'):0;
 const method=val(f,'pPayMode','credit'),alloc=val(f,'pAllocation','value');
 if(!['cash','credit','installment'].includes(method)||!['value','qty','equal'].includes(alloc))throw Error('نوع پرداخت یا تقسیم هزینه نامعتبر است.');
 const country=String(val(f,'pCountry','افغانستان')).trim(),reference=String(val(f,'pSupplierInvoice','')).trim();
 if(!country||country.length>80||reference.length>90)throw Error('کشور یا شماره فاکتور معتبر نیست.');
 return {customs,insurance,other,tax,taxRate:rate,taxIncluded:included,additional:extra,
  secondPaid:second,secondAccount:split?val(f,'pSecondAccount',''):'',
  payMode:method,allocation:alloc,country,reference,due:val(f,'pDue','')};
}
function mount(form,layout,advanced,supplier,pay){
 if(form.dataset.z66PurchaseExtraMounted||!advanced||!supplier||!pay)return;
 form.dataset.z66PurchaseExtraMounted='1';
 const el=(tag,parent,cls='')=>{const e=document.createElement(tag);if(cls)e.className=cls;parent.append(e);return e};
 function titled(parent,tag,labels){const e=el(tag,parent);e.dataset.p6Label=JSON.stringify(labels);e.textContent=labels[lang()];return e}
 function field(parent,name,label,type='number',initial='0'){
  const lab=el('label',parent,'z66p-field');titled(lab,'span',label);
  const e=el('input',lab);e.name=name;e.type=type;e.value=initial;
  if(type==='number'){e.min='0';e.step='0.01';e.inputMode='decimal';}
  else if(type!=='date'){e.maxLength=90;}
  return e
 }
 function choice(parent,name,label,items){
  const lab=el('label',parent,'z66p-field');titled(lab,'span',label);
  const select=el('select',lab);select.name=name;
  items.forEach(([v,...names])=>{const opt=el('option',select);opt.value=v;opt.dataset.p6Label=JSON.stringify(names);opt.textContent=names[lang()]});
  return select
 }
 function check(parent,name,label){
  const lab=el('label',parent,'z66p-check');const cb=el('input',lab);
  cb.type='checkbox';cb.name=name;titled(lab,'span',label);return cb
 }
 const origin=get(form.elements,'purchaseOrigin');
 const c=field(supplier,'pCountry',['کشور مبدأ (هر کشور)','اصلي هېواد (هر هېواد)','Country of origin (any country)'],'text',origin?.value==='China'?'چین':'افغانستان');
 c.addEventListener('change',()=>{if(origin)origin.value=c.value.trim()==='چین'?'China':c.value.trim()==='افغانستان'?'local':'other'});
 origin?.addEventListener('change',()=>{if(origin.value==='China')c.value='چین';else if(origin.value==='local')c.value='افغانستان'});
 const fees=el('div',advanced,'z66p-fees');
 titled(fees,'h4',['گمرک، مالیات و هزینه‌های اختیاری','ګمرک، مالیه او اختیاري لګښتونه','Customs, tax and optional expenses']);
 field(fees,'pCustoms',['هزینه گمرک','د ګمرک لګښت','Customs']);
 field(fees,'pInsurance',['بیمه و بارگیری','بیمه او بارچلونه','Insurance / loading']);
 field(fees,'pOther',['هزینه‌های دیگر','نور لګښتونه','Other expenses']);
 const taxOn=check(fees,'pTaxOn',['مالیات دارد','مالیه لري','Tax applies']);
 const taxes=el('div',fees,'z66p-tax');taxes.hidden=true;
 const taxRate=field(taxes,'pTaxRate',['درصد مالیات','د مالیې سلنه','Tax percentage']);taxRate.max='100';
 check(taxes,'pTaxIncluded',['مالیات از قبل در قیمت است','مالیه په بیه کې شامله ده','Tax already included']);
 taxOn.addEventListener('change',()=>{taxes.hidden=!taxOn.checked});
 choice(fees,'pAllocation',['تقسیم قیمت تمام‌شده','د لګښت وېش','Landed cost allocation'],[
  ['value','بر اساس ارزش','د ارزښت له مخې','By value'],
  ['qty','بر اساس تعداد','د شمېر له مخې','By quantity'],
  ['equal','مساوی بین اقلام','برابر پر قطار','Equal by line']
 ]);
 field(advanced,'pSupplierInvoice',['شماره فاکتور عرضه‌کننده','د عرضه کوونکي بل شمېره','Supplier invoice number'],'text','');
 const panel=el('div',pay,'z66p-payments');
 titled(panel,'h4',['پرداخت و حساب‌ها','تادیه او حسابونه','Payments and accounts']);
 choice(panel,'pPayMode',['نوع پرداخت','د تادیې ډول','Payment type'],[
  ['credit','قرضی / قسمی','پور / قسمي','Credit / partial'],
  ['cash','نقدی کامل','بشپړ نغدي','Fully paid'],
  ['installment','قسطی','په قسطونو','Installments']
 ]);
 titled(panel,'p',['فقط حساب‌های ثبت‌شدهٔ فروشگاه قابل استفاده‌اند. حساب جدید را در بخش پول اضافه کنید.',
  'یوازې د پلورنځي ثبت شوي حسابونه وکاروئ.','Only existing store accounts are available.']);
 const split=check(panel,'pSplitPay',['پرداخت از دو حساب','له دوو حسابونو تادیه','Two-account payment']);
 const splitArea=el('div',panel,'z66p-split');splitArea.hidden=true;
 field(splitArea,'pSecondPaid',['مبلغ پرداخت دوم','دوهمه تادیه','Second amount']);
 const main=get(form.elements,'accountId');
 const choices=[...main?.options||[]].map(o=>[o.value,o.textContent,o.textContent,o.textContent]);
 choice(splitArea,'pSecondAccount',['حساب دوم','دوهم حساب','Second account'],choices);
 split.addEventListener('change',()=>splitArea.hidden=!split.checked);
 const due=field(panel,'pDue',['تاریخ سررسید','د قسط نېټه','Due date'],'date','');
 const dueParent=due.closest('label');dueParent.hidden=true;
 const pm=get(form.elements,'pPayMode');pm.addEventListener('change',()=>dueParent.hidden=pm.value!=='installment');
 const preview=el('div',panel,'z66p-price-preview');preview.setAttribute('role','status');
 const draw=()=>{try{
  const gross=root.ZaviDecimal.sumLineTotals([...form.querySelectorAll('#orderItems .order-line')].map(x=>({
   qty:x.querySelector('[data-field="qty"]')?.value||'0',price:x.querySelector('[data-field="price"]')?.value||'0'
  })));
  const discount=number(val(form.elements,'discount'),'تخفیف');
  const c=calculate(form.elements,gross,discount);
  preview.textContent=tr('سایر هزینه‌های افزوده: ','اضافه لګښتونه: ','Added expenses: ')+
   c.additional.toLocaleString('en-US')+' '+val(form.elements,'originalCurrency','');
 }catch(e){preview.textContent=e.message||String(e)}};
 form.addEventListener('input',draw);form.addEventListener('change',draw);draw();
 const translate=()=>{if(!form.isConnected)return;
  form.querySelectorAll('[data-p6-label]').forEach(e=>{try{e.textContent=JSON.parse(e.dataset.p6Label)[lang()]}catch(_){}})};
 document.addEventListener('zavi:language-changed',translate,{once:true});
}
root.ZaviPurchaseUpgrade6662=Object.freeze({calculate,mount});
})(window);
