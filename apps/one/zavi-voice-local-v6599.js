/* ZAVI VOICE LISTEN ONLY 66.03 / 1.4.49: own lightweight screen & local-only Android bridge.
   Transcription uses bundled whisper.cpp, not Google / Android SpeechRecognizer.
   Navigation is immediate. Financial instructions are preview-only: never submit.
*/
(()=>{'use strict';
 if(window.ZaviVoiceLocal6599)return;
 if(window.__zaviDual605)return;
 const ADMIN=!!document.querySelector('script[src*="zavi-voice-admin-v1442.js"]');
 const KEY='zavi.local.voice.6599.'+(ADMIN?'admin':'one');
 const L={
  fa:{loading:'در حال آماده‌کردن موتور صدا...',heard:'صدا دریافت شد',no_audio:'صدایی تشخیص داده نشد؛ نزدیک میکروفون صحبت کنید.',unrecognized:'صدا دریافت شد اما کلمات واضح نبود؛ دوباره بگویید.',title:'ZAVI VOICE',enabled:'دستیار روشن است',off:'دستیار خاموش است',start:'فعال‌کردن صدا',stop:'خاموش‌کردن صدا',listening:'گوش می‌دهم؛ صحبت کنید',working:'در حال فهمیدن صحبت شما',lang:'زبان',example:'مثلاً: «بخش فروش را باز کن»',confirm:'بازکردن فاکتور برای بررسی',cancel:'لغو',draft:'پیش‌نویس معامله — ثبت نشده',review:'برای ثبت نهایی، نام کالا، قیمت، موجودی و مشتری را در فاکتور اصلی تأیید کنید.',unknown:'دستور واضح نبود؛ دوباره بگویید.',permission:'اجازه میکروفون را فعال کنید.',unavailable:'مدل صوتی محلی در این نسخه در دسترس نیست؛ مدل صوتی محلی نیاز به بررسی دارد',error:'دستیار صوتی موقتاً در دسترس نیست.',closed:'بستن',ready:'برای شروع، دکمه روشن‌کردن را بزنید.',navigated:'بخش باز شد',safe:'عملیات مالی بدون تأیید نهایی ثبت نمی‌شود.'},
  ps:{loading:'غږیز موتور چمتو کېږي...',heard:'ستاسې غږ ترلاسه شو',no_audio:'غږ نه اورم؛ مایکروفون ته نږدې خبرې وکړئ.',unrecognized:'غږ واورېدل شو، خو خبرې روښانه نه وې؛ بیا یې ووایئ.',title:'ZAVI VOICE',enabled:'مرستیال فعال دی',off:'مرستیال بند دی',start:'غږ فعال کړئ',stop:'غږ بند کړئ',listening:'اورم؛ خبرې وکړئ',working:'ستاسې خبرې پېژنم',lang:'ژبه',example:'ووایئ: «د پلور برخه خلاصه کړه»',confirm:'اصلي بل ته د کتنې لپاره لاړ شئ',cancel:'لغوه',draft:'د معاملې مسوده — نه ده ثبت شوې',review:'د توکو، بیې او پېرودونکي جزیات په اصلي بل کې تایید کړئ.',unknown:'امر نه پېژنم؛ بیا یې ووایئ.',permission:'مایکروفون ته اجازه ورکړئ.',unavailable:'سیمه‌ییز غږیز ماډل نشته؛ مدل صوتی محلی نیاز به بررسی دارد',error:'غږیز مرستیال اوس کار نه کوي.',closed:'بندول',ready:'د غږ لپاره تڼۍ کېکاږئ.',navigated:'برخه پرانیستل شوه',safe:'مالي معامله له وروستي تایید پرته نه ثبتېږي.'},
  en:{loading:'Loading local voice model...',heard:'Sound detected',no_audio:'No voice detected. Speak closer to the microphone.',unrecognized:'Sound heard, words unclear. Please repeat.',title:'ZAVI VOICE',enabled:'Assistant is on',off:'Assistant is off',start:'Enable voice',stop:'Turn voice off',listening:'Listening — speak now',working:'Understanding speech',lang:'Language',example:'Say “open sales” or “show inventory”',confirm:'Open invoice for review',cancel:'Cancel',draft:'Transaction draft — not posted',review:'Review the product, price, stock and customer in the original invoice before posting.',unknown:'Command not clear; repeat.',permission:'Allow microphone access.',unavailable:'Local voice model is not available here; verify local voice model',error:'Voice engine unavailable.',closed:'Close',ready:'Tap Enable voice to begin.',navigated:'Section opened',safe:'Financial changes need final confirmation.'}
 };
 const names={'fa-AF':'دری افغانستان','ps-AF':'پښتو افغانستان','en-GB':'English'};
 const state={enabled:false,lang:'fa-AF',active:false,working:false,starting:false,root:null,last:'',pending:null,status:'',native:false,lastCommand:'',lastAt:0,noticeUntil:0};
 const $=(s,p=document)=>p.querySelector(s);
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
 const t=()=>L[state.lang.startsWith('ps')?'ps':state.lang.startsWith('en')?'en':'fa'];
 const avail=()=>!!window.ZaviAndroidLocalVoice?.postMessage;
 function auth(){
  const s=$('#appScreen'),login=$('#loginScreen');
  const visible=x=>!!x&&!x.hidden&&getComputedStyle(x).display!=='none';
  if(ADMIN)return visible(s)&&window.ZaviAdminAPI?.getMode?.()==='live';
  return !(login&&visible(login))&&((s&&visible(s))||visible($('#content')));
 }
 function save(){try{localStorage.setItem(KEY,JSON.stringify({enabled:state.enabled,lang:state.lang}))}catch(_){}}
 function restore(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');state.enabled=p.enabled===true;state.lang=names[p.lang]?p.lang:'fa-AF'}catch(_){}}
 function publishStatus(message){state.status=message;draw()}
 function native(op){if(!avail())return false;try{window.ZaviAndroidLocalVoice.postMessage(JSON.stringify({op,language:state.lang}));return true}catch(_){return false}}
 function stop(){native('stop');state.active=false;state.working=false;state.starting=false;draw()}
 function toggle(){if(!auth())return;
  if(state.enabled){state.enabled=false;stop();save();publishStatus(t().off)}
  else{state.enabled=true;save();if(!avail()){state.enabled=false;save();publishStatus(t().unavailable);return}
   state.status=t().working;state.starting=true;if(!native('start')){state.starting=false;state.enabled=false;save();publishStatus(t().unavailable)}else draw()}
 }
 function normalize(s){return String(s||'').replace(/[\u200c\u200e\u200f]/g,'').trim().toLowerCase();}
 const YES=/^(تایید|تأیید|تایید کن|تأیید کن|بلی|بله|هو|تایید کړه|confirm|yes|okay|ok)$/u;
 const NO=/^(لغو|لغوه|نخیر|نه|no|cancel|stop)$/u;

 function visible(n){return !!n&&n.isConnected&&!n.disabled&&!n.closest('#z199-voice,#z196-voice,#z198-easy')}
 // On small Android screens the sidebar can be display:none; its real data-go
 // controls still own the app's delegated click handlers. Do not reject them
 // as invisible or sales/inventory/reports will never open from voice.
 const routes=ADMIN?{
  dashboard:'overview',daily:'overview',reports:'finance',customers:'customers',subscriptions:'customers',support:'support',
  devices:'devices',billing:'payments',communications:'support',audit:'activity',releases:'brand',settingsPage:'settings',
  finance:'finance',payments:'payments',activity:'activity',health:'health',brand:'brand',security:'security'
 }:{
  dashboard:'dashboard',daily:'dashboard',sales:'sales',purchase:'purchases',inventory:'products',customers:'contacts',
  debt:'debtors',reports:'reports',settingsPage:'settings',expenses:'expenses',barcode:'products',assistant:'dashboard',
  money:'money',hawala:'hawala',creditors:'creditors',phonebook:'phonebook',journal:'journal',waste:'waste',
  repairs:'repairs',subscriptions:'subscription',products:'products'
 };
 const extras={
  products:['محصول','کالا','اجناس','توکي','product','item'],phonebook:['دفترچه','تماس','phonebook'],
  money:['دریافت','پرداخت','نقدی','cash','receipt','payment'],hawala:['حواله','remittance'],
  journal:['روزنامچه','journal','ledger'],creditors:['قرض های ما','بدهی ما','creditor'],waste:['ضایعات','waste'],
  repairs:['تعمیرات','repairs'],dashboard:['داشبورد','dashboard','home'],billing:['مالی','finance','payment'],
  devices:['دستگاه','device'],audit:['تاریخچه','audit','activity'],subscriptions:['اشتراک','subscription'],
  finance:['مالی','finance','revenue'],payments:['پرداخت','payments'],activity:['فعالیت','activity'],
  health:['سلامت','وضعیت سیستم','health'],brand:['برند','brand'],security:['امنیت','security'],
  communications:['پیام','message','communications'],support:['پشتیبانی','support'],
  customers:['مشتریان','پېرودونکي','customers'],settingsPage:['تنظیمات','settings']
 };
 function cleanLabel(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f\u0670\u200c\u200e\u200f\u0640]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإآ]/g,'ا').replace(/[ۀة]/g,'ه').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim()}

 const VOICE_NAV_VERBS=/(?:^|\s)(?:باز|بکن|بکنی|بازکو|کو|برو|بیار|بیارید|نمایش|نشان|صفحه|بخش|بازکن|open|show|go|navigate|خلاص|پرانيزه|خلاصه|وښیه|راوړه|ورشه|ښکاره)(?:\s|$)/u;
 const namedTargets={
  dashboard:['داشبورد','خانه','صفحه اصلی','کور','ډشبورډ','home','dashboard'],
  sales:['فروش','فروشی','فروخت','خرڅلاو','پلور','پلورلو','sale','sales'],
  purchase:['خرید','خریداری','پیرود','پېرود','پیرودل','buy','purchase','purchases'],
  inventory:['گدام','گدوم','انبار','موجودی','ګدام','اجناس','توکي','stock','inventory','warehouse','products'],
  customers:['مشتری','مشتریان','مشتری ها','پېرودونکي','پیرودونکي','customers','contacts'],
  debt:['قرضدار','قرضداران','بدهکار','بدهکاران','پور','پورونه','debtors','debts'],
  reports:['گزارش','گزارشات','راپور','راپورونه','reports','report'],
  settingsPage:['تنظیمات','تنظیم','تنظیمونه','settings'],
  daily:['مدیریت روزمره','کارهای روزمره','روزمره','ورځني کارونه','daily'],
  barcode:['بارکد','بار کود','بارکوډ','barcode'],
  expenses:['مصارف','مصرف','هزینه','لګښتونه','expense','expenses'],
  billing:['مالی','پرداخت','پرداخت ها','رسید','عاید','finance','billing','payments'],
  subscriptions:['اشتراک','اشتراکات','تمدید','subscription'],
  devices:['دستگاه','دستگاه ها','وسایل','device','devices'],
  support:['پشتیبانی','حمایت','ملاتړ','support'],
  audit:['فعالیت','فعالیت ها','تاریخچه','activity','audit'],
  communications:['پیام','پیامها','پیغام','messages','communications'],
  finance:['درامد','درآمد','عاید','finance','revenue'],
  payments:['پرداخت','تمدید','payment','payments'],
  health:['سلامت سیستم','وضعیت سیستم','health'],
  security:['امنیت','امنیتی','security'],
  brand:['برند','brand']
 };
 function distanceOne(a,b){
  if(a===b)return true;
  if(Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,d=0;
  while(i<a.length&&j<b.length){
   if(a[i]===b[j]){i++;j++;continue}
   if(++d>1)return false;
   if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}
  }
  return d+(i<a.length?1:0)+(j<b.length?1:0)<=1;
 }
 function dialectNavigation(raw){
  const normalized=cleanLabel(raw);
  if(!normalized||normalized.length>120)return null;
  const hasNavVerb=VOICE_NAV_VERBS.test(normalized);
  const matches=[];
  for(const [key,labels] of Object.entries(namedTargets)){
   if(!Object.prototype.hasOwnProperty.call(routes,key))continue;
   const aliases=[key,...labels].map(cleanLabel).filter(x=>x.length>=3);
   for(const word of aliases){
    if(normalized===word||hasNavVerb&&(normalized===word||normalized.includes(' '+word+' ')||normalized.startsWith(word+' ')||normalized.endsWith(' '+word))){
     matches.push({key,score:word.length+100+(word===key?50:0)});break;
    }
    if(hasNavVerb&&word.length>=5){
      const tokens=normalized.split(' ').filter(Boolean);
      if(tokens.some(x=>x.length>=5&&distanceOne(x,word))){matches.push({key,score:word.length});break}
    }
   }
  }
  if(!matches.length)return null;
  matches.sort((a,b)=>b.score-a.score);
  // If two different modules are similarly plausible, don't execute anything.
  if(matches.length>1&&matches[0].score===matches[1].score)return null;
  return {kind:'navigate',key:matches[0].key,source:raw};
 }

 function navFor(r){
  // Only click authentic navigation elements; never click arbitrary Save/Delete/Pay buttons.
  const id=routes[r.key];
  const candidates=[...document.querySelectorAll('#sidebarLinks [data-go],#sidebarLinks2 [data-go],#mobileBottom [data-go],#side [data-go],#appScreen .nav [data-page],#appScreen .sidebar [data-page],.nav-btn[data-go],.nav-item[data-page]')].filter(n=>visible(n)&&!n.closest('#z199-voice,#z196-voice,#z198-easy'));
  if(id){
   const exact=candidates.find(n=>(n.dataset.go||n.dataset.page)===id);
   if(exact)return exact;
  }
  if(r.kind!=='navigate_label'&&!extras[r.key])return null;
  const aliases=(r.kind==='navigate_label'?[r.label]:(extras[r.key]||[])).map(cleanLabel).filter(x=>x.length>2);
  return candidates.find(n=>{
   const label=cleanLabel([n.textContent,n.getAttribute('aria-label'),n.getAttribute('title')].filter(Boolean).join(' '));
   return aliases.some(a=>label===a||label.startsWith(a+' ')||label.endsWith(' '+a));
  })||null;
 }
 function action(result){
  const target=navFor(result);
  if(!target){state.noticeUntil=Date.now()+4500;publishStatus(t().unknown);return false}
  target.click();
  // Without hiding the panel, users think the page has not opened.
  if(state.root)state.root.hidden=true;
  publishStatus(t().navigated);
  return true;
 }
 function interpret(words){
  if(!auth())return;
  const text=String(words||'').trim().slice(0,350);
  if(!text){state.noticeUntil=Date.now()+3500;publishStatus(t().unrecognized);return}
  const n=normalize(text);
  const now=Date.now();
  if(n===state.lastCommand&&now-state.lastAt<4500)return;
  state.lastCommand=n;state.lastAt=now;state.last=text;
  if(state.pending && YES.test(n)){const pending=state.pending;state.pending=null;action({kind:'navigate',key:pending.key});draw();return}
  if(state.pending && NO.test(n)){state.pending=null;publishStatus(t().ready);return}
  const cleaned=text.replace(/^(?:ای|هی|hey|ok|okay)?\s*(?:زاوی|زاوي|zavi|zavy|زاوی وان)[،,\s:]*/iu,'').trim()||text;
  const command=cleaned.replace(/^(?:ثبت|ایجاد|انجام|record|create)\s+(?=فروش|خرید|sell|sale|buy|purchase)/iu,'');
  // Never interpret destructive requests as ordinary navigation.
  if(/(?:حذف|پاک\s*کن|نابود|delete|erase|reset|ړنګ|لرې\s*کړه)/iu.test(cleanLabel(command))){
   state.pending=null;state.noticeUntil=Date.now()+4500;publishStatus(t().unknown);return;
  }
  let result=dialectNavigation(command)||window.ZaviVoiceProV6596?.route?.(command);
  // Use the exact authenticated app navigation, not guessed buttons.
  if(result?.kind==='unknown'||!result){
   const n=cleanLabel(command);
   for(const [key,aliases] of Object.entries(extras)){
    if([key,...aliases].some(a=>cleanLabel(a)===n)){
     result={kind:'navigate',key};break;
    }
   }
  }
  if(!result||result.kind==='unknown'){state.pending=null;state.noticeUntil=Date.now()+4500;publishStatus(t().unknown);return}
  if(result.kind==='draft'){
   state.pending={key:result.key,draft:result.draft};
   publishStatus(t().draft);return
  }
  if(result.kind==='navigate'||result.kind==='navigate_label'){state.pending=null;action(result);return}
  publishStatus(t().unknown)
 }
 function draw(){
  if(!state.root)return;const w=t(),root=state.root;
  $('#z199-title',root).textContent=w.title;
  $('#z199-close',root).setAttribute('aria-label',w.closed);
  $('#z199-label',root).textContent=w.lang;
  $('#z199-locale',root).value=state.lang;
  $('#z199-toggle',root).textContent=state.enabled?w.stop:w.start;
  $('#z199-toggle',root).setAttribute('aria-pressed',String(state.enabled));
  $('#z199-toggle',root).classList.toggle('on',state.enabled);
  $('#z199-status',root).textContent=state.status||(state.working?w.working:state.active?w.listening:state.enabled?w.enabled:w.ready);
  $('#z199-note',root).textContent=state.pending?w.review:w.example;
  const transcript=$('#z199-transcript',root);transcript.hidden=!state.last;transcript.textContent=state.last;
  const preview=$('#z199-preview',root);preview.replaceChildren();
  if(state.pending){
   const d=state.pending.draft;
   preview.append(el('strong','',w.draft));
   if(d.party)preview.append(el('div','z199-party',d.party));
   d.items.slice(0,12).forEach(x=>preview.append(el('div','z199-line',x.product+' · '+(x.quantity??'?')+' '+(x.unit||''))));
   const buttons=el('div','z199-actions'),confirm=el('button','z199-confirm',w.confirm),cancel=el('button','z199-cancel',w.cancel);
   confirm.type=cancel.type='button';
   confirm.addEventListener('click',()=>{const k=state.pending?.key;state.pending=null;if(k)action({kind:'navigate',key:k});draw()});
   cancel.addEventListener('click',()=>{state.pending=null;draw()});
   buttons.append(confirm,cancel);preview.append(buttons);
  }
  preview.hidden=!state.pending;
  root.classList.toggle('is-on',state.enabled);
  for(const n of document.querySelectorAll('#z197-dashboard-mic'))n.classList.toggle('z199-active',state.enabled);
 }
 function build(){
  if(state.root)return;
  const root=el('div','z199-voice');root.id='z199-voice';root.hidden=true;root.dir='auto';
  const sheet=el('section','z199-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','z199-title');
  const header=el('header','z199-header'),mark=el('div','z199-mark','🎙'),heading=el('strong','z199-title','ZAVI VOICE');
  heading.id='z199-title';const close=el('button','z199-close','×');close.id='z199-close';close.type='button';close.onclick=()=>root.hidden=true;
  header.append(mark,heading,close);
  const row=el('div','z199-row'),label=el('label','z199-label');label.id='z199-label';
  const locale=el('select','z199-locale');locale.id='z199-locale';
  for(const [code,name] of Object.entries(names))locale.append(new Option(name,code));
  locale.value=state.lang;locale.onchange=()=>{const was=state.enabled;stop();state.lang=locale.value;save();if(was){state.starting=true;native('start')}draw()};
  row.append(label,locale);
  const toggleEl=el('button','z199-toggle');toggleEl.id='z199-toggle';toggleEl.type='button';toggleEl.onclick=toggle;
  const led=el('div','z199-led');led.setAttribute('aria-hidden','true');const statusEl=el('p','z199-status');statusEl.id='z199-status';statusEl.setAttribute('role','status');
  const heard=el('p','z199-transcript');heard.id='z199-transcript';heard.hidden=true;
  const note=el('p','z199-note');note.id='z199-note';
  const preview=el('div','z199-preview');preview.id='z199-preview';preview.hidden=true;
  sheet.append(header,row,toggleEl,led,statusEl,heard,note,preview);
  root.append(sheet);root.addEventListener('click',e=>{if(e.target===root)root.hidden=true});
  document.body.append(root);state.root=root;draw();
 }
 function open(){if(!auth())return;build();state.root.hidden=false;draw()}
 // The old "Start speech" Google/system UI is intentionally NOT called, even as fallback.
 window.ZaviVoiceLocalNativeEvent=event=>{
  if(!state.enabled||!auth())return;
  if(event?.type==='ready'){state.starting=false;state.active=true;state.working=false;if(Date.now()>=state.noticeUntil)publishStatus(t().listening);else draw()}
  else if(event?.type==='loading'){state.starting=true;publishStatus(t().loading)}
  else if(event?.type==='heard'){state.noticeUntil=0;publishStatus(t().heard)}
  else if(event?.type==='no_audio'){state.noticeUntil=Date.now()+4500;publishStatus(t().no_audio)}
  else if(event?.type==='unrecognized'){state.noticeUntil=Date.now()+4500;publishStatus(t().unrecognized)}
  else if(event?.type==='working'){state.noticeUntil=0;state.working=true;publishStatus(t().working)}
  else if(event?.type==='result'){state.working=false;state.noticeUntil=Date.now()+3800;interpret(event.text);state.active=true;draw()}
  else if(event?.type==='permission'){state.starting=false;state.active=false;state.enabled=false;save();publishStatus(t().permission)}
  else if(event?.type==='error'){state.starting=false;state.active=false;state.enabled=false;save();publishStatus(t().error)}
  else if(event?.type==='stopped'){state.starting=false;state.active=false;state.working=false;draw()}
 };
 function init(){
  restore();build();
  // Always intercept legacy mic launcher before its handlers; hide both old panels.
  document.addEventListener('click',event=>{
   const b=event.target?.closest?.('#z197-dashboard-mic,#z196-launch,#z198-power,.z196-launch,.z197-fab');
   if(!b||!auth())return;
   event.preventDefault();event.stopImmediatePropagation();open();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.root)state.root.hidden=true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop()}else if(state.enabled&&auth()&&avail()&&!state.starting){state.starting=true;native('start')}});
  window.addEventListener('pagehide',stop);
  setInterval(()=>{if(!auth()&&state.active)stop();else if(state.enabled&&!state.active&&!state.starting&&!document.hidden&&auth()&&avail()){state.starting=true;native('start')}},3500);
  if(state.enabled&&avail()&&auth()&&!document.hidden){state.starting=true;native('start')}
 }
 window.ZaviVoiceLocal6599=Object.freeze({open,interpret,stop,toggle,isEnabled:()=>state.enabled,engine:'whisper.cpp base q5_1 device-only, silent replies'});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();