/* ZAVI ONE 65.26 — specialized workspaces for all 18 business types.
   Pure, offline-capable advisory calculations and structured data validation.
   It NEVER edits invoices, stock, money, subscription status or roles.
*/
(function(root,factory){'use strict';
 const kit=factory(typeof module==='object'&&module.exports?require('./zavi-industry-kit-v6525.js'):root?.ZaviIndustryKit6525);
 if(typeof module==='object'&&module.exports)module.exports=kit;
 if(root&&kit)root.ZaviIndustryKit6525=kit;
})(typeof window!=='undefined'?window:globalThis,function(base){'use strict';
 if(!base)throw Error('ZAVI industry base kit missing');
 const F=(key,label,required=false)=>({key,label,kind:'text',options:[],required});
 const f=F;
 const N=(key,label,required=false)=>({key,label,kind:'number',options:[],required});
 const D=(key,label)=>({key,label,kind:'date',options:[],required:false});
 const S=(key,label,choices)=>({key,label,kind:'select',options:choices,required:false});
 const states=['در انتظار','در حال انجام','آماده','تحویل‌شده','تکمیل‌شده','لغوشده'];
 const work={
 general:{fields:[N('expectedTotal','مبلغ پیشنهادی'),N('advancePaid','پیش‌پرداخت'),S('stage','مرحله سند',states)],checks:['شماره سند و طرف حساب بررسی شود','هر دریافت و پرداخت در حساب واقعی ثبت گردد','مانده‌های قرض با صندوق مطابقت داده شوند'],kind:'amount'},
 supermarket:{fields:[f('supplierRef','شناسه تأمین‌کننده'),N('stockQty','تعداد موجود در این بچ'),N('purchaseCost','بهای خرید هر واحد'),N('sellPrice','قیمت فروش هر واحد'),D('received','تاریخ دریافت'),S('storage','نوع نگهداری',['عادی','یخچالی','منجمد'])],checks:['تاریخ مصرف و بسته‌بندی پیش از فروش بررسی شود','کالاهای کم‌موجود و نزدیک انقضا جدا شوند','فروش بارکدی با صندوق روز تطبیق داده شود'],kind:'inventory'},
 pharmacy:{fields:[N('stockQty','تعداد موجود بچ'),N('unitCost','هزینه هر واحد'),N('unitPrice','قیمت فروش هر واحد'),D('received','تاریخ دریافت بچ'),S('regulated','رده کنترل داخلی',['عمومی','نیازمند نسخه','دارای کنترل ویژه']),f('returnRef','مرجع برگشت/قرنطین')],checks:['داروی منقضی یا مشکوک به انقضا برای فروش انتخاب نشود','ردیابی بچ و عرضه‌کننده محفوظ بماند','داروهای دارای کنترل ویژه با روش قانونی محل مدیریت شوند'],kind:'expiry'},
 laboratory:{fields:[N('unitPrice','تعرفه هر خدمت'),N('servicesCount','تعداد خدمت'),N('materialCost','هزینه مواد'),S('stage','مرحله انجام',['ثبت','در حال انجام','تکمیل‌شده','تحویل‌شده']),f('staffCode','شناسه مسئول غیرشخصی')],checks:['فقط اطلاعات مالی و کد غیرشخصی نگهداری شود','نتیجه طبی و هویت مریض در این فورم ذخیره نشود','مواد، تعرفه و وضعیت تکمیل خدمت بررسی گردد'],kind:'service'},
 gold:{fields:[S('entryMode','نوع گردش',['فروش زیور','خرید طلای کهنه','امانت طلا','برگشت','تبدیل عیار']),N('quantityPieces','تعداد قطعه'),f('lotRef','کود بسته/سند طلا'),f('custodyRef','مرجع امانت بدون اطلاعات حساس'),N('paidAmount','مبلغ نقد دریافت‌شده')],checks:['وزن خالص، عیار و سنگ پیش از قیمت‌گذاری دوباره توزین شود','طلای امانتی و طلای ملکی جدا نگهداری شوند','برای خرید طلای کهنه رسید و ارزیابی جدا ثبت گردد','فاکتور رسمی و سند وزن جای این محاسبه را می‌گیرد'],kind:'gold'},
 mobile:{fields:[N('purchaseCost','قیمت خرید'),N('sellPrice','قیمت فروش'),D('soldOn','تاریخ فروش'),f('repairTicket','شماره تعمیرات'),S('warrantyStatus','وضعیت ضمانت',['فعال','تمام‌شده','ندارد'])],checks:['IMEI/سریال تکراری بررسی شود','ضمانت و شرایط فروش روی فاکتور درج شود','تعمیرات با سند جدا پیگیری گردد'],kind:'margin'},
 wholesale:{fields:[N('purchasePrice','قیمت خرید هر واحد'),N('quantity','مقدار سفارش'),N('discountPercent','تخفیف عمده درصد'),D('delivery','موعد تحویل'),S('stage','مرحله سفارش',states)],checks:['حداقل سفارش و تعداد هر کارتن بررسی شود','قیمت عمده و تخفیف قبل از فاکتور تأیید گردد','مانده مشتری عمده بعد از تحویل کنترل شود'],kind:'wholesale'},
 distribution:{fields:[N('orderedQty','تعداد سفارش'),N('deliveredQty','تعداد تحویل‌شده'),N('returnedQty','تعداد برگشتی'),N('unitPrice','قیمت واحد'),N('deliveryCost','هزینه توزیع'),f('receiverRef','کود تحویل‌گیرنده')],checks:['تعداد سفارش، تحویل و برگشتی با هم تطبیق شوند','رسید تحویل بدون تأیید مشتری قطعی نشود','وصول مبلغ و هزینه مسیر جدا ثبت شوند'],kind:'delivery'},
 clothing:{fields:[f('sku','کود هر ترکیب رنگ/سایز'),N('stockQty','موجودی این سایز و رنگ'),N('reorder','حداقل موجودی تنوع'),N('purchaseCost','قیمت خرید'),N('sellPrice','قیمت فروش'),S('returnCondition','وضعیت برگشتی',['سالم','معیوب','غیرقابل فروش'])],checks:['هر سایز و رنگ با کود جدا ثبت شود','برگشت معیوب به گدام قابل فروش اضافه نشود','قیمت و تخفیف با فاکتور تطبیق گردد'],kind:'inventory'},
 footwear:{fields:[f('sku','کود ترکیب مدل/سایز'),N('stockQty','تعداد جفت موجود'),N('reorder','حداقل موجودی'),N('purchaseCost','قیمت خرید هر جفت'),N('sellPrice','قیمت فروش هر جفت'),S('returnCondition','برگشت',['سالم','معیوب','استفاده‌شده'])],checks:['سایز، جفت و رنگ در فاکتور دقیق باشد','کالای برگشتی پیش از ورود به گدام بررسی شود','سفارش مجدد سایزهای پرتقاضا بررسی گردد'],kind:'inventory'},
 bookstore:{fields:[f('subject','موضوع کتاب'),f('language','زبان کتاب'),N('stockQty','تعداد موجود'),N('reorder','حداقل موجودی'),N('purchaseCost','قیمت خرید'),N('sellPrice','قیمت فروش')],checks:['شماره ISBN و چاپ را دقیق ثبت کنید','نسخه‌های مختلف یک کتاب جدا باشند','موجودی کتاب‌های درسی و موسمی را کنترل کنید'],kind:'inventory'},
 cosmetics:{fields:[N('stockQty','تعداد موجود بچ'),N('purchaseCost','هزینه واحد'),N('sellPrice','قیمت فروش'),S('storage','شرایط نگهداری',['عادی','دور از نور','دمای پایین']),f('supplier','مرجع تأمین‌کننده')],checks:['بچ و تاریخ مصرف قبل از فروش بررسی شود','کالاهای بازشده و برگشتی به فروش بازنگردند','هشدار انقضا و اصالت کالا جدی گرفته شود'],kind:'expiry'},
 electronics:{fields:[N('purchaseCost','قیمت خرید'),N('sellPrice','قیمت فروش'),f('invoiceRef','سند واردات/خرید'),S('serviceStatus','وضعیت خدمات',['سالم','تعمیر','برگشت']),D('soldOn','تاریخ فروش')],checks:['سریال هر واحد با فاکتور هماهنگ باشد','ضمانت و تاریخ شروع آن ثبت شود','تعمیر و تعویض با سند مستقل انجام شود'],kind:'margin'},
 furniture:{fields:[N('orderTotal','مبلغ سفارش'),N('advancePaid','پیش‌پرداخت'),N('shippingCost','هزینه حمل'),f('orderRef','شماره سفارش ساخت'),S('deliveryStatus','مرحله تحویل',states)],checks:['ابعاد نهایی با سفارش مشتری مطابقت داده شود','پیش‌پرداخت فقط با رسید مالی ثبت شود','تحویل همراه با تأیید مشتری باشد'],kind:'amount'},
 hardware:{fields:[N('stockQty','موجودی فعلی'),N('purchaseCost','بهای خرید هر واحد'),N('sellPrice','قیمت فروش هر واحد'),D('warranty','پایان ضمانت'),S('package','نوع بسته',['تکی','بسته','کارتن'])],checks:['واحد متر، عدد و کیلوگرام اشتباه نشود','حداقل موجودی و کالاهای پرفروش کنترل شوند','ضمانت ابزار با سند فروش تطبیق داده شود'],kind:'inventory'},
 construction:{fields:[N('unitPrice','نرخ واحد مصالح'),N('deliveryQty','مقدار تحویل‌شده'),N('transportFee','هزینه حمل'),N('advancePaid','پیش‌پرداخت'),f('siteCode','کود محل پروژه')],checks:['مقدار و واحد مصالح با حواله سنجیده شود','تحویل پروژه و هزینه حمل جدا کنترل شود','پیش‌پرداخت در حساب مشتری ثبت شود'],kind:'construction'},
 exchange:{fields:[S('settlementStatus','وضعیت تسویه',['در انتظار','تسویه شد','برگشت خورد']),f('operatorRef','کود مسئول صندوق'),f('voucher','کود سند تبادل')],checks:['مبلغ هر ارز را در صندوق همان ارز جدا ثبت و تطبیق کنید','نرخ معامله، کارمزد و ارزهای مبدأ و مقصد در رسید چاپ شود','تا زمان پیاده‌سازی دفتر چندارزی، محاسبه صرفاً پیش‌نمایش است','مقررات احراز هویت، مبارزه با پول‌شویی و مجوز صرافی را مطابق محل اجرا بررسی کنید'],kind:'exchange'},
 contractor:{fields:[N('contractTotal','ارزش کل قرارداد'),N('progressPercent','درصد پیشرفت کار'),f('engineerRef','مرجع مهندس/ناظر'),f('estimateRef','شماره صورت‌وضعیت'),N('retention','مبلغ تضمین حسن اجرا')],checks:['متره واقعی و صورت‌وضعیت با تأیید ناظر مقایسه شود','پیش‌پرداخت و هزینه‌های پروژه از رسیدهای مالی بررسی شوند','مبالغ کسورات، مالیات و تضمین بدون سند قطعی نشوند','موجودی مصالح و گزارش پروژه مستقل ثبت گردد'],kind:'contractor'},
 services:{fields:[N('hours','ساعت کار'),N('hourlyRate','دستمزد هر ساعت'),N('materialsCost','هزینه مواد'),N('advancePaid','پیش‌پرداخت'),f('completionRef','شماره سند تکمیل')],checks:['تأیید انجام خدمت از مشتری گرفته شود','هزینه مواد و دستمزد جدا نمایش داده شود','وصول نهایی فقط با رسید ثبت شود'],kind:'service'},
 company:{fields:[N('contractTotal','ارزش قرارداد'),N('advancePaid','پیش‌پرداخت'),N('expenseBudget','بودجه مصارف'),N('expenseActual','مصارف ثبت‌شده در گزارش'),S('contractStatus','مرحله قرارداد',states)],checks:['قرارداد و مرکز هزینه مشخص باشد','مبلغ قرارداد با سند پرداخت تطبیق شود','مصارف گزارش‌شده با سندهای واقعی حسابداری کنترل شود'],kind:'amount'}
 };
 const types=base.types;
 if(types.length!==20||types.some(t=>!work[t]))throw Error('Industry registry incomplete');
 const round=(x,d=2)=>Math.round((x+Number.EPSILON)*10**d)/10**d;
 const num=x=>{const s=String(x??'').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/,/g,'').replace(/،/g,'.');if(!s)return 0;if(!/^\d+(?:\.\d+)?$/.test(s))throw Error('عدد مثبت معتبر وارد کنید.');const n=Number(s);if(!Number.isFinite(n)||n>1e12)throw Error('مبلغ/مقدار از حد مجاز بیشتر است.');return n};
 const v=(o,key)=>num(o?.[key]);
 const day=x=>{if(!x)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(x))throw Error('تاریخ را به صورت YYYY-MM-DD وارد کنید.');const dt=new Date(x+'T00:00:00Z');if(Number.isNaN(dt.getTime())||dt.toISOString().slice(0,10)!==x)throw Error('تاریخ تقویمی نامعتبر است.');return dt;};
 function compute(type,values={},date=new Date()){
  const t=base.safeType(type),cfg=work[t],warnings=[],metrics=[];
  const push=(label,value,unit='')=>{if(Number.isFinite(value))metrics.push({label,value:round(value,4),unit})};
  const now=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate());
  const exp=values.expiry&&day(values.expiry);
  if(exp){const left=Math.round((exp.getTime()-now)/86400000);if(left<0)warnings.push('⛔ تاریخ انقضا گذشته است؛ این کالا را برای فروش استفاده نکنید.');else if(left<=30)warnings.push('⚠️ کمتر از ۳۰ روز تا انقضا باقی است.');push('روز تا انقضا',left,'روز')}
  if(values.warranty){const w=day(values.warranty);const remaining=Math.round((w.getTime()-now)/86400000);if(remaining<0)warnings.push('⚠️ تاریخ ضمانت گذشته است.');}
  for(const key of ['due','delivery']){if(values[key]&&['general','wholesale','furniture','services','company','distribution','construction'].includes(t)){const dt=day(values[key]);const left=Math.round((dt.getTime()-now)/86400000);if(left<0)warnings.push('⏰ موعد '+key+' گذشته است؛ وضعیت کار را بررسی کنید.')}}
  if(cfg.kind==='gold'){
    const ready=values.grossGrams!==undefined&&values.rate24!==undefined;
    if(ready){const g=base.goldEstimate(values);push('وزن خالص',g.netGrams,'گرام');push('طلای معادل ۲۴ عیار',g.pureGrams,'گرام');push('برآورد مبلغ',g.estimate,'ارز فروشگاه');if(v(values,'paidAmount')>g.estimate)warnings.push('⚠️ مبلغ دریافتی بیش از برآورد است؛ سند را بررسی کنید.');}
  }else if(cfg.kind==='inventory'||cfg.kind==='expiry'){
    const qty=v(values,'stockQty'),reorder=v(values,'reorder')||v(values,'minimum');const buy=v(values,'purchaseCost')||v(values,'unitCost'),sell=v(values,'sellPrice')||v(values,'unitPrice');
    if(reorder&&qty<=reorder)warnings.push('⚠️ موجودی به حد سفارش مجدد رسیده است.');
    if(qty||buy||sell){push('ارزش خرید این مقدار',qty*buy,'ارز فروشگاه');if(sell)push('ارزش فروش احتمالی',qty*sell,'ارز فروشگاه');if(buy&&sell)push('سود ناخالص واحد (تخمینی)',sell-buy,'ارز فروشگاه');}
    if(buy&&sell&&sell<buy)warnings.push('⚠️ قیمت فروش از بهای خرید کمتر است.');
  }else if(cfg.kind==='margin'){
    const buy=v(values,'purchaseCost'),sell=v(values,'sellPrice');if(buy||sell){push('تفاوت فروش و خرید',sell-buy,'ارز فروشگاه');if(buy&&sell<buy)warnings.push('⚠️ فروش احتمالی با ضرر است.');}
  }else if(cfg.kind==='wholesale'){
    const qty=v(values,'quantity'),minimum=v(values,'minOrder'),discount=v(values,'discountPercent');if(discount>100)throw Error('درصد تخفیف نباید بیشتر از ۱۰۰ باشد.');
    if(qty&&minimum&&qty<minimum)warnings.push('⚠️ مقدار سفارش از حداقل سفارش کمتر است.');
    const price=v(values,'bulkPrice');if(qty&&price){const gross=qty*price,net=gross*(1-discount/100);push('جمع عمده قبل تخفیف',gross,'ارز فروشگاه');push('جمع پس از تخفیف',net,'ارز فروشگاه');if(v(values,'purchasePrice')>price)warnings.push('⚠️ قیمت عمده کمتر از قیمت خرید است.');}
  }else if(cfg.kind==='delivery'){
    const ordered=v(values,'orderedQty'),delivered=v(values,'deliveredQty'),returned=v(values,'returnedQty');
    if((ordered||delivered||returned)&&delivered+returned>ordered)throw Error('تحویل و برگشتی بیش از مقدار سفارش نمی‌شود.');
    if(ordered||delivered){push('مقدار هنوز تحویل‌نشده',ordered-delivered-returned,'واحد');push('ارزش تحویل‌شده',delivered*v(values,'unitPrice'),'ارز فروشگاه');}
  }else if(cfg.kind==='construction'){
    const qty=v(values,'quantity'),delivered=v(values,'deliveryQty');if(qty&&delivered>qty)throw Error('تحویل بیشتر از مقدار سفارش است.');
    if(qty){push('مقدار باقی',qty-delivered,'واحد');push('ارزش سفارش با حمل',qty*v(values,'unitPrice')+v(values,'transportFee'),'ارز فروشگاه');}
  }else if(cfg.kind==='exchange'){
    const amount=v(values,'sourceAmount'),rate=v(values,'rate'),fee=v(values,'fee');
    if(amount&&rate){const total=round(amount*rate);if(fee>total)throw Error('کارمزد از مبلغ تبدیل بیشتر شده است.');push('ارز دریافتی قبل از کارمزد',total,values.targetCurrency||'واحد مقصد');push('ارز دریافتی پس از کارمزد',total-fee,values.targetCurrency||'واحد مقصد');}
    warnings.push('محاسبه ارزی فقط پیش‌نمایش است؛ صندوق ارزی بدون سند مالی جدا تغییر نمی‌کند.');
  }else if(cfg.kind==='contractor'){
    const qty=v(values,'quantity'),price=v(values,'unitPrice'),advance=v(values,'advance'),cost=v(values,'expenses'),retention=v(values,'retention'),progress=v(values,'progressPercent');
    if(progress>100)throw Error('پیشرفت پروژه نمی‌تواند بیش از ۱۰۰ درصد باشد.');
    const bill=qty*price;if(bill){if(advance+retention>bill)warnings.push('پیش‌پرداخت و تضمین بیش از ارزش متره فعلی است؛ پیش از تسویه بررسی کنید.');push('ارزش متره اجراشده',bill,'ارز فروشگاه');push('مانده برآورد بعد پیش‌پرداخت و تضمین',bill-advance-retention,'ارز فروشگاه');push('تفاوت ارزش متره و هزینه',bill-cost,'ارز فروشگاه');}
    if(values.due&&day(values.due).getTime()<now)warnings.push('موعد تحویل پروژه گذشته است؛ وضعیت را بررسی کنید.');
    warnings.push('این صورت‌وضعیت اولیه است؛ پرداخت قطعی فقط با سند مالی ثبت شود.');
  }else if(cfg.kind==='service'){
    const price=v(values,'hours')*v(values,'hourlyRate')+v(values,'materialsCost')+(t==='laboratory'?v(values,'servicesCount')*v(values,'unitPrice'):0);
    if(price){push('برآورد خدمت',price,'ارز فروشگاه');if(v(values,'advancePaid')>price)warnings.push('⚠️ پیش‌پرداخت از مبلغ برآورد بیشتر است.');}
  }else{
    const total=v(values,'expectedTotal')||v(values,'orderTotal')||v(values,'contractTotal');const advance=v(values,'advancePaid');
    if(total||advance){if(advance>total)throw Error('پیش‌پرداخت از مبلغ کل بیشتر است.');push('مانده برآورد',total-advance,'ارز فروشگاه');}
    if(t==='company'&&v(values,'expenseBudget')&&v(values,'expenseActual')>v(values,'expenseBudget'))warnings.push('⚠️ مصارف گزارش‌شده از بودجه بیشتر است.');
  }
  return {metrics,warnings,kind:cfg.kind};
 }
 const profiles={};
 for(const t of types){const p=base.profile(t),cfg=work[t];const seen=new Set(p.fields.map(x=>x.key));const extra=cfg.fields.filter(x=>!seen.has(x.key));profiles[t]=Object.freeze({...p,fields:Object.freeze([...p.fields,...extra]),checks:Object.freeze(cfg.checks.slice()),kind:cfg.kind,workflow:Object.freeze(['شناسه و مشخصات را ثبت کنید',...p.steps,'هشدارها را بررسی کنید؛ سند مالی را جدا ثبت کنید'])});}
 const checkDate=x=>x?day(x):null;
 function validate(type,values){const t=base.safeType(type),p=profiles[t];const out={};
   for(const field of p.fields){const raw=values?.[field.key];if(field.kind==='number'){if(field.required&&(raw===undefined||raw===null||String(raw).trim()===''))throw Error('مقدار '+field.label+' ضروری است.');out[field.key]=num(raw)}
    else if(field.kind==='date'){const value=String(raw||'').trim();checkDate(value);out[field.key]=value}
    else{const value=String(raw??'').trim();if(field.required&&!value)throw Error('مقدار '+field.label+' ضروری است.');if(value.length>150)throw Error('متن از حد مجاز بیشتر است: '+field.label);if(field.kind==='select'&&value&&!field.options.includes(value))throw Error('انتخاب نامعتبر: '+field.label);out[field.key]=value}}
   const analysis=compute(t,out);const estimate=t==='gold'?base.goldEstimate(out):null;
   return {fields:out,estimate,analysis};
 }
 function summarize(type,values){const t=base.safeType(type),p=profiles[t];if(t==='gold')return base.summarize(t,values);let primary=p.fields.filter(x=>values?.[x.key]!==undefined&&values[x.key]!=='').slice(0,3).map(x=>x.label+': '+String(values[x.key]));return p.label+' · '+primary.join(' · ')}
 function analyzeRecord(type,record,date){if(!record||record.type!==base.safeType(type))return null;try{return compute(type,record.values||{},date||new Date())}catch(e){return {metrics:[],warnings:['نیازمند بررسی مشخصات ثبت‌شده: '+e.message]}}}
 return Object.freeze({types:Object.freeze(types.slice()),profiles:Object.freeze(profiles),safeType:base.safeType,profile:t=>profiles[base.safeType(t)],goldEstimate:base.goldEstimate,validate,compute,analyzeRecord,summarize});
});
