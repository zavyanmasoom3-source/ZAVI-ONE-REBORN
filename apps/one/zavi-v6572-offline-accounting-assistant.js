/* ZAVI ONE V65.72 — multilingual, no-network bookkeeping guide + exact sample math.
 * The original accounting ledger is NOT read or altered. No generative model is claimed.
 */
(()=>{'use strict';
const q=(s,p=document)=>p.querySelector(s);
const language=()=>{let v=(q('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const copy={
fa:{heading:'دستیار حسابداری آفلاین',sub:'راهنمای فروش، خرید، قرض، گدام، سود و تنظیمات، بدون اینترنت.',start:'سؤال خود را بنویسید، مثلاً «چگونه بدهی مشتری را ثبت کنم؟»',send:'پاسخ بده',close:'بستن',intro:'از بخش‌های فروش، خرید، قرضداران، گزارش‌ها، گدام و نرخ ارز بپرسید. برای حساب نمونه بنویسید: سود 1200 1500 یا تخفیف 1000 10.',bad:'برای این سؤال پاسخ تأییدشده‌ای در راهنمای محلی وجود ندارد. لطفاً موضوع را واضح‌تر بنویسید؛ مثلاً «چاپ فاکتور»، «قرضدار»، «نرخ دالر» یا «سود».',disclaimer:'این دستیار محلی، راهنما و محاسبه‌گر است؛ مدل زبانی بزرگ نیست، اسناد واقعی را نمی‌بیند و هیچ سندی ثبت نمی‌کند. برای نتیجۀ واقعی به گزارش‌های سیستم مراجعه کنید.',math:'نتیجه فقط از اعداد نوشتۀ شما محاسبه شده است؛ اطلاعات دفتر مشتری نیست.',label:'راهنمای داخلی • بدون اینترنت',how:'گام‌ها'},
en:{heading:'Offline bookkeeping assistant',sub:'Sales, purchases, debt, stock, profit and settings — no internet needed.',start:'Ask a bookkeeping question, e.g. How do I record a customer payment?',send:'Answer',close:'Close',intro:'Ask about sales, stock, debtors, reports or exchange rates. Try: profit 1200 1500 or discount 1000 10.',bad:'No verified offline answer for this question. Please try invoices, debtors, printing, stock, profit or exchange rates.',disclaimer:'This is an embedded guidance and calculator engine, not a large language model. It cannot inspect your ledger or post transactions.',math:'Based only on the numbers you typed; not your actual company accounts.',label:'Local guide • no network',how:'Steps'},
ps:{heading:'آفلاین د حسابدارۍ لارښود',sub:'پلور، پېرود، پور، ګدام، ګټه او تنظیمات بې له انټرنېټه.',start:'د حسابدارۍ پوښتنه ولیکئ.',send:'ځواب',close:'بندول',intro:'د پلور، پېرود، پور، ګدام او حساب په اړه وپوښتئ.',bad:'دې پوښتنې ته دقیق ځواب نشته. د پلور، پور، ګدام یا بل په اړه وپوښتئ.',disclaimer:'دا ځایي لارښود دی، لوی ژبنی ماډل نه دی. اصلي حسابونه نه لولي او معامله نه ثبتوي.',math:'حساب یوازې ستاسو په ورکړل شویو شمېرو دی.',label:'ځایي لارښود • بې انټرنېټه',how:'لارښوونې'}
};
const topics=[
['فروش sales پلور invoice ثبت فروش', 'فروش: ۱) مشتری را انتخاب کنید. ۲) کالا، مقدار و نرخ را ثبت کنید. ۳) نقد/نسیه و دریافتی را بررسی کنید. ۴) فاکتور را ذخیره کنید و موجودی را کنترل کنید.', 'Sales: choose customer and items, verify amounts and cash/credit, save invoice and check stock.', 'پلور: پېرودونکی او توکي وټاکئ، مقدار او پیسې وګورئ، بل ثبت کړئ.'],
['خرید purchase supplier تأمین کننده پېرود', 'خرید: تأمین‌کننده، مقدار، بهای کالا، ارز و پرداخت را ثبت کنید؛ فاکتور خرید و موجودی جدید را تطبیق کنید.', 'Purchases: record supplier, items, cost, currency and payment; reconcile resulting stock.', 'پېرود: عرضه کوونکی، مقدار، بیه او پیسې ثبت کړئ؛ ګدام وګورئ.'],
['قرضداران بدهکار نسیه مشتری قرض receivable debtors پور', 'قرضداران: فاکتور نسیه همان مشتری را بررسی کنید؛ هر دریافت وجه را فقط یک‌بار ثبت کنید. مانده = فاکتورهای نسیه منهای دریافتی و برگشتی معتبر.', 'Debtors: compare outstanding invoices with customer receipts, record payments once and reconcile.', 'د پور حساب: بلونه او ترلاسه شوې پیسې سره پرتله کړئ.'],
['طلبکاران بدهی ما payable creditors supplier', 'طلبکاران: خریدهای نسیۀ تأمین‌کننده، سررسید و پرداخت‌ها را بررسی کنید؛ از ثبت دوبارۀ پرداخت خودداری کنید.', 'Payables: reconcile supplier invoices, due dates and recorded payments.', 'د عرضه کوونکي پورونه، نېټې او ورکړې پرتله کړئ.'],
['فاکتور چاپ پرینت invoice print رسید', 'فاکتور: نام فروشگاه، تاریخ، اقلام، مقدار، نرخ، تخفیف، دریافتی و باقیمانده را بررسی کنید؛ سپس پیش‌نمایش و چاپ را انجام دهید.', 'Invoices: verify date, customer, lines, totals, payments, balance and print preview.', 'په بل کې نېټه، توکي، بیه، تخفیف او پاتې پیسې وګورئ.'],
['گدام انبار موجودی stock inventory ګدام', 'گدام: خرید موجودی را افزایش و فروش کاهش می‌دهد. مقدار واقعی را بشمارید، با مقدار سیستم تطبیق کنید و اختلاف را بدون سند تغییر ندهید.', 'Inventory: reconcile physical count with purchases, sales and returns before adjusting.', 'ګدام: حقیقي شمېر د سیسټم له شمېر سره پرتله کړئ.'],
['سود خالص مفاد منفعت profit margin ګټه زیان', 'سود ناخالص = فروش خالص منهای بهای کالای فروخته‌شده. سود خالص = سود ناخالص منهای مصارف مربوط. فروش نسیه مساوی با دریافت نقد نیست.', 'Gross profit = net sales minus cost of goods sold. Net profit also deducts expenses. Profit differs from cash flow.', 'ناخالصه ګټه = خالص پلور منفي د توکو لګښت. خالصه ګټه نور مصارف هم کموي.'],
['مصارف هزینه خرج rent expense operating لګښت', 'مصارف: تاریخ، دسته‌بندی، ارز، مبلغ و سند را ثبت کنید. خرید موجودی را از کرایه، معاش و سایر مصارف عملیاتی جدا کنید.', 'Expenses: classify rent, salaries and operating costs separately from stock purchases.', 'د خرڅ، معاش او کرایې حساب له ګدام پېرود جلا وساتئ.'],
['نقدینگی صندوق cash flow خزانه جریان نقد', 'نقد صندوق = موجودی آغاز + دریافت‌های واقعی − پرداخت‌های واقعی. فروش نسیه تا زمان دریافت، پول نقد نیست.', 'Cash flow records actual receipts and payments; unpaid invoices do not increase cash.', 'نغدې پیسې له حقیقي اخیستنو او ورکړو حساب کړئ.'],
['راپور گزارش report accounting balance تراز', 'راپور: بازۀ زمانی را انتخاب کنید؛ فروش، خرید، مصارف، سود، موجودی و قرض‌ها را با اسناد اصلی تطبیق کنید.', 'Reports: choose a period, reconcile sales, expenses, stock, profit and debts with source documents.', 'راپور کې وخت او معاملات د سندونو سره پرتله کړئ.'],
['دالر دلار currency usd afn نرخ ارز exchange اسعار', 'نرخ ارز: ۱ دالر = چند افغانی را دستی در داشبورد ذخیره کنید. مبلغ دالر × نرخ = مبلغ افغانی. برای معاملات گذشته نرخ همان روز را حفظ کنید.', 'FX: USD amount multiplied by AFN per USD equals AFN. Use historical rates for old invoices.', 'د ډالر مقدار په نرخ ضرب کړئ، د پخواني بل د هماغې ورځې نرخ وساتئ.'],
['آفلاین offline internet اینترنت مجوز 180 365', 'آفلاین: پس از ورود ابری، مجوز امضاشده را روی دستگاه اصلی بگیرید. ۱۸۰/۳۶۵ روز سقف سیاست است و اعتبار از پایان اشتراک بیشتر نمی‌شود. قبل از انتقال، تراکنش‌های ارسال‌نشده را همگام کنید.', 'Offline: get signed licence while online; sync pending sales before device transfer. Entitlement cannot exceed subscription.', 'اصلي وسیلې ته لاسلیک شوی جواز واخلئ؛ تر انتقال مخکې معلومات همغږي کړئ.'],
['اشتراک آزمایشی ۷ 7 trial امتحان تست تمدید free', 'آزمایش ۷ روزه: فقط مدیر مرکزی از ADMIN برای فروشگاه مجوز می‌دهد. پایان اعتبار در تنظیمات حساب ابری قابل مشاهده است؛ فعال‌سازی آفلاین مجوز جداگانه نیاز دارد.', 'Seven-day trial: only central ADMIN grants it; check subscription expiry in Settings. Offline use requires a separate signed device licence.', '۷ ورځنی امتحان مرکزي مالک ورکوي؛ پای نېټه په تنظیماتو کې وګورئ.'],
['دستگاه انتقال همکار coworker owner device', 'انتقال دستگاه: اول تمام معاملات ارسال‌نشده را همگام و از معلومات نسخه پشتیبان بگیرید؛ سپس انتقال اصلی را انجام دهید. همکاران نباید به سرمایه و پنل ADMIN مرکزی دسترسی داشته باشند.', 'Devices: sync unsent transactions and back up before transferring main device. Keep central ADMIN owner-only.', 'د وسیلې له بدلون مخکې بکاپ او همغږي بشپړه کړئ.'],
['بارکد اسکن دوربین barcode scan camera', 'بارکد: اجازه دوربین را فعال کنید. فوکس و نور مناسب داشته باشید؛ کد را با محصول ثبت‌شده تطبیق کنید. قبل از فاکتور نام کالا را تأیید کنید.', 'Barcode: allow camera, check lighting and focus, verify scanned product before invoicing.', 'کیمره فعاله او بارکود فوکس کړئ؛ توکی تایید کړئ.'],
['پشتیبان بکاپ restore backup بازیابی sync', 'پشتیبان: قبل از حذف یا تعویض برنامه، سندهای آفلاین ارسال‌نشده را کنترل کنید و یک بکاپ قابل بازیابی بگیرید. نسخۀ آزمایشی با شناسه دیگر داده محلی را خودکار منتقل نمی‌کند.', 'Backup: sync pending records and verify a restorable backup before reinstalling or transferring.', 'له حذف مخکې بیکاپ، همغږي او نالېږل شوې معاملې وګورئ.'],
['امنیت ورود رمز password security permissions login', 'امنیت: رمز ورود را با کسی شریک نکنید. دسترسی همکاران را فقط در حد وظیفه بدهید؛ کنترل مالی و دسترسی ADMIN باید سمت سرور بماند.', 'Security: protect credentials, least-privilege coworkers, enforce ADMIN permissions on server.', 'پټ نوم مه شریکوئ؛ همکار ته یوازې اړین اجازه ورکړئ.'],
['تخفیف فیصدی درصد discount rate percent', 'تخفیف = مبلغ اصلی × فیصدی ÷ ۱۰۰؛ مبلغ نهایی = مبلغ اصلی − تخفیف. از تخفیف دوبارۀ روی ردیف و کل فاکتور جلوگیری کنید.', 'Discount amount = price × percentage ÷ 100. Avoid double discounting invoice totals.', 'تخفیف = بیه × فیصدي ÷ ۱۰۰؛ دوه ځله تخفیف مه ورکوئ.'],
['برگشت مرجوعی refund return return invoice', 'برگشتی را به فاکتور اصلی وصل کنید؛ تعداد، علت برگشت، اصلاح گدام و بازپرداخت وجه را با سند تطبیق کنید.', 'Returns: link to original invoice and reconcile refunded money and stock.', 'بېرته ستنېدنه له اصلي بل سره وتړئ.'],
['آغاز دوره سرمایه opening opening balance', 'آغاز دوره: مانده صندوق، موجودی گدام، طلب و بدهی قبلی را با سند واقعی وارد کنید؛ آن را دوباره به‌عنوان فروش یا خرید جدید ثبت نکنید.', 'Opening balances: record cash, stock, receivables and payables separately from new sales.', 'د پیل حساب له نوي پلور سره مه ګډوئ.'],
['زرگری طلا gold jewelry گرام عیار', 'طلافروشی: وزن گرام، عیار، اجرت ساخت، سنگ و نرخ روز را جدا ثبت کنید؛ واحد و ارز فاکتور را بررسی کنید.', 'Jewelry: track grams, purity, making charge and stones separately.', 'د سرو زرو ګرام، عیار، اجرت او نرخ جلا ثبت کړئ.'],
['دواخانه داروخانه pharmacy دوا تاریخ انقضا', 'دواخانه: بچ/سری ساخت، تاریخ انقضا و موجودی قابل فروش را ثبت کنید و محصولات نزدیک انقضا را گزارش کنید.', 'Pharmacy: record batch, expiry and stock, avoid selling expired items.', 'د درملو بچ او د ختمېدو نېټه ثبت کړئ.'],
['موبایل گوشی imei serial phone electronics', 'موبایل: IMEI یا سریال هر دستگاه را با فاکتور خرید و فروش، قیمت تمام‌شده و گارانتی مرتبط کنید.', 'Phones: link each IMEI/serial to inventory, invoice and warranty.', 'د موبایل IMEI له بل او ضمانت سره وتړئ.'],
['ساختمانی ساختمان پروژه construction building', 'ساختمان: مواد، واحدها، اجرت کارگر، هزینه انتقال و مصرف را به تفکیک پروژه نگه دارید.', 'Construction: allocate material and labor costs to each project.', 'د پروژې مواد او مزدوري جلا حساب کړئ.'],
['تعمیرات سرویس service repair fixes', 'تعمیرات: مشخصات دستگاه، مشکل، قطعات مصرفی، اجرت و پیش‌پرداخت را ثبت و هنگام تحویل رسید صادر کنید.', 'Repairs: record device, issue, parts, labor, deposit and delivery receipt.', 'ترمیم کې وسیله، پرزې، اجرت او رسید ثبت کړئ.'],
['عمده فروشی توزیع wholesale distribution', 'عمده‌فروشی: نرخ عمده، حداقل سفارش، تحویل، موجودی و حساب نسیۀ مشتری را جدا پیگیری کنید.', 'Wholesale: track tiered prices, shipment, stock and receivables.', 'د عمده نرخ، سپارښتنې او پور حساب وګورئ.']
];
function normalize(x){return String(x||'').toLowerCase().normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/[^0-9a-z\u0600-\u06ff.% ]/g,' ').replace(/\s+/g,' ').trim()}
const ignored=new Set(['چی','چطور','چگونه','برای','چیست','است','من','می','شود','از','و','در','یک','دو','ما','حساب','با','what','how','my','the','a','is','are','to','in','me','about','please','do']);
const tokens=x=>normalize(x).split(' ').filter(t=>t.length>1&&!ignored.has(t));
function find(query){
 const words=tokens(query);if(!words.length)return [];
 return topics.map(t=>{const alias=normalize(t[0]);const options=alias.split(' ');let score=0;for(const w of words){if(options.includes(w))score+=10;else if(w.length>3&&options.some(x=>x.includes(w)))score+=3;}return {t,score}}).sort((a,b)=>b.score-a.score).filter(x=>x.score>=3).slice(0,2);
}
function exampleCalc(raw){
 const s=normalize(raw),n=(s.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);if(n.length<2||!Number.isFinite(n[0])||!Number.isFinite(n[1])||Math.max(Math.abs(n[0]),Math.abs(n[1]))>1e12)return null;
 const a=n[0],b=n[1],fmt=x=>Number(x.toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3}),intro=copy[language()].math;
 if(/تخفیف|discount/.test(s)){if(b<0||b>100)return null;return intro+'\nDiscount / تخفیف: '+fmt(a*b/100)+'\nFinal / نهایی: '+fmt(a*(1-b/100))}
 if(/دالر|دلار|usd|currency|exchange|تبدیل/.test(s))return intro+'\n'+fmt(a)+' × '+fmt(b)+' = '+fmt(a*b);
 if(/فیصد|درصد|percent|tax/.test(s))return intro+'\n'+fmt(a)+' × '+fmt(b)+'% = '+fmt(a*b/100);
 if(/باقی|remaining|قرض/.test(s))return intro+'\n'+fmt(a)+' − '+fmt(b)+' = '+fmt(a-b);
 if(/سود|profit|ګټه/.test(s))return intro+'\nProfit / سود نمونه: '+fmt(b-a)+'\nMarkup: '+(a?fmt((b-a)*100/a)+'%':'—')+'\nمصارف در این مثال کسر نشده است.';
 return null;
}
const el=(tag,cls,value)=>{let a=document.createElement(tag);a.className=cls||'';if(value!==undefined)a.textContent=value;return a};
let dialog=null;
function render(query){
 let root=q('#z72-ai-answer');if(!root)return;root.replaceChildren();
 const l=language(),C=copy[l],calc=exampleCalc(query);
 if(calc){root.append(el('pre','z72-ai-calculation',calc));return}
 if(!String(query).trim()){root.append(el('p','',C.intro));return}
 const match=find(query);if(!match.length){root.append(el('p','',C.bad));return}
 for(const item of match){let section=el('section','z72-ai-result');section.append(el('strong','',item.t[0].split(' ').slice(0,2).join(' ')));section.append(el('p','',item.t[l==='en'?2:l==='ps'?3:1]));root.append(section)}
}
function shut(){dialog?.remove();dialog=null;document.body.classList.remove('z72-ai-open')}
function open(){
 if(dialog){q('#z72-ai-query')?.focus();return}
 const C=copy[language()],o=el('section','z72-ai-overlay');o.id='z72-ai-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',C.heading);
 const box=el('div','z72-ai-panel'),header=el('div','z72-ai-head'),info=el('div','');
 info.append(el('strong','',C.heading),el('small','',C.sub));
 const close=el('button','z72-ai-close','×');close.type='button';close.setAttribute('aria-label',C.close);close.addEventListener('click',shut);header.append(info,close);
 const chips=el('div','z72-ai-topics');
 for(let i of [0,1,2,4,5,6,8,10,11,12,13,14,20,21]){
   let b=el('button','',topics[i][0].split(' ').slice(0,2).join(' '));b.type='button';b.addEventListener('click',()=>{query.value=topics[i][0].split(' ')[0];render(query.value)});chips.append(b)}
 const form=el('form','z72-ai-form'),query=document.createElement('input');query.type='search';query.id='z72-ai-query';query.maxLength=220;query.placeholder=C.start;query.autocomplete='off';
 const send=el('button','',C.send);send.type='submit';form.append(query,send);form.addEventListener('submit',e=>{e.preventDefault();render(query.value)});
 const answer=el('div','z72-ai-answer');answer.id='z72-ai-answer';answer.setAttribute('role','status');
 box.append(header,el('p','z72-ai-mode',C.label),chips,form,answer,el('small','z72-ai-disclaimer',C.disclaimer));
 o.append(box);o.addEventListener('click',e=>{if(e.target===o)shut()});document.body.append(o);document.body.classList.add('z72-ai-open');dialog=o;render('');query.focus({preventScroll:true});
}
function mount(){
 const c=q('#content'),hub=q('.zavi-clean-settings-hub',c||document);if(!c||!hub||q('#z72-ai-entry',c))return;
 const C=copy[language()],p=el('section','z72-ai-entry');p.id='z72-ai-entry';const info=el('div','');info.append(el('strong','',C.heading),el('small','',C.sub));
 const b=el('button','',C.heading);b.type='button';b.addEventListener('click',open);p.append(info,b);hub.before(p);
}
function start(){
 const c=q('#content');if(!c)return;
 let waiting=false;new MutationObserver(()=>{if(waiting)return;waiting=true;requestAnimationFrame(()=>{waiting=false;mount()})}).observe(c,{childList:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog)shut()});mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();