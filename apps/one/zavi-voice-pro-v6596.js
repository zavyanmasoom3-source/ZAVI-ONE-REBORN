/* ZAVI VOICE PRO 65.96 — progressive, owner/user opt-in speech interface.
 * Read-only navigation, local draft invoices, optional field dictation. Never posts a transaction.
 * Speech engine: browser SpeechRecognition or native Android recognize intent. Speech text
 * may be processed by the OS/browser recognizer, and is not guaranteed offline.
 */
(()=>{'use strict';
if(window.ZaviVoiceProV6596)return;
const APP='one',KEY='zavi.voice.pro.6596.'+APP;
const $=(s,p=document)=>p.querySelector(s);
const el=(tag,cl,txt)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=String(txt);return x};
const LANG={
 'fa-AF':{name:'دری افغانستان',welcome:'دستیار صوتی ZAVI ONE',start:'شروع صحبت',stop:'توقف',ready:'برای شنیدن، دکمه میکروفون را بزنید.',manual:'نوشتن دستور',execute:'بررسی دستور',confirm:'بازکردن بخش / تأیید',cancel:'لغو',voiceOff:'کنترل صوتی خاموش است.',on:'فعال‌سازی کنترل صوتی',off:'خاموش کردن کنترل صوتی',privacy:'میکروفون فقط با فشار دکمه فعال می‌شود. سرویس تشخیص گفتار دستگاه یا مرورگر ممکن است صدا را آنلاین پردازش کند؛ آفلاین تضمین نیست.',unsupported:'در این دستگاه تشخیص گفتار در دسترس نیست؛ می‌توانید دستور را تایپ کنید.',noaction:'دستور واضح تشخیص داده نشد. مثال: «بخش فروش را باز کن».',draft:'پیش‌نویس معامله (بدون ثبت)',review:'برای ثبت، معلومات را در فاکتور اصلی بازبینی و خودتان تأیید کنید.',safe:'فرمان صوتی هیچ پرداخت، خرید یا فروشی را خودکار ثبت نمی‌کند.',micError:'میکروفون در دسترس نیست یا مجوز داده نشده است.',read:'خواندن پاسخ',open:'بازکردن بخش',copy:'کاپی پیش‌نویس',copied:'پیش‌نویس کاپی شد.',settings:'تنظیمات صوتی',language:'زبان و لهجه',online:'تشخیص روی دستگاه/مرورگر؛ ممکن است به اینترنت نیاز داشته باشد.',listening:'در حال شنیدن…',help:'نمونه: «بخش فروش را باز کن»، «فروش پنج کیلو برنج به احمد»، «موجودی را نشان بده».',field:'نوشتن در فیلد انتخاب‌شده',nofield:'ابتدا یک خانۀ متن قابل ویرایش را انتخاب کنید.',goto:'برای ثبت، این صفحه را باز و معامله را دستی بازبینی کنید.',action:'پیشنهاد برنامه',sales:'فروش',purchase:'خرید',inventory:'گدام',customers:'مشتریان',debt:'قرضداران',reports:'گزارش‌ها',settingsPage:'تنظیمات',daily:'مدیریت روزمره',expenses:'مصارف',barcode:'بارکد',assistant:'دستیار',unknown:'دستور نامشخص',prompt:'متن گفتار',business:'کالاها',quantity:'مقدار',unit:'واحد',party:'طرف حساب',noMatch:'برای جلوگیری از خطا، نام جنس و مقدار را در فاکتور بررسی کنید.'},
 'ps-AF':{name:'پښتو افغانستان',welcome:'د ZAVI ONE غږیز مرستیال',start:'غږ پیل',stop:'بندول',ready:'د غږ لپاره مایکروفون کېکاږئ.',manual:'د امر لیکل',execute:'د امر کتل',confirm:'برخه پرانیستل',cancel:'لغوه',voiceOff:'غږیز کنټرول بند دی.',on:'غږیز کنټرول فعالول',off:'غږیز کنټرول بندول',privacy:'مایکروفون یوازې ستاسو په فشار فعالېږي؛ د وینا پېژندنه ښايي آنلاین وي.',unsupported:'په دې وسیله غږ نشته، امر ولیکئ.',noaction:'امر روښانه نه دی.',draft:'د معاملې مسوده (نه ثبت کېږي)',review:'اصلي بل کې یې وګورئ او بیا تایید کړئ.',safe:'غږ هېڅ مالي معامله په خپله نه ثبتوي.',micError:'مایکروفون یا اجازه نشته.',read:'ځواب لوستل',open:'برخه پرانیستل',copy:'مسوده کاپي',copied:'مسوده کاپي شوه.',settings:'غږ تنظیمات',language:'ژبه او لهجه',online:'د وسیلې/براوزر وینا پېژندنه، آنلاین کېدای شي.',listening:'اورېدنه روانه ده…',help:'بېلګه: «د پلور برخه خلاصه کړه»، «احمد ته پنځه کیلو وریجې وپلوره».',field:'ټاکلي خانه کې لیکل',nofield:'لومړی د متن خانه وټاکئ.',goto:'د ثبت لپاره اصلي صفحه وګورئ.',action:'برخه',sales:'پلور',purchase:'پېرود',inventory:'ګدام',customers:'پېرودونکي',debt:'پورونه',reports:'راپورونه',settingsPage:'تنظیمات',daily:'ورځني کارونه',expenses:'لګښتونه',barcode:'بارکوډ',assistant:'مرستیال',unknown:'نامعلوم امر',prompt:'د غږ متن',business:'توکي',quantity:'اندازه',unit:'واحد',party:'پېرودونکی/عرضه کوونکی',noMatch:'توکي او اندازه په اصلي بل کې تایید کړئ.'},
 'en-US':{name:'English (US)',welcome:'ZAVI VOICE PRO',start:'Speak now',stop:'Stop',ready:'Tap the microphone to start.',manual:'Type a command',execute:'Review command',confirm:'Open section / confirm',cancel:'Cancel',voiceOff:'Voice control is disabled.',on:'Enable voice commands',off:'Disable voice commands',privacy:'Microphone activates only on your tap. The device/browser speech service may process audio online; offline recognition is not guaranteed.',unsupported:'Speech recognition is unavailable; type your command instead.',noaction:'Command not recognized. Try “open sales”.',draft:'Transaction draft — NOT posted',review:'Review and confirm everything in the original invoice workflow.',safe:'Voice cannot automatically post sales, purchases or payments.',micError:'Microphone unavailable or permission denied.',read:'Speak response',open:'Open section',copy:'Copy draft',copied:'Draft copied.',settings:'Voice settings',language:'Language & accent',online:'Device/browser speech recognizer may require internet.',listening:'Listening…',help:'Try “open sales”, “sell five kilos of rice to Ahmad”, “show stock”.',field:'Insert into selected field',nofield:'Select an editable text field first.',goto:'Review this page before posting.',action:'Suggested section',sales:'Sales',purchase:'Purchases',inventory:'Inventory',customers:'Customers',debt:'Debtors',reports:'Reports',settingsPage:'Settings',daily:'Daily management',expenses:'Expenses',barcode:'Barcode',assistant:'Assistant',unknown:'Unknown command',prompt:'Recognized speech',business:'Items',quantity:'Quantity',unit:'Unit',party:'Customer/supplier',noMatch:'Verify product and quantity in the real invoice.'},
 'en-GB':{name:'English (UK)',welcome:'ZAVI VOICE PRO',start:'Speak now',stop:'Stop',ready:'Tap the microphone to begin.',manual:'Type a command',execute:'Review command',confirm:'Open section / confirm',cancel:'Cancel',voiceOff:'Voice control is disabled.',on:'Enable voice commands',off:'Disable voice commands',privacy:'The mic turns on only when you tap. Speech recognition may use an online service, not guaranteed offline.',unsupported:'No speech recognizer available; type a command.',noaction:'Command not recognized. Try “open sales”.',draft:'Transaction draft — NOT posted',review:'Review every detail in the original invoice workflow before posting.',safe:'Voice cannot automatically post financial transactions.',micError:'Microphone unavailable or permission denied.',read:'Read response aloud',open:'Open section',copy:'Copy draft',copied:'Draft copied.',settings:'Voice settings',language:'Language & accent',online:'Speech engine may require network.',listening:'Listening…',help:'Say “open purchases”, “sell 2 kilos of sugar to Ahmad”.',field:'Insert into selected field',nofield:'Select an editable field first.',goto:'Review before posting.',action:'Suggested section',sales:'Sales',purchase:'Purchases',inventory:'Inventory',customers:'Customers',debt:'Debtors',reports:'Reports',settingsPage:'Settings',daily:'Daily management',expenses:'Expenses',barcode:'Barcode',assistant:'Assistant',unknown:'Unknown command',prompt:'Recognized speech',business:'Items',quantity:'Quantity',unit:'Unit',party:'Customer/supplier',noMatch:'Check quantities and product names.'}
};
const LANG2={...LANG,'fa-IR':{...LANG['fa-AF'],name:'فارسی (لهجه ایران)'}};
const synonyms={
 sales:['فروش','فروخت','فروشم','بفروش','فاکتور فروش','سودا','پلور','وپلوره','وپلورم','خرڅ','خرڅلاو','sell','sale','sales'],
 purchase:['خرید','بخر','خریدم','خریدارى','پېرود','پیرود','واخله','اخیستل','buy','purchase','purchases'],
 inventory:['گدام','انبار','موجودی','ذخیره','جنس','توکي','سټاک','ګدام','stock','inventory','warehouse'],
 customers:['مشتری','مشتریان','خریدار','پیرودونکی','پېرودونکي','customers','customer'],
 debt:['قرض','قرضدار','بدهکار','نسیه','پور','پورونه','debtor','debt','receivables'],
 reports:['گزارش','راپور','حساب امروز','آمار','reports','report','summary'],
 settingsPage:['تنظیمات','تنظیم','سټینګ','تنظیمونه','settings','setting'],
 daily:['روزمره','روزانه','کارهای روزمره','ورځني کارونه','daily','dashboard'],
 expenses:['مصارف','مصرف','هزینه','خرج','لګښت','expenses','expense'],
 barcode:['بارکد','اسکن','سکن','بارکوډ','barcode','scan'],
 assistant:['هوش مصنوعی','دستیار','مرستیال','کمک','assistant','help','ai']
};
const readOnlyActions=['sales','purchase','inventory','customers','debt','reports','settingsPage','daily','expenses','barcode','assistant'];
const pageText={
 sales:['فروش','فاکتور فروش','پلور','sales','sale'],
 purchase:['خرید','فاکتور خرید','پېرود','purchase','buy'],
 inventory:['گدام','انبار','موجودی','ګدام','inventory','warehouse','stock'],
 customers:['مشتریان','مشتری','پېرودونکي','customers'],
 debt:['قرضداران','بدهکاران','پورونه','debtors','debts'],
 reports:['گزارش','راپور','report'],
 settingsPage:['تنظیمات','تنظیمونه','settings'],
 daily:['مدیریت روزمره','کارهای روزمره','ورځني کارونه','daily management'],
 expenses:['مصارف','لګښتونه','expenses'],
 barcode:['بارکد','بارکوډ','barcode'],
 assistant:['دستیار','مرستیال','assistant']
};
function clean(x){return String(x||'').toLowerCase().normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإآ]/g,'ا').replace(/ۀ/g,'ه').replace(/[\u064b-\u065f\u0670\u200c\u200f]/g,'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\p{L}\p{N}.+\-\s]/gu,' ').replace(/\s+/g,' ').trim()}
const digits={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,half:.5,'نیم':.5,'يک':1,'یک':1,'دو':2,'سه':3,'چهار':4,'پنج':5,'شش':6,'هفت':7,'هشت':8,'نه':9,'ده':10,'یو':1,'يو':1,'دوه':2,'درې':3,'دری':3,'څلور':4,'پنځه':5,'شپږ':6,'اووه':7,'اته':8,'نهه':9,'لس':10};
const unitPattern='کیلوگرم|کیلوگرام|کیلو|کيلو|کيلوګرام|ګرام|گرم|گرام|سیر|بوتل|بوتلونه|کارتن|بسته|عدد|دانه|قطعه|متر|لیتر|لتر|کيلو|kg|kilo|kilos|grams?|bottles?|cartons?|packs?|pieces?|liters?|litres?';
const units=Object.freeze({'کیلوگرم':'kg','کیلوگرام':'kg','کیلو':'kg','کيلو':'kg','کيلوګرام':'kg','kilo':'kg','kilos':'kg','kg':'kg','گرام':'g','گرم':'g','ګرام':'g','gram':'g','grams':'g','بوتل':'bottle','بوتلونه':'bottle','bottle':'bottle','bottles':'bottle','کارتن':'carton','carton':'carton','cartons':'carton','سیر':'seer','عدد':'piece','دانه':'piece','pieces':'piece','piece':'piece','liters':'litre','litres':'litre'});
function transactionType(text){
 if(/^(?:فروش|بفروش|فروخت|فروشم|پلور|وپلوره|وپلورم|خرڅلاو|sell|sale)(?:\s|$)/.test(text))return 'sales';
 if(/^(?:خرید|بخر|پېرود|پیرود|واخله|buy|purchase)(?:\s|$)/.test(text))return 'purchase';
 return null
}
function parseDraft(raw){
 const normalized=clean(raw),type=transactionType(normalized);
 if(!type)return null;
 let text=normalized.replace(/^(?:فروش|بفروش|فروخت|فروشم|پلور|وپلوره|وپلورم|خرڅلاو|sell|sale|خرید|بخر|پېرود|پیرود|واخله|buy|purchase)\s*/,'');
 let party='';
 const partyMatch=text.match(/(?:\s(?:به|از|برای|ته|له|to|from)\s+)([\p{L}\p{M}\s]{1,45})$/u);
 if(partyMatch){party=partyMatch[1].trim();text=text.slice(0,partyMatch.index).trim()}
 text=text.replace(/^(?:یک|يو|یو|one)\s+/,'1 ');
 const lines=[];
 const chunks=text.split(/\s+(?:و|او|and)\s+/);
 for(const c of chunks.slice(0,12)){
  let m=c.match(new RegExp('^(\\d+(?:\\.\\d+)?|'+Object.keys(digits).sort((a,b)=>b.length-a.length).join('|')+')\\s*('+unitPattern+')?\\s+(.{1,85})$','u'));
  if(!m){m=c.match(new RegExp('^(.{1,85}?)\\s+(\\d+(?:\\.\\d+)?|'+Object.keys(digits).join('|')+')\\s*('+unitPattern+')?$','u'));if(m){const item=m[1],amount=m[2],unit=m[3];m=[c,amount,unit,item]}}
  if(m){
   const qty=Number.isFinite(+m[1])?+m[1]:digits[m[1]];
   if(!Number.isFinite(qty)||qty<=0||qty>100000)continue;
   const product=String(m[3]||'').trim();
   if(product&&product.length<=85)lines.push({quantity:qty,unit:units[m[2]]||m[2]||'piece',product});
  } else if(c.trim().length>2 && c.trim().length<85){
   lines.push({quantity:null,unit:null,product:c.trim()});
  }
 }
 return {type,party,items:lines,original:String(raw).slice(0,500),status:'DRAFT_ONLY'};
}
function route(raw){
 const n=clean(raw);
 if(/(?:حذف|پاک کن|پاککردن|مسح|delete|erase|remove|reset account|ړنګ)/.test(n))return {kind:'unknown',source:raw};
 const draft=parseDraft(raw);
 if(draft&&draft.items.length)return {kind:'draft',key:draft.type,draft,source:raw};
 const likely=n.replace(/^(?:باز کن|نمایش بده|نشان بده|بخش|صفحه|برو به|ورکړه|خلاصه کړه|open|show|go to|navigate to|list)\s+/,'');
 let best=null,bestScore=0;
 for(const key of readOnlyActions)for(const word of synonyms[key]){
  const term=clean(word);if(!term)continue;
  if(likely===term||likely===clean('بخش '+word)||likely===clean('صفحه '+word)){return {kind:'navigate',key,source:raw}}
  if(likely.includes(term)&&term.length>=3){const score=term.length;if(score>bestScore){bestScore=score;best=key}}
 }
 if(best)return {kind:'navigate',key:best,source:raw};
 // Arbitrary but SAFE page navigation: only match existing navigation elements.
 const match=n.match(/^(?:باز کن|برو به|نشان بده|نمایش بده|بخش|صفحه|خلاصه کړه|پرانيزه|خلاصه|open|show|go to|navigate to)\s+(.{2,65})$/u)
 ||n.match(/^(?:بخش|صفحه)\s+(.{2,65}?)\s+(?:را\s+)?(?:باز کن|نشان بده|نمایش بده)$/u);
 if(match)return {kind:'navigate_label',label:match[1],source:raw};
 return {kind:'unknown',source:raw};
}
function visible(n){if(!n?.isConnected||n.disabled||n.closest('[hidden],[aria-hidden="true"]'))return false;const r=n.getBoundingClientRect();return r.width>0&&r.height>0}
function allowedSection(n){return n?.matches?.('button[data-page],a[data-page],.nav-btn,.nav-item,[role="tab"],button[onclick*="goPage"],a[href^="#"]')&&!n.closest('#z196-voice,#z141-center,#z139-dialog')}
function matchingNavLabel(label){
 const expected=clean(label).replace(/^بخش\s+|^صفحه\s+/,''),menu=[...document.querySelectorAll('button[data-page],a[data-page],.nav-btn,.nav-item,[role="tab"],button[onclick*="goPage"],a[href^="#"]')];
 return menu.find(n=>visible(n)&&allowedSection(n)&&[
  n.textContent,n.getAttribute('aria-label'),n.getAttribute('title'),n.getAttribute('data-page')
 ].some(x=>{const title=clean(x||'');return title===expected||title.startsWith(expected+' ')||expected.startsWith(title+' ')&&title.length>=3}))||null
}
function matchingNav(key){
 const options=[...document.querySelectorAll('button[data-page],a[data-page],.nav-btn,.nav-item,[role="tab"],button[onclick*="goPage"],a[href^="#"]')].filter(x=>visible(x)&&allowedSection(x));
 const aliases=pageText[key].map(clean);
 for(const item of options){
  const title=clean([item.textContent,item.getAttribute('data-page'),item.getAttribute('aria-label'),item.getAttribute('title')].filter(Boolean).join(' '));
  if(aliases.some(x=>title===x||title.includes(x)&&x.length>=4))return item
 }
 return null
}
const state={enabled:false,lang:'fa-AF',panel:null,recognition:null,fromNative:false,listening:false,last:null,field:null};
function copyFor(){return LANG2[state.lang]||LANG2['fa-AF']}
function readState(){
 try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');state.enabled=p.enabled===true;state.lang=Object.prototype.hasOwnProperty.call(LANG2,p.lang)?p.lang:'fa-AF'}catch(_){}
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({enabled:state.enabled,lang:state.lang}))}catch(_){}}
function speech(){return window.SpeechRecognition||window.webkitSpeechRecognition}
function speak(content){
 if(!window.speechSynthesis)return;
 window.speechSynthesis.cancel();
 const utter=new SpeechSynthesisUtterance(String(content||'').slice(0,480));utter.lang=state.lang;utter.rate=.9;
 window.speechSynthesis.speak(utter)
}
function stop(){
 try{state.recognition?.abort()}catch(_){}state.recognition=null;
 state.listening=false;const b=$('#z196-mic');if(b)b.textContent=copyFor().start;
 const info=$('#z196-status');if(info&&info.textContent===copyFor().listening)info.textContent=copyFor().ready
}
function setResult(result){
 stop();const input=$('#z196-input');if(input)input.value=String(result||'').slice(0,500);analyse();
}
window.ZaviVoiceBridgeResult=(text,error)=>{
 if(!state.enabled||!state.panel||state.panel.hidden)return;
 if(error){stop();showStatus(copyFor().micError);return}
 setResult(text)
};
function start(){
 if(!state.enabled){showStatus(copyFor().voiceOff);return}
 if(!window.isSecureContext){showStatus(copyFor().unsupported);return}
 if(state.listening){stop();return}
 if(window.ZaviAndroidVoice?.postMessage){
  state.listening=true;$('#z196-mic').textContent=copyFor().stop;showStatus(copyFor().listening);
  try{window.ZaviAndroidVoice.postMessage(JSON.stringify({op:'recognize',language:state.lang,prefer_offline:false}));return}catch(_){state.listening=false}
 }
 const R=speech();if(!R){showStatus(copyFor().unsupported);return}
 let rec;try{rec=new R();rec.lang=state.lang;rec.maxAlternatives=2;rec.interimResults=false;rec.continuous=false;
 rec.onresult=e=>setResult(e.results?.[0]?.[0]?.transcript||'');
 rec.onerror=()=>{stop();showStatus(copyFor().micError)};
 rec.onend=()=>{if(state.recognition===rec)stop()};
 state.recognition=rec;rec.start();state.listening=true;$('#z196-mic').textContent=copyFor().stop;showStatus(copyFor().listening);
 }catch(_){stop();showStatus(copyFor().unsupported)}
}
function showStatus(s){const v=$('#z196-status');if(v)v.textContent=s}
function isAppVisible(){
 const app=$('#appScreen');
 if(app){return !app.hidden&&getComputedStyle(app).display!=='none'}
 return !!$('#main,#content,.app-shell,#side') && !$('#loginScreen:not([hidden])')
}
function fillFocused(){
 const target=state.field;
 if(!target||!target.isConnected||!visible(target)||target.readOnly||target.disabled||!target.matches('input:not([type=number]):not([type=password]):not([type=hidden]):not([type=submit]),textarea,[contenteditable=true]'))return showStatus(copyFor().nofield);
 const text=$('#z196-input')?.value?.trim();if(!text||text.length>500)return;
 if(target.isContentEditable)target.textContent=text;
 else {target.value=text;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}))}
 showStatus(copyFor().review);target.focus({preventScroll:true})
}
function analyse(){
 const raw=$('#z196-input')?.value?.trim()||'';
 state.last=raw?route(raw):null;
 const area=$('#z196-preview');if(!area)return;
 area.replaceChildren();
 if(!state.last)return;
 const w=copyFor(),res=state.last;
 if(res.kind==='unknown'){area.append(el('p','z196-note',w.noaction));return}
 area.append(el('strong','',res.kind==='draft'?w.draft:w.action));
 if(res.kind==='draft'){
  const box=el('div','z196-lines');
  box.append(el('p','',w.action+': '+w[res.key]));
  if(res.draft.party)box.append(el('p','',w.party+': '+res.draft.party));
  res.draft.items.forEach(item=>box.append(el('p','',item.product+' · '+(item.quantity??'؟')+' '+(item.unit||'؟'))));
  area.append(box,el('p','z196-note',w.noMatch),el('p','z196-warning',w.safe))
 }else area.append(el('p','',w.open+': '+w[res.key]));
 const actions=el('div','z196-actions');
 const open=el('button','z196-confirm',w.confirm);open.type='button';open.addEventListener('click',()=>{
  if(!state.enabled||!isAppVisible()){showStatus(w.voiceOff);return}
  const node=res.kind==='navigate_label'?matchingNavLabel(res.label):matchingNav(res.key);
  if(!node){showStatus(w.goto+' — '+w[res.key]);return}
  state.panel.hidden=true;node.click();
  if(res.kind==='draft'){showStatus(w.review)}
 });
 const cpy=el('button','',w.copy);cpy.type='button';cpy.addEventListener('click',()=>{
  const content=res.kind==='draft'?JSON.stringify(res.draft,null,2):raw;
  if(!navigator.clipboard?.writeText)return showStatus(w.unsupported);
  navigator.clipboard.writeText(content).then(()=>showStatus(w.copied)).catch(()=>showStatus(w.unsupported))
 });
 actions.append(open,cpy);area.append(actions)
}
function draw(){
 if(!state.panel)return;const w=copyFor();
 $('#z196-title').textContent=w.welcome;
 $('#z196-settings').textContent=w.settings;
 $('#z196-privacy').textContent=w.privacy;
 $('#z196-toggle').textContent=state.enabled?w.off:w.on;
 $('#z196-mic').textContent=state.listening?w.stop:w.start;
 $('#z196-mic').disabled=!state.enabled;
 $('#z196-lang-label').textContent=w.language;
 $('#z196-lang').value=state.lang;
 $('#z196-field').textContent=w.field;
 $('#z196-field').disabled=!state.enabled;
 $('#z196-run').textContent=w.execute;
 $('#z196-run').disabled=!state.enabled;
 $('#z196-input').placeholder=w.manual;
 $('#z196-help').textContent=w.help;
 $('#z196-status').textContent=state.enabled?w.ready:w.voiceOff;
 analyse()
}
function close(){stop();if(state.panel)state.panel.hidden=true;window.speechSynthesis?.cancel()}
function build(){
 const shell=el('div','z196-overlay');shell.id='z196-voice';shell.hidden=true;
 const modal=el('section','z196-modal');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','ZAVI Voice Pro');
 const h=el('header','z196-header');const title=el('h2');title.id='z196-title';
 const exit=el('button','z196-close','×');exit.type='button';exit.setAttribute('aria-label','Close');exit.addEventListener('click',close);h.append(title,exit);
 const tool=el('div','z196-toolbar'),toggle=el('button');toggle.id='z196-toggle';toggle.type='button';toggle.addEventListener('click',()=>{state.enabled=!state.enabled;if(!state.enabled)stop();persist();draw()});
 const label=el('label','z196-label');label.id='z196-lang-label';const select=el('select');select.id='z196-lang';
 Object.keys(LANG2).forEach(x=>select.append(new Option(LANG2[x].name,x)));
 select.addEventListener('change',()=>{state.lang=select.value;persist();draw()});label.append(select);
 tool.append(toggle,label);
 const mic=el('button','z196-mic');mic.id='z196-mic';mic.type='button';mic.addEventListener('click',start);
 const info=el('p','z196-status');info.id='z196-status';info.setAttribute('role','status');
 const prompt=el('textarea');prompt.id='z196-input';prompt.rows=3;prompt.maxLength=500;prompt.addEventListener('input',()=>{state.last=null;analyse()});
 const actions=el('div','z196-actions');
 const run=el('button');run.id='z196-run';run.type='button';run.addEventListener('click',analyse);
 const field=el('button');field.id='z196-field';field.type='button';field.addEventListener('click',fillFocused);
 const say=el('button','', '🔊');say.type='button';say.setAttribute('aria-label','Read aloud');say.addEventListener('click',()=>speak($('#z196-preview')?.textContent||$('#z196-input').value));
 actions.append(run,field,say);
 const preview=el('section','z196-preview');preview.id='z196-preview';
 const privacy=el('p','z196-privacy');privacy.id='z196-privacy';
 const example=el('p','z196-note');example.id='z196-help';
 const settings=el('span');settings.id='z196-settings';
 modal.append(h,tool,mic,info,prompt,actions,preview,example,privacy);shell.append(modal);
 shell.addEventListener('click',e=>{if(e.target===shell)close()});
 document.body.append(shell);state.panel=shell;draw()
}
function open(){if(!isAppVisible())return;if(!state.panel)build();state.panel.hidden=false;draw()}
function install(){
 if($('#z196-launch'))return;
 const anchor=$('#appScreen .topbar')||$('#appScreen .sidebar .nav')||$('#side');
 if(!anchor)return;
 const b=el('button','z196-launch','🎙️ ZAVI VOICE');b.id='z196-launch';b.type='button';b.setAttribute('aria-label','Voice commands');
 b.addEventListener('click',open);anchor.append(b)
}
function init(){
 readState();install();
 document.addEventListener('focusin',e=>{const n=e.target;if(n&&n.matches?.('input:not([type=password]):not([type=number]):not([type=hidden]),textarea,[contenteditable=true]')&&!n.closest('#z196-voice'))state.field=n});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.panel&&!state.panel.hidden)close()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 window.addEventListener('pagehide',stop);
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;install()})}).observe(document.body,{childList:true,subtree:false});
}
window.ZaviVoiceProV6596=Object.freeze({route,parseDraft,normalize:clean,open,stop,version:'65.96',app:APP});
if(!window.__zaviLocalOnly){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})();
