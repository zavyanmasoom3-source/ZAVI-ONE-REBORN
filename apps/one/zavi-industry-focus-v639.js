/* ZAVI ONE V63.9 — presentation-only industry focus.
 * NEVER changes accounting records, authorization, modules or stock data.
 * Every shortcut maps to a REAL existing page/action. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ZaviIndustryFocus = api;
  if (root?.document) {
    const refresh=()=>root.zaviRefreshIndustry?.();
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',refresh,{once:true});
    else refresh();
  }
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  const P = Object.freeze({
    general: { title:'تجارت عمومی', subtitle:'حسابداری، فروش و گدام در یک محیط', primary:['sales','products','purchases','money'], tips:['پیش از ثبت فروش، موجودی محصولات را بررسی کنید.','برای حفاظت معلومات، نسخه پشتیبان منظم بگیرید.'], question:'چگونه گزارش فروش را ببینم؟' },
    supermarket:{ title:'سوپرمارکیت',subtitle:'فروش سریع و بارکد، اولویت کار روزانه', primary:['sales','products','purchases','debtors'],tips:['برای فروش سریع، بارکد کالا را در فرم فروش اسکن کنید.','اخطار حداقل موجودی در داشبورد و گدام قابل بررسی است.'],question:'چگونه بارکد محصول را ثبت کنم؟'},
    pharmacy:{title:'دواخانه',subtitle:'گدام، خرید و پیگیری بچ‌ها و انقضا',primary:['products','purchases','sales','reports'],tips:['بچ و تاریخ انقضا را در مدیریت عمومی ثبت و بررسی کنید.','امکانات نسخه و محدودیت فروش دوا هنوز نیازمند تکمیل و آزمون است.'],question:'چطور تاریخ انقضای دوا را مدیریت کنم؟'},
    laboratory:{title:'لابراتوار طبی',subtitle:'حساب خدمات و هزینه‌های مرکز',primary:['contacts','sales','expenses','reports'],tips:['بخش خدمات موجود در مدیریت عمومی برای ثبت تعرفه قابل استفاده است.','مدیریت مریض، نمونه و تأیید نتایج طبی هنوز عملیاتی نیست.'],question:'چگونه خدمات مرکز را مدیریت کنم؟'},
    gold:{title:'زرگری و طلافروشی',subtitle:'کنترول موجودی و پرداخت‌های تجارت',primary:['products','sales','purchases','money'],tips:['ارزش فلزات و وزن را تا آماده‌شدن محاسبه تخصصی جداگانه کنترل کنید.','محاسبه تخمینی وزن، عیار و اجرت در «مرکز کار زرگری» وجود دارد؛ مبلغ نهایی را با فاکتور معتبر جدا ثبت کنید.'],question:'چگونه فروش و خرید را ثبت کنم؟'},
    mobile:{title:'موبایل و لوازم جانبی',subtitle:'جست‌وجوی فوری کالا و حساب فروش',primary:['products','sales','purchases','repairs'],tips:['بارکد یا کود محصول را برای جست‌وجو در گدام استفاده کنید.','ثبت IMEI و ضمانت اختصاصی هنوز نیازمند توسعه است.'],question:'چطور با بارکد محصول پیدا کنم؟'},
    wholesale:{title:'عمده‌فروشی',subtitle:'خرید، فروش و حساب عرضه‌کنندگان',primary:['purchases','products','sales','creditors'],tips:['برای حساب عرضه‌کنندگان از بخش قرض‌های ما استفاده کنید.','قیمت‌گذاری پلکانی و شعبات مستقل هنوز کامل نیست.'],question:'چگونه بدهی به عرضه‌کننده را ببینم؟'},
    distribution:{title:'شرکت توزیع',subtitle:'فروش، گدام و دریافت‌ها',primary:['sales','products','debtors','money'],tips:['فاکتورها و دریافت‌های نمایندگان را با اسناد واقعی ثبت کنید.','مدیریت مسیر توزیع و سفارش‌های پیشرفته هنوز کامل نیست.'],question:'چطور قرض مشتری را پیگیری کنم؟'},
    clothing:{title:'فروشگاه پوشاک',subtitle:'فروش سریع، محصول و موجودی',primary:['products','sales','purchases','reports'],tips:['برای هر مدل یا سایز قابل فروش، شناسه محصول مشخص داشته باشید.','موجودی خودکار بر اساس سایز و رنگ هنوز کامل نیست.'],question:'چطور کالا را به گدام اضافه کنم؟'},
    footwear:{title:'فروشگاه کفش',subtitle:'فاکتور، محصول و گردش موجودی',primary:['products','sales','purchases','reports'],tips:['برای مدل و سایزهای متفاوت شناسه جدا داشته باشید.','ویژگی‌های پیشرفته واریانت هنوز عملیاتی نیستند.'],question:'چطور موجودی را کنترل کنم؟'},
    bookstore:{title:'کتاب‌فروشی',subtitle:'جست‌وجوی کود کتاب و فروش',primary:['products','sales','purchases','reports'],tips:['برای پیدا کردن کتاب از کد یا ISBN ثبت‌شده به‌عنوان بارکد استفاده کنید.','نمایه مستقل نویسنده و ناشر هنوز کامل نیست.'],question:'چگونه با بارکد کتاب بفروشم؟'},
    cosmetics:{title:'آرایشی و بهداشتی',subtitle:'بچ، موجودی و فروش محصولات',primary:['products','purchases','sales','reports'],tips:['بچ و انقضا را برای محصولات نیازمند آن بررسی کنید.','اخطارهای تخصصی انقضا هنوز نیاز به آزمون کامل دارند.'],question:'چطور بارکد محصول را پیدا کنم؟'},
    electronics:{title:'وسایل برقی',subtitle:'گدام، فروش و پیگیری تعمیرات',primary:['products','sales','repairs','purchases'],tips:['کد کالا و سابقه فاکتور را هنگام فروش ثبت کنید.','سریال و ضمانت اختصاصی هر دستگاه هنوز کامل نیست.'],question:'چگونه فاکتور فروش را چاپ کنم؟'},
    furniture:{title:'مبلمان و لوازم خانه',subtitle:'سفارش، خرید و فروش',primary:['products','sales','contacts','purchases'],tips:['مشخصات سفارش را با یادداشت سند ثبت کنید.','مدیریت تحویل و ساخت سفارشی هنوز تکمیل نیست.'],question:'چطور فاکتور فروش ایجاد کنم؟'},
    hardware:{title:'ابزار و لوازم ساختمانی',subtitle:'کنترول گدام و فروش واحدهای کالا',primary:['products','sales','purchases','debtors'],tips:['واحد و تعداد کالا را پیش از ذخیره سند کنترل کنید.','تبدیل واحدهای متر و وزن هنوز نیاز به اعتبارسنجی دارد.'],question:'چگونه قیمت و تعداد کالا را ثبت کنم؟'},
    construction:{title:'مصالح ساختمانی',subtitle:'فروش، گدام و حساب مشتریان',primary:['products','sales','debtors','purchases'],tips:['موجودی و قیمت هر واحد فروش را دقیق ثبت کنید.','محاسبه اختصاصی ترکیب واحدهای مواد هنوز تکمیل نشده است.'],question:'چگونه فروش قرضه را ثبت کنم؟'},
    exchange:{title:'صرافی و تبدیل ارز',subtitle:'کنترل نرخ و حواله، رسید و صندوق',primary:['money','hawala','reports','contacts'],tips:['مبالغ و نرخ تبدیل را در رسید اختصاصی ثبت کنید.','دفتر صندوق‌های مستقل چندارزی هنوز در حال تکمیل است.'],question:'چگونه معامله ارز را ثبت کنم؟'},
    contractor:{title:'شرکت ساختمانی و پیمانکاری',subtitle:'پروژه، قرارداد، صورت‌وضعیت و مصارف',primary:['sales','expenses','purchases','reports'],tips:['متره و پیشرفت کار را با قرارداد مقایسه کنید.','پرداخت‌های هر پروژه باید سند رسمی داشته باشند.'],question:'چطور صورت‌وضعیت پروژه را ثبت کنم؟'},
    services:{title:'شرکت خدماتی',subtitle:'خدمات، مصارف و حساب دریافتنی',primary:['sales','contacts','expenses','money'],tips:['تعرفه خدمات را در بخش مدیریت عمومی تنظیم کنید.','سفارش کار و پروژه‌های چندمرحله‌ای هنوز کامل نیست.'],question:'چگونه تعرفه خدمات را ثبت کنم؟'},
    company:{title:'شرکت تجارتی',subtitle:'پرداخت، دریافت و گزارش مالی',primary:['money','reports','purchases','sales'],tips:['صندوق، مصارف و دریافت‌های شرکت را با سند ثبت کنید.','دفترکل دوبل و تأیید حسابرسی هنوز کامل نیست.'],question:'چگونه گزارش مصارف را ببینم؟'}
  });
  const safeType = t => Object.prototype.hasOwnProperty.call(P,t) ? t : 'general';
  const plan = t => P[safeType(t)];
  function organize(items, type, enabled) {
    if (!Array.isArray(items)) return [];
    const src=items.map(item=>Array.isArray(item)?item.slice():item).filter(item=>Array.isArray(item)&&typeof item[0]==='string');
    if(enabled===false) return src;
    const first=['dashboard',...plan(type).primary];
    const rank=id=> {let i=first.indexOf(id);return id==='subscription'?200:id==='settings'?190:i>=0?i:40};
    return src.map((item,i)=>({item,i})).sort((a,b)=>rank(a.item[0])-rank(b.item[0])||a.i-b.i).map(x=>x.item);
  }
  function links(type, enabled) {
    const lookup={products:['products','دیدن گدام'],sales:['sales','فاکتور فروش'],purchases:['purchases','ثبت خرید'],contacts:['contacts','مشتریان'],debtors:['debtors','قرضداران'],creditors:['creditors','عرضه‌کنندگان'],reports:['reports','گزارش‌ها'],money:['money','دریافت و پرداخت'],expenses:['expenses','مصارف'],repairs:['repairs','تعمیرات']};
    return plan(type).primary.filter(id=>lookup[id]&&(!enabled||enabled(id))).map(id=>({id,title:lookup[id][1]}));
  }
  // Industry wording is only a context label for existing, operational modules.
  // It does not activate clinical, gold-pricing or other unfinished workflows.
  const MENU_LABELS=Object.freeze({
    supermarket:{sales:'فروش سریع',products:'محصولات و گدام'},
    pharmacy:{products:'دوا و گدام',purchases:'خرید دواها'},
    laboratory:{contacts:'مراجعین',products:'مواد مصرفی',sales:'فاکتور خدمات'},
    gold:{products:'اجناس زرگری',sales:'فروش اجناس'},
    mobile:{products:'موبایل و لوازم',repairs:'تعمیرات موبایل'},
    wholesale:{sales:'فروش عمده',purchases:'خرید عمده'},
    distribution:{sales:'فروش توزیعی',debtors:'حساب مشتریان'},
    clothing:{products:'پوشاک و گدام'},
    footwear:{products:'کفش و گدام'},
    bookstore:{products:'کتاب‌ها و گدام'},
    cosmetics:{products:'محصولات بهداشتی'},
    electronics:{products:'وسایل برقی',repairs:'تعمیرات'},
    furniture:{products:'مبلمان و گدام'},
    hardware:{products:'ابزار و گدام'},
    construction:{products:'مصالح و گدام'},
    exchange:{money:'صندوق صرافی',reports:'راپورهای ارزی'},
    contractor:{sales:'صورت‌وضعیت و فاکتور',expenses:'مصارف پروژه'},
    services:{sales:'فاکتور خدمات',contacts:'مشتریان خدمات'},
    company:{money:'صندوق و بانک',reports:'گزارش شرکت'}
  });
  function menuLabel(type,id,fallback){return MENU_LABELS[safeType(type)]?.[id]||fallback;}
  function questions(type){return [plan(type).question,'چطور از معلومات بک‌آپ بگیرم؟','چطور بارکد را اسکن کنم؟','برای مدیریت همکاران چه کنم؟'];}
  return Object.freeze({safeType,plan,organize,links,questions,menuLabel,types:Object.freeze(Object.keys(P))});
});
