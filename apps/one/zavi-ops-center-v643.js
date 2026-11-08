/* ZAVI ONE V64.3 — safe business workflows / readiness checks.
 * Read-only, tenant-local information. No accounts, permissions, sales or stock mutation.
 * A workflow recommendation never claims an unavailable specialist module is operational.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviOpsCenter643=api;})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){'use strict';
 const base=[{id:'products',title:'محصولات و گدام',description:'ثبت جنس، بارکد، قیمت و موجودی'},{id:'sales',title:'فروش و فاکتور',description:'ثبت فروش نقدی یا قرضه'},{id:'purchases',title:'خرید و تأمین',description:'ثبت خرید و بررسی بهای اجناس'},{id:'reports',title:'راپورهای حسابداری',description:'بازبینی ارقام ثبت‌شده'}];
 const groups={
  supermarket:{label:'سوپرمارکیت',steps:['products','sales','purchases','reports'],focus:'فروش سریع و کنترل گدام؛ برای تاریخ انقضا ابتدا معلومات بچ را ثبت کنید.'},
  pharmacy:{label:'دواخانه',steps:['products','purchases','sales','reports'],focus:'تاریخ انقضا و بچ را در مدیریت عمومی بررسی کنید؛ FEFO و کنترول نسخه طبی هنوز کامل نیست.'},
  laboratory:{label:'لابراتوار',steps:['settings','contacts','reports'],focus:'ثبت خدمات و حسابات عمومی موجود است؛ ثبت و تأیید نتایج طبی هنوز آماده استفاده نیست.'},
  gold:{label:'زرگری',steps:['products','sales','reports'],focus:'وزن، عیار و اجرت نیاز به ماژول حسابرسی‌شده دارند؛ قیمت طلا را تخمین نزنید.'},
  mobile:{label:'موبایل',steps:['products','sales','repairs','reports'],focus:'کود/مدل، ضمانت و تعمیرات را تنظیم کنید؛ رهگیری IMEI هنوز کامل نیست.'},
  wholesale:{label:'عمده‌فروشی',steps:['purchases','products','sales','debtors'],focus:'خرید، نرخ‌های فروش و مانده حساب مشتریان را بررسی کنید.'},
  distribution:{label:'توزیع',steps:['purchases','products','sales','debtors'],focus:'معاملات توزیع و قرضداری را کنترل کنید؛ انتقال بین چند انبار مستقل هنوز کامل نیست.'},
  clothing:{label:'پوشاک',steps:['products','sales','reports'],focus:'برای سایز و رنگ فعلاً مدل‌های مجزا ثبت کنید؛ تنوع کالای ساختاریافته در دست توسعه است.'},
  footwear:{label:'کفش',steps:['products','sales','reports'],focus:'سایز و رنگ را واضح در مشخصات هر محصول بنویسید.'},
  bookstore:{label:'کتاب‌فروشی',steps:['products','sales','reports'],focus:'ISBN را در بارکد محصول ثبت کنید؛ نویسنده و ناشر هنوز فیلد تخصصی ندارند.'},
  cosmetics:{label:'آرایشی و بهداشتی',steps:['products','purchases','sales'],focus:'بچ و انقضا را بررسی کنید و اجناس منقضی را جدا نگه دارید.'},
  electronics:{label:'الکترونیک',steps:['products','sales','repairs'],focus:'کود محصول و اسناد ضمانت را نگهداری کنید؛ سریال‌گذاری واحدبه‌واحد هنوز کامل نیست.'},
  furniture:{label:'مبلمان',steps:['products','sales','debtors'],focus:'اندازه و مدل را در شرح محصول مشخص کنید؛ مدیریت تحویل تخصصی هنوز کامل نیست.'},
  hardware:{label:'ابزار و لوازم ساختمانی',steps:['products','purchases','sales'],focus:'واحد اندازه‌گیری را هنگام قیمت‌گذاری ثابت نگه دارید.'},
  construction:{label:'فروش مصالح ساختمانی',steps:['products','purchases','sales'],focus:'این پروفایل مربوط فروش مصالح است، نه ZAVI CONSTRUCTION مستقل.'},
  exchange:{label:'صرافی',steps:['money','hawala','reports','contacts'],focus:'نرخ، مقدار، کارمزد و رسید را ثبت کنید؛ این فرم به‌تنهایی دفتر چندارزی و الزامات قانونی صرافی را اجرا نمی‌کند.'},
  contractor:{label:'پیمانکاری ساختمانی',steps:['sales','expenses','purchases','reports'],focus:'قرارداد، متره، پیش‌پرداخت و صورت‌وضعیت را جدا ثبت کنید و هر پرداخت را با سند واقعی تطبیق دهید.'},
  services:{label:'خدمات',steps:['contacts','sales','expenses','reports'],focus:'ثبت خدمات و مصارف را در اولویت قرار دهید.'},
  company:{label:'شرکت',steps:['purchases','sales','journal','reports'],focus:'صحت حساب‌ها، سندها و گزارش‌ها را پیش از بسته‌شدن دوره بررسی کنید.'},
  general:{label:'تجارت عمومی',steps:['products','sales','purchases','reports'],focus:'از ثبت محصول و یک فاکتور آزمایشی شروع کنید.'}
 };
 const safeType=type=>Object.prototype.hasOwnProperty.call(groups,String(type))?String(type):'general';
 const navNames={dashboard:'داشبورد',products:'گدام',sales:'فروش',purchases:'خرید',contacts:'مشتریان',debtors:'قرضداران',expenses:'مصارف',reports:'راپورها',journal:'دفتر رویدادها',repairs:'تعمیرات',settings:'تنظیمات'};
 function plan(type,enabled){const item=groups[safeType(type)];const isOn=typeof enabled==='function'?enabled:()=>true;return Object.freeze({type:safeType(type),label:item.label,focus:item.focus,steps:item.steps.map(id=>({id,label:navNames[id]||id,available:!!isOn(id)})),preservesCore:true,altersFinancialData:false});}
 function readiness(state){const s=state&&typeof state==='object'?state:{};
  const checks=[
   {id:'storage',ok:s.storageOk===true,severity:'critical',label:'ذخیره محلی در دسترس است'},
   {id:'snapshot',ok:s.snapshotValid===true,severity:'critical',label:'ساختار معلومات حسابداری قابل بررسی است'},
   {id:'duplicates',ok:Number.isInteger(s.criticalFindings)&&s.criticalFindings===0,severity:'high',label:'شناسه‌های تکراری بحرانی شناسایی نشده‌اند'},
   {id:'license',ok:s.entitlementVerified===true,severity:'high',label:'مجوز اشتراک آنلاین تأیید شده است',optional:true},
   {id:'cloud',ok:s.cloudSynced===true,severity:'high',label:'آخرین همگام‌سازی ابری تأیید شده است',optional:true},
   {id:'backup',ok:s.restoreTested===true,severity:'critical',label:'بک‌آپ واقعی در محیط مستقل بازیابی و آزموده شده است',optional:true}
  ];
  const blockers=checks.filter(c=>!c.ok&&!c.optional).map(c=>c.id);
  return {checks,blockers,localCheckOk:!blockers.length,productionReady:checks.every(c=>c.ok),note:'موفقیت بررسی محلی به معنی آماده‌بودن برای انتشار عمومی نیست.'};
 }
 return Object.freeze({types:Object.freeze(Object.keys(groups)),plan,readiness});
});
