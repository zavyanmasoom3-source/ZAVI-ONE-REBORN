/* V33: targeted interface-only localization supplement.
   Preserves customer/store names, user fields, dates, numbers and saved ledger data.
   Complements—not replaces—the existing ~2100-key i18n dictionary. */
(()=>{'use strict';
 const APP='one';
 const language=()=>window.ZaviLocaleV22?.get?.()||window.ZaviLocaleV23?.get?.()||(() => {
  try{return localStorage.getItem(APP==='admin'?'zavi_admin_language_v18':'zavi_public_language_v11')||'fa-AF'}catch(_){return 'fa-AF'}
 })();
 const records=[
  ['پس از ثبت فروش، فاکتور را باز کنید و «ذخیره در سیستم» را بزنید.','After recording a sale, open the invoice and select “Save in app”.','له پلور ثبتولو وروسته فاکتور پرانیزئ او «په اپ کې ساتل» وټاکئ.'],
  ['فاکتورهای ساخته‌شده در قالب دستی در این بخش نمایش داده می‌شوند.','Invoices created using the manual template appear here.','په لاسي قالب کې جوړ شوي فاکتورونه دلته ښکاري.'],
  ['فاکتورهای ساخته‌شده در قالب دستی  در این بخش نمایش داده می‌شوند.','Invoices created using the manual template appear here.','په لاسي قالب کې جوړ شوي فاکتورونه دلته ښکاري.'],
  ['در حالت آفلاین تغییر در همین دستگاه محفوظ می‌ماند و پس از وصل‌شدن اینترنت به سرور ارسال می‌شود. تغییر فقط برای مالک فروشگاه فعال است.','When offline, this change stays on this device and syncs after reconnecting. Only the store owner can make this change.','په آفلاین حالت کې بدلون په دې وسیله خوندي کېږي او د انټرنټ تر نښلېدو وروسته سرور ته لېږل کېږي. یوازې د پلورنځي مالک یې بدلولای شي.'],
  ['این نرخ فقط برای نمایش قیمت‌ها و ارزش موجودی به AFN استفاده می‌شود و فاکتورهای گذشته را تغییر نمی‌دهد.','This rate is used only to display prices and stock value in AFN. It does not modify previous invoices.','دا نرخ یوازې په افغانیو د بیو او موجودۍ ارزښت ښيي؛ پخواني فاکتورونه نه بدلوي.'],
  ['تغییر فقط برای مالک فروشگاه فعال است.','Only the store owner may change this.','یوازې د پلورنځي مالک یې بدلولای شي.'],
  ['این صندوق به دالر نگهداری می‌شود و با مانده صندوق افغانی جمع نمی‌شود.','This cashbox holds USD and is not added to the AFN cash balance.','دا صندوق په ډالرو دی او د افغانیو له صندوق سره نه جمع کېږي.'],
  ['برای نمایش معادل افغانی، نرخ دالر را در تنظیمات ثبت کنید.','Enter the USD exchange rate in Settings to see the AFN equivalent.','د افغانیو معادل د لیدلو لپاره د ډالر نرخ په تنظیماتو کې ثبت کړئ.'],
  ['در حالت مستقل معلومات در همین دستگاه ذخیره می‌شود.','In standalone mode, data is stored on this device.','په خپلواک حالت کې معلومات په همدې وسیله ساتل کېږي.'],
  ['در حالت ابری با تنظیم سرور امن، مالک می‌تواند معلومات را میان چند دستگاه همگام کند؛ اعضا تنها می‌توانند مشاهده کنند.','When secure cloud sync is configured, the owner can sync data across devices. Members have view-only access.','کله چې خوندي کلاوډ فعال وي، مالک معلومات د وسایلو ترمنځ همغږي کولی شي؛ غړي یوازې لیدلی شي.'],
  ['در حالت آفلاین','When offline','په آفلاین حالت کې'],
  ['فاکتورهای ذخیره‌شده در سیستم','Invoices saved in the app','په اپ کې ساتل شوي فاکتورونه'],
  ['فاکتورهای دستی','Manual invoices','لاسي فاکتورونه'],
  ['مشاهده فاکتور','View invoice','فاکتور وګورئ'],
  ['دیدن فاکتور','View invoice','فاکتور وګورئ'],
  ['بازکردن فاکتور','Open invoice','فاکتور پرانیزئ'],
  ['دفترچه تماس مشتریان','Customer contact directory','د پېرودونکو د اړیکو نوملړ'],
  ['دفترچه تماس','Contact directory','د اړیکو نوملړ'],
  ['فهرست تماس‌ها','Contact list','د اړیکو لړلیک'],
  ['سفارش باز - ثبت و پیگیری سریع','Open repair orders — quick registration and tracking','د ترمیم خلاص امرونه — ژر ثبت او تعقیب'],
  ['تعمیرات','Repairs','ترمیمونه'],
  ['موجودی هوشمند','Smart inventory','هوښیار موجودي'],
  ['گزارش سود و زیان','Profit and loss report','د ګټې او زیان راپور'],
  ['وضعیت اشتراک','Subscription status','د ګډون حالت'],
  ['روزهای باقی‌مانده','Days remaining','پاتې ورځې'],
  ['بخش‌هایی که می‌خواهید نمایش داده شوند','Sections to display','هغه برخې چې ښودل یې غواړئ'],
  ['روشن و خاموش کردن امکانات','Enable or disable features','اسانتیاوې فعالې یا بندې کړئ'],
  ['همه امکانات در نصب تازه روشن هستند. بعداً هر بخش را جداگانه می‌توانید خاموش کنید.','All features are enabled on a fresh install. You may disable individual sections later.','په نوي نصب کې ټولې اسانتیاوې فعالې دي؛ وروسته هره برخه جلا بندولای شئ.'],
  ['خاموش‌کردن هر بخش فقط آن را پنهان می‌کند و معلومات گذشته پاک نمی‌شود. بخش تنظیمات همیشه فعال می‌ماند.','Disabling a section only hides it; existing data is preserved. Settings always remains available.','د یوې برخې بندول یوازې هغه پټوي؛ پخواني معلومات نه پاکېږي. تنظیمات تل فعال وي.'],
  ['برای تأیید مجدد','To confirm again','د بیا تایید لپاره'],
  ['اطلاعات خصوصی همین فروشگاه از ابر دریافت شد.','This store’s private information was retrieved from the cloud.','د دې پلورنځي شخصي معلومات له کلاوډ څخه ترلاسه شول.'],
  ['تاریخ امروز','Today’s date','د نن ورځې نېټه'],
  ['معلومات سرور','Server information','د سرور معلومات'],
  ['تغییر نام فروشگاه','Change store name','د پلورنځي نوم بدلول'],
  ['درخواست بازیابی','Recovery request','د بېرته لاسرسي غوښتنه'],
  ['فاکتور در حافظه اختصاصی همین فروشگاه ذخیره شد.','The invoice was saved in this store’s private storage.','فاکتور د دې پلورنځي په ځانګړې زېرمه کې خوندي شو.'],
  ['برای ذخیره فاکتور جدید، مجوز معتبر آنلاین یا آفلاین لازم است.','A valid online or offline license is required to save a new invoice.','د نوي فاکتور ساتلو لپاره معتبر آنلاین یا آفلاین جواز پکار دی.'],
  ['چاپ / ذخیره PDF','Print / Save PDF','چاپ / PDF خوندي کړئ']
 ];

 records.push(
  ['نرخ تبدیل را خودتان وارد کنید:', 'Enter the exchange rate:', 'د تبادلې نرخ پخپله ولیکئ:'],
  ['۱ دالر چند', 'How many AFN per USD', 'د یو ډالر په بدل کې څو افغانۍ'],
  ['این نرخ فقط برای نمایش قیمت‌ها و ارزش موجودی به USD استفاده می‌شود و فاکتورهای گذشته را تغییر نمی‌دهد.', 'This rate is only for showing USD prices and inventory value; previous invoices are not modified.', 'دا نرخ یوازې د USD بیو او موجودۍ ارزښت د ښودلو لپاره دی؛ پخواني فاکتورونه نه بدلوي.'],
  ['مالک فروشگاه می‌تواند نام تجارت را تغییر بدهد.', 'The store owner can rename the business.', 'د پلورنځي مالک د سوداګرۍ نوم بدلولای شي.'],
  ['اگر تعارض رخ دهد، اطلاعات محلی حذف نمی‌شود.', 'If a sync conflict occurs, locally stored information is preserved.', 'که د همغږۍ ستونزه رامنځته شي، ځايي معلومات نه پاکېږي.'],
  ['برای انتقال به دستگاه دیگر از پشتیبان رمزدار استفاده کنید.', 'Use an encrypted backup to move data to another device.', 'بلې وسیلې ته د لېږد لپاره کوډ شوی بیک اپ وکاروئ.'],
  ['پس از اتصال دوباره و تأیید مجوز', 'after reconnection and license verification', 'د بیا نښلېدو او جواز له تایید وروسته'],
  ['نرخ ارز را خودتان وارد کنید.', 'Enter exchange rates manually.', 'د پیسو تبادلې نرخونه پخپله دننه کړئ.'],
  ['فاکتور در بایگانی پیدا نشد.', 'Invoice not found in the archive.', 'فاکتور په آرشیف کې ونه موندل شو.'],
  ['برای نمایش معادل افغانی، نرخ دالر را در تنظیمات ثبت کنید.', 'Enter the USD rate in Settings to see the AFN equivalent.', 'د افغانیو معادل لپاره د ډالر نرخ په تنظیماتو کې ثبت کړئ.'],
  ['درخواست‌های بازیابی','Recovery requests','د بېرته لاسرسي غوښتنې'],
  ['فهرست حساب‌ها','Account directory','د حسابونو نوملړ'],
  ['نمایش حساب‌های بایگانی','Show archived accounts','آرشیف شوي حسابونه وښایئ'],
  ['مرکز خدمات حرفه‌ای و پیگیری','Service and follow-up center','د خدمتونو او تعقیب مرکز'],
  ['اشتراک‌های نیازمند پیگیری','Subscriptions requiring attention','هغه ګډونونه چې پاملرنې ته اړتیا لري'],
  ['تمام فروشگاه‌ها','All stores','ټول پلورنځي'],
  ['تمام حساب‌ها','All accounts','ټول حسابونه'],
  ['تاریخ انقضا','Expiration date','د پای نېټه']
 );
 const normalize=s=>String(s||'').replace(/[\u200b\u200c\u200e\u200f\u202a-\u202e]/g,'').replace(/\s+/g,' ').trim();
 const exact=new Map(records.map(([fa,en,ps])=>[normalize(fa),{en, 'ps-AF':ps,'fa-AF':fa}]));
 const reverse=new Map(records.flatMap(([fa,en,ps])=>[[normalize(en),fa],[normalize(ps),fa]]));
 const phrases=records.filter(([fa])=>normalize(fa).length>=12).sort((a,b)=>b[0].length-a[0].length);
 const cached=new WeakMap(); let pending=false,busy=false;
 const skip=el=>!el||!!el.closest('script,style,noscript,textarea,pre,code,[contenteditable],'+
  '[translate="no"],[data-no-translate],[data-user-value],[data-zavi-user-data],'+
  '[data-contact-name],.zavi-phone-main,.zavi-phone-number,.prod-title,.customer-name,.user-entered,.amount');
 function patch(raw,locale){
  if(locale!=='fa-AF'){
   // Re-rendered and pre-switch currency helper templates include a dynamic base currency.
   const match=String(raw).match(/^\s*نرخ تبدیل را خودتان وارد کنید: ۱ دالر چند ([A-Za-z]{3,5}) است؟ این نرخ فقط برای نمایش قیمت‌ها و ارزش موجودی به USD استفاده می‌شود و فاکتورهای گذشته را تغییر نمی‌دهد\.\s*$/);
   if(match){const c=match[1];return locale==='en'?`Enter the exchange rate manually: How many ${c} equal 1 USD? This rate is only used to show prices and inventory value in USD. Previous invoices are not changed.`:`د تبادلې نرخ په خپله ولیکئ: یو ډالر څو ${c} کېږي؟ دا نرخ یوازې په USD د بیو او موجودۍ ارزښت ښيي. پخواني فاکتورونه نه بدلوي.`}
   const label=String(raw).match(/^\s*۱ USD = چند ([A-Za-z]{3,5})؟\s*$/);
   if(label){const c=label[1];return locale==='en'?`1 USD equals how many ${c}?`:`۱ USD څو ${c} کېږي؟`}
  }
  const trim=normalize(raw);
  const source=reverse.get(trim)||trim;
  if(locale==='fa-AF')return raw;
  const entry=exact.get(source);
  if(entry){const leading=(raw.match(/^\s*/)||[''])[0],trailing=(raw.match(/\s*$/)||[''])[0];return leading+entry[locale]+trailing}
  if(!/[\u0600-\u06ff]/.test(raw))return raw;
  let result=raw;
  // Replace verified UI phrases even when the HTML template combines English and Dari.
  for(const [fa,en,ps] of phrases){
   const chosen=locale==='en'?en:ps;
   if(result.includes(fa))result=result.split(fa).join(chosen);
  }
  return result;
 }
 function patchNode(n,locale){if(skip(n.parentElement)||!n.nodeValue?.trim())return;
  const original=cached.get(n);const src=original&&original.rendered===n.nodeValue?original.source:n.nodeValue;
  const final=patch(src,locale);if(final!==n.nodeValue)n.nodeValue=final;
  cached.set(n,{source:src,rendered:final});
 }
 function patchAttribute(el,attr,locale){if(skip(el)||!el.hasAttribute(attr))return;
  const value=el.getAttribute(attr)||'';
  const out=patch(value,locale);if(out!==value)el.setAttribute(attr,out);
 }
 function run(){if(busy||!document.body)return;const l=language();if(!['en','fa-AF','ps-AF'].includes(l))return;
  busy=true;try{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
   nodes.forEach(n=>patchNode(n,l));
   if(l!=='fa-AF')document.body.querySelectorAll('[title],[placeholder],[aria-label],[alt]').forEach(el=>{
    ['title','placeholder','aria-label','alt'].forEach(a=>patchAttribute(el,a,l));
   });
  }finally{busy=false}
 }
 const schedule=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;run()},170)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
 document.addEventListener('zavi:language-changed',schedule);document.addEventListener('zavi:page-rendered',schedule);
 window.ZaviLocalizationFinishV33={refresh:run,check:()=>({language:language(),direction:document.documentElement.dir})};
})();
