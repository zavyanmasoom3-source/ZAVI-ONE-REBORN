/* ZAVI AI ASSISTANT V63.7: local factual assistance + opt-in authenticated AI endpoint.
   Financial summaries come from the current bound tenant, never mock/sample totals.
   No customer names, ledger rows or tokens are sent to the LLM from the browser.
   This is NOT an automatic transaction/permission editor. */
(function(root,factory){'use strict';
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){root.ZaviAI637=api;api.init(root);}
})(typeof window!=='undefined'?window:null,function(){'use strict';
 const escWord=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک');
 const nfmt=(n,code)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})+' '+String(code||'AFN');
 const present=(row,key)=>row&&Object.prototype.hasOwnProperty.call(row,key)&&typeof row[key]==='number'&&Number.isFinite(row[key]);
 const unavailable='برای این شاخص معلومات معتبر کافی موجود نیست؛ عدد تخمینی نمایش داده نمی‌شود.';
 function localAnswer(question,snapshot){
  const q=escWord(question);if(!q.trim())return 'لطفاً یک پرسش بنویسید.';
  if(typeof window!=='undefined' && window.ZaviSmartCare6524 && window.zaviCareContext){const care=window.ZaviSmartCare6524;const report=care.diagnose(window.zaviCareContext());const extra=care.answer(question,report);if(extra)return extra;}
  if(/(?:سلام|درود|hello|hi|سلامونه)/.test(q))return 'سلام! من راهنمای ZAVI ONE هستم. در حالت آفلاین راهنمای استفاده و، برای مالک مجاز، خلاصه‌های محاسبه‌شده از معلومات همین فروشگاه را نشان می‌دهم.';
  if(/(?:اسکرول|پایین نمی‌رود|همکاران)/.test(q))return 'در پنجره «مدیریت همکاران» روی فهرست داخلی انگشت بکشید؛ پنجره اکنون ارتفاع محدود و اسکرول مستقل دارد. اگر باز نشد، اتصال اینترنت، نقش مالک و تازه‌بودن نسخه وب را بررسی کنید. دسترسی مالی همکاران باید جداگانه توسط مالک تنظیم شود.';
  if(/(?:همکار|کارمند|فروشنده جدید|employee|staff)/.test(q))return 'برای افزودن همکار: از منوی «مدیریت همکاران» وارد شوید، با حساب مالک وارد شوید و UID همکار را اضافه کنید. مالک می‌تواند اجازه فروش، اجازه خرید و پنهان‌کردن سرمایه را برای هر حساب تنظیم کند؛ اعتبار نهایی را سرور بررسی می‌کند.';
  if(/(?:اوگرایی|اوگری|اوگرايی)/.test(q))return 'اوگرایی مشتری را در «حساب قرضداران» ثبت کنید. «گرفتن اوگرایی / وصول قرض» طلب را کم و صندوق را زیاد می‌کند؛ «دادن اوگرایی» صندوق را کم و طلب همان مشتری را زیاد می‌کند. ابتدا مشتری قرضدار را انتخاب کنید و مبلغ، تاریخ و حساب پولی را بررسی کنید. امکان دادن اوگرایی را از تنظیمات روشن/خاموش کنید. این کار را خودکار انجام نمی‌دهم.';
  if(/(?:فاکتور|رسید|invoice)/.test(q)&&/(?:کجا|مشاهده|نمایش|تنظیم|روزمره|خاموش|روشن)/.test(q))return 'فاکتورهای فروش در «فروش» و فاکتورهای خرید در «خرید» هستند. برای اضافه کردن میان‌بُرشان به «مدیریت روزمره»، دو اختیار مستقل را در «تنظیمات و پشتیبان → اختیارهای نمایش» روشن کنید؛ به‌صورت پیش‌فرض پنهان هستند. خاموش کردن میان‌بُر فاکتورها را حذف نمی‌کند.';
  if(/(?:صورت.?حساب|مانده مشتری|قرضدار|قرض‌دار)/.test(q))return 'به «حساب قرضداران» بروید، نام مشتری را جستجو کنید و «صورت‌حساب» را بزنید. افزایش قرض، هر دریافت، شماره سند و مانده جدا نمایش داده می‌شود. عکس حساب و واتساپ از همان کارت مشتری قابل انتخاب است.';
  if(/(?:کند|لگ|گیر می‌کند|سرعت|آهسته|dark|حالت تیره)/.test(q))return 'اگر حالت تیره روی تبلت کند است: در «تنظیمات → ظاهر» انیمیشن‌ها را خاموش کنید، زبانه‌های غیرضروری مرورگر را ببندید و پس از ذخیره نسخه پشتیبان، صفحه را با اینترنت تازه کنید تا فایل‌های سبک‌تر برنامه بارگذاری شوند. پاک کردن داده‌های سایت بدون پشتیبان خطر از بین‌رفتن حساب آفلاین دارد.';

  if(/(?:دستگاه|انتقال دستگاه|معاملات ارسال.?نشده|همگام)/.test(q))return 'قبل از انتقال دستگاه اصلی، در دستگاه قبلی انترنت را وصل کنید و تمام معاملات معلق را همگام‌سازی نمایید. سپس از تنظیمات «دستگاه‌های حساب من» اقدام کنید. این دستیار انتقال یا حذف اطلاعات را خودش انجام نمی‌دهد.';
  if(/(?:بارکد|اسکن|barcode|qr)/.test(q))return 'در فرم فروش یا خرید، بارکد محصول را در فیلد اسکن وارد کنید یا دکمه دوربین را بزنید. بارکدخوان USB/Bluetooth کیبوردی نیز پشتیبانی می‌شود. اسکن کالای ناشناخته آن را خودکار به فاکتور اضافه نمی‌کند.';
  if(/(?:بک.?آپ|پشتیبان|backup|آفلاین|offline)/.test(q))return 'از تنظیمات، پشتیبان اطلاعات همین فروشگاه را بگیرید و نسخه را در جای امن نگهداری کنید. پاک‌کردن داده‌های مرورگر ممکن است نسخه محلی را از بین ببرد. همگام‌سازی به اینترنت و اشتراک معتبر نیاز دارد.';
  if(/(?:خدمات|خدمت|service|لابراتوار|آزمایش)/.test(q))return 'در بخش «مدیریت عمومی تجارت» می‌توانید تعرفه خدمات موجود را ثبت کنید. مدیریت نمونه و نتایج طبی هنوز پیاده‌سازی و تأیید نشده است؛ نتیجه طبی را فقط شخص مسئول بررسی و تأیید کند.';
  if(/(?:انقضا|تاریخ انقضا|بچ|دواخانه|pharmacy)/.test(q))return 'برای مدیریت بچ و تاریخ انقضا، بخش «مدیریت عمومی تجارت» را باز کنید. محصول منقضی را بدون بررسی مسئول و رعایت قواعد محل، به فروش نرسانید. کنترل FEFO و نسخه طبی هنوز کامل نشده است.';
  if(/(?:طلا|عیار|زرگری|gold)/.test(q))return 'فعلاً فروش و گدام عمومی را می‌توان استفاده کرد؛ محاسبه تخصصی وزن، عیار و اجرت هنوز کامل نیست. برای معاملات طلای واقعی از محاسبات تأییدشده استفاده کنید.';
  if(/(?:isbn|کتاب|book)/.test(q))return 'برای جست‌وجوی کتاب، ISBN ثبت‌شده را به‌عنوان کود/بارکد محصول وارد کنید؛ نمایه نویسنده و ناشر هنوز کامل نشده است.';
  if(!snapshot?.authorized)return 'برای دیدن ارقام مالی باید با حساب مالک مجاز وارد شوید و قفل برنامه باز باشد. در حالت فعلی تنها راهنمای عمومی در دسترس است.';
  const code=snapshot.currency||'AFN',today=snapshot.today||{},month=snapshot.month||{},prev=snapshot.previousMonth||{};
  if(/(?:امروز|today)/.test(q)&&/(?:فروش|sale)/.test(q)){if(!present(today,'sales')||!present(today,'salesCount'))return unavailable;return 'فروش امروز بر اساس اسناد محلی ثبت‌شده: '+nfmt(today.sales,code)+'\nتعداد فاکتور فروش امروز: '+today.salesCount+'\nاین رقم پس از همگام‌سازی ممکن است تغییر کند.';}
  if(/(?:دیروز|yesterday)/.test(q)&&/(?:فروش|sale)/.test(q)){if(!present(snapshot.yesterday,'sales'))return unavailable;return 'فروش دیروز بر اساس اسناد محلی: '+nfmt(snapshot.yesterday.sales,code)+'.';}
  if(/(?:مقایسه|گذشته|قبل|compare)/.test(q)&&/(?:فروش|ماه|sale)/.test(q)){if(!present(month,'sales')||!present(prev,'sales'))return unavailable;return 'فروش ماه جاری: '+nfmt(month.sales,code)+'\nفروش ماه گذشته: '+nfmt(prev.sales,code)+'\nتوجه: این جمع از معاملات محلی است، نه پیش‌بینی.';}
  if(/(?:سود|مفاد|profit)/.test(q)){if(!present(month,'profit'))return unavailable;return 'مفاد محاسبه‌شده ماه جاری طبق روش داشبورد: '+nfmt(month.profit,code)+'\nاین رقم بدون مصالحه بانکی و حسابرسی مستقل، سود حسابرسی‌شده محسوب نمی‌شود.';}
  if(/(?:قرض|بدهکار|طلب|debt)/.test(q)){if(!present(snapshot,'receivable')||!present(snapshot,'payable'))return unavailable;return 'مجموع طلب از مشتریان طبق حساب‌های محلی: '+nfmt(snapshot.receivable,code)+'\nمجموع بدهی به تأمین‌کنندگان: '+nfmt(snapshot.payable,code)+'.\nنام و معلومات فردی مشتریان در این نمای خلاصه ارائه نمی‌شود.';}
  if(/(?:کم.?موجود|تمام|موجودی|انبار|stock|inventory)/.test(q)){if(!present(snapshot,'lowStockCount')||!present(snapshot,'productCount'))return unavailable;return 'تعداد محصولات نزدیک حد سفارش مجدد: '+snapshot.lowStockCount+' از '+snapshot.productCount+' محصول.\nبرای فهرست اجناس به بخش «محصول و گدام» مراجعه کنید.';}
  if(/(?:مصارف|هزینه|expense)/.test(q)){if(!present(month,'expenses'))return unavailable;return 'مجموع مصارف ماه جاری طبق اسناد محلی: '+nfmt(month.expenses,code)+'.';}
  if(/(?:فروش|sale)/.test(q)){if(!present(month,'sales')||!present(month,'salesCount'))return unavailable;return 'فروش ماه جاری بر اساس معاملات محلی: '+nfmt(month.sales,code)+'؛ تعداد فروش: '+month.salesCount+'.';}
  return 'می‌توانم در حالت آفلاین درباره فروش امروز، مفاد ماه، قرض‌ها، کمبود موجودی، بارکد، همکاران و پشتیبان راهنمایی بدهم. برای پرسش آزاد با مدل هوش مصنوعی، حالت «ZAVI AI آنلاین» به سرویس امن نصب‌شده در سرور مرکزی و کلید سرور نیاز دارد.';
 }
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 function safeEndpoint(config){try{const url=new URL(config?.url||'');if(url.protocol!=='https:'||!/^https:\/\/[-a-z0-9.]+\.supabase\.co\/?$/i.test(url.origin))return null;return url.origin+'/functions/v1/zavi-ai-assistant';}catch{return null}}
 function canRead(win){return !win.document.documentElement.classList.contains('zawi-locked')&&!!win.zaviCloudCanEdit?.()&&!!win.zaviTenantIsBound?.();}
 async function onlineAnswer(question,win,fetcher){
  if(!canRead(win))throw Error('برای دستیار آنلاین باید با حساب مالک مجاز وارد شوید.');
  const auth=await win.zaviCloudRefreshAuthSession?.();const id=auth?.user?.id,token=auth?.access_token;
  const workspaceId=JSON.parse(win.localStorage.getItem('z20_workspace_id')||'null');
  const config=win.zaviCloudGetPublicConfig?.(),endpoint=safeEndpoint(config);
  if(!id||!token||!UUID.test(workspaceId||'')||!endpoint)throw Error('نشست معتبر یا اتصال امن سرور مرکزی موجود نیست.');
  let response;
  try{response=await (fetcher||win.fetch.bind(win))(endpoint,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token,'apikey':config.key},body:JSON.stringify({workspaceId,question:String(question).slice(0,750)}),cache:'no-store',credentials:'omit',signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(20000):undefined});}
  catch(_){throw Error('اتصال ZAVI AI آنلاین برقرار نشد. اینترنت یا وضعیت سرویس را بررسی کنید؛ حساب شما خارج نمی‌شود.')}
  let result;try{result=await response.json()}catch{throw Error('پاسخ سرور ZAVI AI قابل خواندن نیست.');}
  if(!response.ok){
   const dictionary={FUNCTION_NOT_FOUND:'سرویس ZAVI AI هنوز روی سرور منتشر نشده است.',NOT_FOUND:'سرویس ZAVI AI هنوز روی سرور منتشر نشده است.',AI_ORIGIN_NOT_ALLOWED:'این آدرس برای دستیار آنلاین مجاز نیست.',AI_NOT_CONFIGURED:'دستیار آنلاین هنوز روی سرور فعال نشده است. فعلاً راهنمای آفلاین در دسترس است.',
    AI_QUOTA_NOT_CONFIGURED:'محدودیت درخواست‌های AI هنوز در سرور راه‌اندازی نشده است.',
    AI_DAILY_LIMIT_REACHED:'سقف پرسش‌های امروز این فروشگاه تکمیل شده است.',
    AUTH_REQUIRED:'نشست شما معتبر نیست. حساب را بررسی یا نشست را به‌صورت امن تمدید کنید.',INVALID_REQUEST:'پرسش یا فضای کاری معتبر نیست.',NOT_AUTHORIZED:'برای این پرسش اجازه مالک فروشگاه لازم است.',
    AI_PROVIDER_UNAVAILABLE:'اتصال به سرویس مدل هوش مصنوعی ممکن نشد.',AI_PROVIDER_ERROR:'سرویس مدل به درخواست پاسخ نداد.'};
   const code=String(result?.error||'');throw Error(dictionary[code]||'دستیار آنلاین در دسترس نیست؛ وضعیت سرور را بررسی کنید.');
  }
  if(typeof result?.answer!=='string'||!result.answer.trim())throw Error('پاسخ معتبر از دستیار دریافت نشد.');
  return result.answer.slice(0,4000);
 }
 function init(win){
  const doc=win.document;if(doc.getElementById('z637AiPanel'))return;
  const button=doc.createElement('button');button.type='button';button.className='z637-ai-button';button.id='z637AiButton';button.setAttribute('aria-label','بازکردن دستیار ZAVI AI');button.setAttribute('aria-controls','z637AiPanel');button.setAttribute('aria-expanded','false');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/></svg>';
  const side=doc.createElement('button');side.type='button';side.id='z637AiSide';side.className='nav-btn z637-ai-side';side.textContent='✦ دستیار ZAVI AI';
  const nav=doc.querySelector('.zavi-v6-menu-scroll')||doc.querySelector('#sidebarLinks2');if(nav)nav.append(side);
  const backdrop=doc.createElement('div');backdrop.id='z637AiBackdrop';backdrop.className='z637-ai-backdrop';
  const panel=doc.createElement('section');panel.id='z637AiPanel';panel.className='z637-ai-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','دستیار ZAVI AI');panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<div class="z637-ai-head"><span class="z637-ai-logo" aria-hidden="true">✦</span><div class="z637-ai-heading"><strong>ZAVI AI ASSISTANT</strong><small>دستیار تجارت شما • دری / پشتو / English</small></div><button type="button" class="z637-ai-close" aria-label="بستن دستیار" id="z637AiClose">×</button></div><div class="z637-ai-modes"><button type="button" class="z637-ai-mode" data-ai-mode="local" aria-pressed="true">راهنمای آفلاین</button><button type="button" class="z637-ai-mode" data-ai-mode="online" aria-pressed="false">ZAVI AI آنلاین</button></div><div id="z637AiNotice" class="z637-ai-note">پاسخ آفلاین از قوانین و ارقام همان فروشگاه است؛ مدل زبانی نیست.</div><div class="z637-ai-messages" role="log" aria-live="polite" id="z637AiMessages"></div><div class="z637-ai-examples" id="z637AiExamples"></div><form class="z637-ai-form" id="z637AiForm"><label for="z637AiInput" class="sr-only">پرسش شما</label><textarea id="z637AiInput" class="z637-ai-input" aria-label="پرسش شما" rows="1" maxlength="750" placeholder="سؤال خود را بنویسید..." required></textarea><button type="submit" id="z637AiSend" class="z637-ai-send" aria-label="ارسال پرسش">➤</button></form>';
  doc.body.append(button,backdrop,panel);
  let mode='local',scope=null,busy=false;
  const msgs=panel.querySelector('#z637AiMessages'),input=panel.querySelector('#z637AiInput'),send=panel.querySelector('#z637AiSend'),notice=panel.querySelector('#z637AiNotice');
  function add(kind,value){const bubble=doc.createElement('div');bubble.className='z637-ai-msg';bubble.dataset.kind=kind;bubble.textContent=value;msgs.append(bubble);msgs.scrollTop=msgs.scrollHeight;}
  function refreshScope(){const newScope=(canRead(win)?win.zaviTenantKey?.():'NO_ACCESS')||'NO_ACCESS';if(newScope!==scope){scope=newScope;msgs.replaceChildren();add('assistant','سلام! من دستیار ZAVI ONE هستم. پرسش‌های عمومی را آفلاین پاسخ می‌دهم. برای ارقام مالی باید با حساب مالک همین فروشگاه وارد شوید.');}}
  function close(){panel.setAttribute('aria-hidden','true');button.setAttribute('aria-expanded','false');backdrop.dataset.open='false';button.focus()}
  function open(){if(doc.documentElement.classList.contains('zawi-locked'))return;refreshScope();updateSuggestions();panel.setAttribute('aria-hidden','false');button.setAttribute('aria-expanded','true');backdrop.dataset.open='true';input.focus();}
  button.addEventListener('click',()=>panel.getAttribute('aria-hidden')==='false'?close():open());side.addEventListener('click',open);panel.querySelector('#z637AiClose').addEventListener('click',close);backdrop.addEventListener('click',close);
  panel.querySelectorAll('[data-ai-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.aiMode;panel.querySelectorAll('[data-ai-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));notice.textContent=mode==='online'?'پرسش شما به Edge Function امن سرور مرکزی فرستاده می‌شود. فقط مالک مجاز است؛ اطلاعات محلی و سوابق گفتگو به سرویس ارسال نمی‌شود.':'حالت آفلاین: پاسخ‌های قواعدمحور، بدون تماس با سرویس AI یا ارسال اطلاعات.';}));
  function updateSuggestions(){
   const examples=panel.querySelector('#z637AiExamples');examples.replaceChildren();
   const suggestions=win.ZaviIndustryFocus?.questions(win.zaviActiveIndustry?.())||['امروز چقدر فروش داشتم؟','مفاد این ماه چقدر است؟','کدام اجناس کم‌موجود هستند؟','چگونه همکار اضافه کنم؟'];
   for(const text of suggestions){const b=doc.createElement('button');b.type='button';b.className='z637-ai-suggestion';b.textContent=text;b.addEventListener('click',()=>{input.value=text;panel.querySelector('#z637AiForm').requestSubmit();});examples.append(b);}
  }
  updateSuggestions();
  panel.querySelector('#z637AiForm').addEventListener('submit',async event=>{
   event.preventDefault();if(busy||doc.documentElement.classList.contains('zawi-locked'))return;refreshScope();const question=input.value.trim();if(!question)return;
   busy=true;send.disabled=true;input.value='';add('user',question);
   try{if(mode==='online'){add('assistant',await onlineAnswer(question,win));}
    else{const snapshot=win.zaviAIDataSnapshot?.();add('assistant',localAnswer(question,snapshot));}}
   catch(err){add('error',err?.message||'درخواست انجام نشد.');}
   finally{busy=false;send.disabled=false;input.focus();}
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();panel.querySelector('#z637AiForm').requestSubmit();}});
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.getAttribute('aria-hidden')==='false')close()});
  const observer=new MutationObserver(()=>{if(doc.documentElement.classList.contains('zawi-locked')){panel.setAttribute('aria-hidden','true');button.setAttribute('aria-expanded','false');backdrop.dataset.open='false';scope=null;msgs.replaceChildren();}});
  observer.observe(doc.documentElement,{attributes:true,attributeFilter:['class']});
  win.addEventListener('storage',e=>{if(['z20_workspace_id','z20_auth_session_persistent_v23_1'].includes(e.key)){scope=null;msgs.replaceChildren();}});
  return {open,close};
 }
 return Object.freeze({localAnswer,safeEndpoint,onlineAnswer,init});
});
