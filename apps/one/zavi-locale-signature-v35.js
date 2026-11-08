/* Signature V35 — conservative UI text supplement for all three locales.
 * Works after core i18n modules. Does not modify user records, account names,
 * transaction content, financial values, saved settings, or browser permissions.
 * Source strings are matched exactly to known interface prompts only. */
(()=>{'use strict';
const rows=[
 ['دری','Dari','دري'],['پشتو','Pashto','پښتو'],['زبان','Language','ژبه'],
 ['ورود','Sign in','ننوتل'],['خروج','Sign out','وتل'],
 ['داشبورد','Dashboard','ډشبورډ'],['فروش','Sales','پلور'],['خرید','Purchases','پېرودونه'],
 ['محصول و گدام','Products & inventory','توکي او ګودام'],['محصولات و موجودی','Products & inventory','توکي او موجودي'],
 ['مدیریت روزمره','Daily operations','ورځني کارونه'],['مدیریت و گزارش','Management & reporting','اداره او راپورونه'],
 ['مشتریان و فروشندگان','Customers & suppliers','پېرودونکي او عرضه کوونکي'],
 ['مشتریان و عرضه کنندگان','Customers & suppliers','پېرودونکي او عرضه کوونکي'],
 ['دفترچه تماس','Contacts directory','د اړیکو نوملړ'],['دفترچه تماس مشتریان','Customer contact directory','د پېرودونکو د اړیکو نوملړ'],
 ['حساب قرضداران','Customer debts','د پېرودونکو پورونه'],['قرض‌های ما','Our payables','زموږ پورونه'],
 ['دریافت و پرداخت','Payments & receipts','ورکړې او ترلاسه کول'],['حساب حواله','Transfer accounts','د حوالو حسابونه'],
 ['مصارف','Expenses','لګښتونه'],['راپورها','Reports','راپورونه'],['روزنامچه','Daily journal','ورځپاڼه'],
 ['تعمیرات','Repairs','ترمیمونه'],['تنظیمات و پشتیبان','Settings & backup','تنظیمات او بیک اپ'],
 ['اشتراک من','My subscription','زما ګډون'],['اشتراک‌ها','Subscriptions','ګډونونه'],
 ['فاکتورهای ذخیره‌شده','Saved invoices','ساتل شوي فاکتورونه'],['فاکتورهای دستی','Manual invoices','لاسي فاکتورونه'],
 ['مشاهده فاکتور','View invoice','فاکتور وګورئ'],['ثبت فروش جدید','Record a new sale','نوی پلور ثبت کړئ'],
 ['فروش جدید','New sale','نوی پلور'],['خرید جدید','New purchase','نوی پېرود'],
 ['سود خالص','Net profit','خالصه ګټه'],['سود و زیان','Profit & loss','ګټه او زیان'],
 ['سود تخمینی خالص','Estimated net profit','اټکلي خالصه ګټه'],['فروش خالص','Net sales','خالص پلور'],
 ['موجودی حساب‌ها','Account balances','د حسابونو موجودي'],['موجودی هوشمند','Smart inventory','هوښیار موجودي'],
 ['گزارش سود و زیان','Profit and loss report','د ګټې او زیان راپور'],
 ['موجودی محصولات','Stock availability','د توکو موجودي'],
 ['همه موارد','All items','ټول موارد'],['همه تاریخ‌ها','All dates','ټولې نېټې'],
 ['روزهای باقی‌مانده','Days remaining','پاتې ورځې'],['حسابداری آفلاین','Offline accounting','آفلاین حسابداري'],
 ['فاکتور فروش','Sales invoice','د پلور فاکتور'],['فاکتور خرید','Purchase invoice','د پېرود فاکتور'],
 ['نمبر فاکتور','Invoice number','د فاکتور شمېره'],['نام کالا','Item name','د توکي نوم'],
 ['تعداد','Quantity','شمېر'],['مبلغ','Amount','اندازه'],['جمع فاکتور','Invoice total','د فاکتور ټولټال'],
 ['تخفیف','Discount','تخفیف'],['پرداخت نقدی','Cash paid','نغدي ورکړه'],['باقیداری','Balance due','پاتې پیسې'],
 ['مشخصات تجارت','Business details','د سوداګرۍ معلومات'],['مشخصات فاکتور','Invoice details','د فاکتور معلومات'],
 ['شماره تماس','Phone number','د تلیفون شمېره'],['آدرس','Address','پته'],
 ['ذخیره در سیستم','Save in app','په اپ کې خوندي کړئ'],['چاپ یا دانلود PDF','Print / Download PDF','چاپ / PDF ښکته کړئ'],
 ['ذخیره','Save','خوندي کړئ'],['انصراف','Cancel','لغوه کول'],['تأیید','Confirm','تایید'],
 ['تغییر رمز خصوصی','Change private PIN','شخصي پین بدل کړئ'],['قفل فوری برنامه','Lock app now','اپ همدا اوس قفل کړئ'],
 ['ورود به ZAVI ONE','Sign in to ZAVI ONE','ZAVI ONE ته ننوتل'],
 ['بازکردن سیستم حسابداری','Open accounting app','د حسابدارۍ اپ پرانیزئ'],
 ['رمز ورود','Access PIN','د ننوتلو پین'],['درخواست بازیابی','Request recovery','د بېرته لاسرسي غوښتنه'],
 ['حسابداری درآمد','Revenue accounting','د عوایدو حسابداري'],
 ['مشتریان و اشتراک‌ها','Customers & subscriptions','پېرودونکي او ګډونونه'],
 ['مرکز خدمات حرفه‌ای و پیگیری','Service and follow-up center','د خدمتونو او تعقیب مرکز'],
 ['سوابق تمدید','Renewal history','د تمدید تاریخچه'],['مدیریت برند','Brand management','د برانډ مدیریت'],
 ['کنترول حساب‌ها و بازیابی رمز','Account controls & PIN recovery','د حسابونو کنترول او د پین بېرته ترلاسه کول'],
 ['فهرست فروشگاه‌ها','Store directory','د پلورنځیو نوملړ'],['تمدید اشتراک','Renew subscription','ګډون تمدید کړئ'],
 ['مشتری انتخاب کنید','Select a customer','پېرودونکی وټاکئ'],
 ['مرکز پیگیری و تمدید','Follow-up and renewal center','د تعقیب او تمدید مرکز'],
 ['هفته آینده','Next week','راتلونکې اونۍ'],['نمایش همه','Show all','ټول وښایئ'],
 ['تاریخ امروز','Today','نن'],['امروز','Today','نن'],['فعال','Active','فعال'],['در انتظار','Pending','په تمه'],
 ['اتصال به سرور','Server connection','له سرور سره اړیکه'],['سرور آماده اتصال است','Server is ready','سرور چمتو دی'],
 ['تنظیمات و پشتیبانی','Settings & support','تنظیمات او ملاتړ'],
 ['این نرخ فقط برای نمایش قیمت‌ها و ارزش موجودی به AFN استفاده می‌شود و فاکتورهای گذشته را تغییر نمی‌دهد.',
  'This rate is only used to display prices and inventory value in AFN. Previous invoices are unchanged.',
  'دا نرخ یوازې د توکو بیې او موجودي په AFN ښيي؛ پخواني فاکتورونه نه بدلوي.'],
 ['این صندوق به دالر نگهداری می‌شود و با مانده صندوق افغانی جمع نمی‌شود.',
  'This cash account is in USD and is not included in the AFN cash total.',
  'دا صندوق په ډالرو دی او د افغانیو له صندوق سره نه جمع کېږي.'],
 ['بخش‌ها فقط در همین دستگاه خاموش یا روشن می‌شوند. معلومات گذشته پاک نمی‌شود.',
  'Sections are enabled or disabled only on this device. Existing records are not deleted.',
  'برخې یوازې په دې وسیله بندې یا چالانېږي؛ پخواني معلومات نه پاکېږي.']
];
const n=s=>String(s||'').replace(/[\u200b-\u200f\u202a-\u202e]/g,'').replace(/\s+/g,' ').trim();
const exact=new Map(rows.map(([fa,en,ps])=>[n(fa),{en,'ps-AF':ps,'fa-AF':fa}]));
const reverse=new Map(rows.flatMap(([fa,en,ps])=>[[n(en),n(fa)],[n(ps),n(fa)]]));
const remembered=new WeakMap();const attrMemory=new WeakMap();
function lang(){const r=document.documentElement.lang||'';if(r==='en'||r==='ps-AF'||r==='fa-AF')return r;
 try{return localStorage.getItem(location.pathname.includes('/admin/')?'zavi_admin_language_v18':'zavi_public_language_v11')||'fa-AF'}catch(_){return 'fa-AF'}}
function ignored(el){return !el||!!el.closest('script,style,noscript,textarea,code,pre,option,[contenteditable],[translate="no"],[data-no-translate],[data-user-value],[data-zavi-user-data],[data-contact-name],.customer-name,.prod-title,.zavi-phone-number,.user-entered')}
function chosen(raw,l){const key=reverse.get(n(raw))||n(raw);return exact.get(key)?.[l]||null}
function updateNode(node,l){const el=node.parentElement;if(ignored(el)||!node.nodeValue?.trim())return;
 const existing=remembered.get(node);const text=existing?.rendered===node.nodeValue?existing.original:node.nodeValue;
 const translation=chosen(text,l);if(!translation)return;
 const replacement=text.replace(/^(\s*).*?(\s*)$/s,(_,prefix,suffix)=>prefix+translation+suffix);
 if(replacement!==node.nodeValue)node.nodeValue=replacement;
 remembered.set(node,{original:text,rendered:replacement});
}
let busy=false,timer=0;function apply(){if(busy||!document.body)return;busy=true;
 try{let l=lang();if(!['en','fa-AF','ps-AF'].includes(l))return;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const t of nodes)updateNode(t,l);
 for(const el of document.querySelectorAll('[placeholder],[aria-label],[title]')){
  if(ignored(el))continue;
  const prior=attrMemory.get(el)||{};
  for(const attr of ['placeholder','aria-label','title']){if(!el.hasAttribute(attr))continue;
   const val=el.getAttribute(attr),base=prior[attr]?.rendered===val?prior[attr].original:val;
   const value=chosen(base,l);if(!value)continue;
   if(val!==value)el.setAttribute(attr,value);prior[attr]={original:base,rendered:value};
  }attrMemory.set(el,prior);
 }
 }finally{busy=false}}
function schedule(){if(timer)return;timer=setTimeout(()=>{timer=0;apply()},180)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
document.addEventListener('zavi:language-changed',schedule);document.addEventListener('zavi:page-rendered',schedule);
window.addEventListener('pageshow',schedule);
window.ZaviSignatureLocaleV35={refresh:apply,count:rows.length};
})();
