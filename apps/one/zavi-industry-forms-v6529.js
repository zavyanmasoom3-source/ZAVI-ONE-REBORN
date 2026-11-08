/* ZAVI ONE V65.29 — business-aware catalog and invoice metadata.
 * Validation/presentation only. Never computes or posts money or stock.
 * Stored with product and immutable transaction line snapshot.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviIndustryForms6529=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const T=(key,label,kind='text',options)=>Object.freeze({key,label,kind,options:options||[]});
const F=(k,l)=>T(k,l),N=(k,l)=>T(k,l,'number'),D=(k,l)=>T(k,l,'date'),S=(k,l,v)=>T(k,l,'select',v);
const schema={
 general:[F('reference','شماره مرجع'),F('description','توضیح کوتاه کالا یا خدمت')],
 supermarket:[F('barcode','بارکد یا کود کالا'),S('unit','واحد فروش',['عدد','کیلوگرام','گرام','لیتر','بسته','کارتن']),F('batch','شماره بچ'),D('expiry','تاریخ انقضا'),F('supplier','عرضه‌کننده')],
 pharmacy:[F('batch','شماره بچ دوا'),D('expiry','تاریخ انقضا'),F('manufacturer','تولیدکننده'),F('strength','دوز/قدرت دوا'),S('unit','واحد فروش',['قرص','بسته','بوتل','آمپول','عدد']),F('supplier','عرضه‌کننده')],
 laboratory:[F('testCode','کود خدمت'),F('service','نام آزمایش یا خدمت'),F('sampleCode','کود نمونه بدون مشخصات مریض'),D('due','زمان آماده‌سازی'),F('staffCode','کود مسئول')],
 gold:[S('metal','نوع فلز',['طلا','نقره','پلاتین']),S('karat','عیار',['10','14','18','21','22','24']),N('grossGrams','وزن ناخالص (گرام)'),N('stoneGrams','وزن سنگ (گرام)'),N('wasteGrams','کسر/ضایعات (گرام)'),N('labor','اجرت ساخت'),N('rate24','نرخ گرام عیار ۲۴'),F('hallmark','نشان/شماره تصدیق')],
 mobile:[F('brand','برند'),F('model','مدل موبایل'),F('imei','IMEI (۱۵ رقم)'),F('serial','سریال دستگاه/لوازم'),S('condition','وضعیت',['نو','دست دوم','ترمیم‌شده']),D('warranty','پایان ضمانت'),F('memory','حافظه/رنگ')],
 wholesale:[F('orderNo','شماره سفارش'),S('unit','واحد عمده',['کارتن','بسته','کیسه','عدد','کیلوگرام']),N('minOrder','حداقل سفارش'),N('unitsPerCarton','تعداد در کارتن'),F('tier','نوع قیمت عمده'),D('delivery','زمان تحویل')],
 distribution:[F('route','مسیر توزیع'),F('agent','نماینده/راننده'),F('orderRef','شماره سفارش'),D('delivery','تاریخ تحویل'),S('deliveryStatus','وضعیت',['آماده‌سازی','در مسیر','تحویل شد','برگشت خورد'])],
 clothing:[F('model','کود مدل'),F('color','رنگ'),S('size','سایز',['XS','S','M','L','XL','XXL','3XL','سفارشی']),F('fabric','نوع پارچه'),F('brand','برند')],
 footwear:[F('model','مدل کفش'),F('brand','برند'),F('size','سایز'),F('color','رنگ'),F('material','جنس'),F('sport','نوع استفاده')],
 bookstore:[F('isbn','ISBN'),F('title','نام کتاب'),F('author','نویسنده'),F('publisher','ناشر'),F('edition','چاپ/نسخه'),F('language','زبان کتاب')],
 cosmetics:[F('brand','برند'),F('batch','شماره بچ'),D('expiry','تاریخ انقضا'),F('volume','حجم/اندازه بسته'),S('storage','شرایط نگهداری',['عادی','دور از نور','خنک'])],
 electronics:[F('brand','برند'),F('model','مدل'),F('serial','شماره سریال'),D('warranty','پایان ضمانت'),S('condition','وضعیت',['نو','استوک','تعمیرشده']),F('supplier','عرضه‌کننده')],
 furniture:[F('model','مدل مبلمان'),F('dimensions','ابعاد'),F('color','رنگ/پارچه'),F('orderRef','شماره سفارش'),D('delivery','تاریخ تحویل'),S('orderStatus','مرحله سفارش',['در سفارش','در ساخت','آماده تحویل','تحویل شد'])],
 hardware:[F('sku','کود ابزار'),F('brand','برند'),S('unit','واحد',['عدد','متر','کیلوگرام','بسته','لیتر']),D('warranty','ضمانت'),F('package','نوع بسته')],
 construction:[F('project','نام پروژه'),S('unit','واحد مصالح',['کیسه','متر','مترمربع','مترمکعب','کیلوگرام','تن']),F('siteCode','کود محل'),D('delivery','تاریخ تحویل'),N('transportFee','هزینه حمل (فقط معلومات)')],
 exchange:[F('ticket','شماره رسید صرافی'),S('direction','نوع معامله',['خرید ارز','فروش ارز','حواله']),F('sourceCurrency','ارز پرداختی (ISO)'),F('targetCurrency','ارز دریافتی (ISO)'),N('sourceAmount','مقدار پرداختی'),N('rate','نرخ تبدیل به ارز مقصد'),N('fee','کارمزد در ارز مقصد'),F('clientRef','کود طرف معامله بدون اطلاعات حساس'),F('remittance','شماره حواله'),D('settlement','تاریخ تسویه')],
 contractor:[F('project','نام پروژه ساختمانی'),F('contract','شماره قرارداد'),F('site','محل پروژه'),S('unit','واحد کار',['متر','مترمربع','مترمکعب','تن','مرحله','روز','ساعت']),N('quantity','مقدار اجراشده'),N('unitPrice','نرخ هر واحد'),N('advance','پیش‌پرداخت'),N('expenses','مصارف پروژه'),D('due','موعد تحویل'),S('stage','مرحله',['طرح','قرارداد','در اجرا','تحویل موقت','تحویل نهایی'])],
 services:[F('service','نوع خدمت'),F('jobNo','شماره کار'),F('assignee','مسئول خدمت'),D('due','موعد تکمیل'),N('hours','ساعت کار (معلومات)'),F('completionRef','شماره سند تکمیل')],
 company:[F('contract','شماره قرارداد'),F('costCenter','مرکز هزینه'),F('department','بخش مسئول'),F('reference','شماره مرجع'),D('due','تاریخ تسویه')]
};
const schemaKeys=Object.keys(schema);
const typeOf=t=>Object.hasOwn(schema,String(t))?String(t):'general';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textNum=v=>String(v).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[,٬]/g,'').replace('٫','.').trim();
const fields=t=>schema[typeOf(t)];
function normalize(t,data={},other={}){
 const type=typeOf(t),v={},provided=data&&typeof data==='object'?data:{};
 for(const f of fields(type)){
  let value=String(provided[f.key]??'').trim();if(!value)continue;
  if(f.kind==='number'){
   const n=Number(textNum(value));if(!Number.isFinite(n)||n<0||n>1e11)throw Error(f.label+' باید عدد معتبر و غیرمنفی باشد.');value=String(n);
  }else if(f.kind==='date'){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('تاریخ '+f.label+' نامعتبر است.');
  }else if(f.kind==='select'){if(!f.options.includes(value))throw Error('انتخاب '+f.label+' نامعتبر است.');}
  else if(value.length>140)throw Error(f.label+' طولانی است.');
  v[f.key]=value;
 }
 if(type==='gold'&&v.grossGrams){const gross=Number(v.grossGrams),stone=Number(v.stoneGrams||0),waste=Number(v.wasteGrams||0);if(!gross||stone+waste>=gross)throw Error('در زرگری، وزن سنگ و ضایعات باید کمتر از وزن ناخالص باشند.');}
 if(type==='exchange'){if(v.sourceCurrency&&!/^[A-Z]{3}$/.test(v.sourceCurrency.toUpperCase()))throw Error('کد ارز پرداختی سه حرف انگلیسی باشد.');if(v.targetCurrency&&!/^[A-Z]{3}$/.test(v.targetCurrency.toUpperCase()))throw Error('کد ارز دریافتی سه حرف انگلیسی باشد.');if(v.sourceCurrency&&v.targetCurrency&&v.sourceCurrency.toUpperCase()===v.targetCurrency.toUpperCase())throw Error('دو ارز متفاوت انتخاب کنید.');if(v.rate!==undefined&&Number(v.rate)<=0)throw Error('نرخ تبدیل باید مثبت باشد.');if(v.sourceAmount!==undefined&&Number(v.sourceAmount)<=0)throw Error('مبلغ ارز پرداختی باید مثبت باشد.');if(v.sourceAmount!==undefined&&v.rate!==undefined&&Number(v.fee||0)>Number(v.sourceAmount)*Number(v.rate))throw Error('کارمزد بیشتر از مبلغ تبدیل است.');}
 if(type==='contractor'&&v.quantity!==undefined&&v.unitPrice!==undefined&&v.advance!==undefined&&Number(v.advance)>Number(v.quantity)*Number(v.unitPrice))v.advanceRequiresReview='true';
 if(type==='mobile'&&v.imei&&!/^\d{15}$/.test(textNum(v.imei)))throw Error('IMEI در موبایل باید دقیقاً ۱۵ رقم باشد. برای لوازم جانبی از سریال استفاده کنید.');
 return {type,values:v};
}
function render(type,previous=null,{expanded=false,forOrder=false}={}){
 const t=typeOf(type),data=previous?.type===t?previous.values||{}:{},fs=fields(t);
 if(!fs.length)return '';
 let body=fs.map(f=>{
 const v=String(data[f.key]??'');let control;
 if(f.kind==='select')control=`<select data-z629-key="${escape(f.key)}"><option value="">انتخاب کنید</option>${f.options.map(o=>`<option value="${escape(o)}" ${v===o?'selected':''}>${escape(o)}</option>`).join('')}</select>`;
 else control=`<input data-z629-key="${escape(f.key)}" type="${f.kind==='number'?'number':f.kind==='date'?'date':'text'}" ${f.kind==='number'?'min="0" step="any"':''} ${['sourceCurrency','targetCurrency'].includes(f.key)?'list="z6530Currencies"':''} maxlength="140" value="${escape(v)}" placeholder="${['sourceCurrency','targetCurrency'].includes(f.key)?'USD / AFN':'اختیاری'}">`;
 return `<label class="z629-field"><span>${escape(f.label)}</span>${control}</label>`;
 }).join('');
 const note=t==='gold'?'وزن، عیار و اجرت برای این سند نگهداری می‌شوند؛ مبلغ فاکتور را پس از بررسی خودتان وارد کنید.':t==='mobile'?'برای موبایل IMEI و برای لوازم جانبی سریال یا مدل را وارد کنید.':t==='exchange'?'نرخ و کارمزد را دقیق بررسی کنید. این مشخصات پیش‌نمایش‌اند و به‌تنهایی پول را بین صندوق‌های ارزی منتقل نمی‌کنند.':t==='contractor'?'متره، مرحله قرارداد و پیش‌پرداخت را با رسید واقعی تطبیق دهید. این فورم به‌تنهایی صندوق را تغییر نمی‌دهد.':'مشخصات مرتبط در همین محصول یا ردیف فاکتور محفوظ می‌مانند.';
 return `<details class="z629-industry" data-z629-type="${t}" ${expanded?'open':''}><summary>✦ مشخصات مخصوص ${escape(label(t))} <small>${forOrder?'در این ردیف':'در گدام'}</small></summary><div class="z629-fields">${body}</div>${t==='exchange'?'<datalist id="z6530Currencies"><option value="AFN"><option value="USD"><option value="EUR"><option value="PKR"><option value="GBP"><option value="AED"><option value="SAR"><option value="CNY"><option value="IRR"><option value="INR"></datalist>':''}<p class="z629-hint">${escape(note)}</p></details>`;
}
const labels={general:'تجارت عمومی',supermarket:'سوپرمارکت',pharmacy:'دواخانه',laboratory:'لابراتوار',gold:'زرگری',mobile:'موبایل',wholesale:'عمده‌فروشی',distribution:'توزیع',clothing:'پوشاک',footwear:'کفش',bookstore:'کتاب‌فروشی',cosmetics:'آرایشی',electronics:'وسایل برقی',furniture:'مبلمان',hardware:'ابزارفروشی', construction:'مصالح ساختمانی',exchange:'صرافی و تبدیل ارز',contractor:'شرکت ساختمانی و پروژه‌ها',services:'خدمات',company:'شرکت تجارتی'};
function label(t){return labels[typeOf(t)]}
function collect(container,type){if(!container)return normalize(type,{});const values={};for(const el of container.querySelectorAll('[data-z629-key]'))values[el.dataset.z629Key]=el.value;return normalize(type,values)}
function fill(container,type,details){if(!container)return;const saved=details?.type===type?details.values||{}:{};for(const el of container.querySelectorAll('[data-z629-key]'))el.value=String(saved[el.dataset.z629Key]??'')}
function display(details,limit=8){const t=typeOf(details?.type),val=details?.values||{};return fields(t).filter(f=>val[f.key]!==undefined&&String(val[f.key]).trim()!=='').slice(0,limit).map(f=>[f.label,String(val[f.key])]);}
return Object.freeze({schema,types:schemaKeys,fields,normalize,render,collect,fill,display,label,typeOf});
});
