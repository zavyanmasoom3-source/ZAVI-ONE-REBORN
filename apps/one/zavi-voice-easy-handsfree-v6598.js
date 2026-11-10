/* ZAVI EASY HANDSFREE 65.98 / 1.4.44
 * Explicit opt-in once; user-visible, foreground-only listening.
 * Native SpeechRecognizer on Android, best-effort Web Speech in supporting browsers.
 * Read-only navigation; invoice draft only. NEVER trigger posting, payments or permissions.
 */
(()=>{'use strict';
if(window.__zaviLocalOnly||window.ZaviHandsfreeEasy6598)return;
const ADMIN=!!document.querySelector('script[src*="zavi-voice-admin-v1442.js"]');
const SKEY='zavi.easy.handsfree.v6598.'+(ADMIN?'admin':'one');
const $=(s,p=document)=>p.querySelector(s);
const N=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e};
const trans={
 fa:{title:'دستیار صوتی زاوی',enable:'فعال‌کردن دستیار صوتی',disable:'خاموش‌کردن دستیار صوتی',language:'زبان و لهجه',off:'خاموش است',on:'در حال گوش‌دادن؛ می‌توانید صحبت کنید',pause:'گوش‌دادن موقتاً متوقف شد',error:'میکروفون در دسترس نیست؛ مجوز میکروفون را بررسی کنید.',unsupported:'تشخیص گفتار در این دستگاه پشتیبانی نمی‌شود. می‌توانید متن را بنویسید.',example:'مثلاً بگویید: «بخش فروش را باز کن»',heard:'صدای شما',draft:'پیش‌نویس آماده شد؛ برای ثبت به فاکتور اصلی بروید و خودتان تأیید کنید.',unknown:'این دستور را تشخیص ندادم؛ نام صفحه را بگویید.',permission:'برای استفاده، یک بار اجازه میکروفون بدهید.',privacy:'تا زمانی که برنامه باز و دستیار روشن است گوش می‌دهد؛ با بستن برنامه یا خاموش‌کردن، میکروفون متوقف می‌شود. تشخیص صدا ممکن است به اینترنت نیاز داشته باشد.',close:'بستن',manual:'نوشتن دستور',run:'اجرا',settings:'تنظیمات',safe:'هیچ خرید، فروش، حذف یا پرداختی تنها با صدا ثبت نمی‌شود.',offline:'ممکن است موتور تشخیص گفتار به اینترنت نیاز داشته باشد.',nav:'بازشدن بخش',review:'بررسی در فاکتور اصلی',stop:'توقف',resume:'فعال‌سازی دوباره'},
 ps:{title:'د زاوي غږیز مرستیال',enable:'غږیز مرستیال فعال کړئ',disable:'غږیز مرستیال بند کړئ',language:'ژبه او لهجه',off:'بند دی',on:'اورم؛ خبرې وکړئ',pause:'غږ لنډمهاله ودرېد',error:'مایکروفون یا اجازه نشته.',unsupported:'په دې وسیله غږ نشته؛ امر ولیکئ.',example:'ووایئ: «د پلور برخه خلاصه کړه»',heard:'ستاسو خبرې',draft:'مسوده چمتو ده؛ اصلي بل کې یې تایید کړئ.',unknown:'امر نه پېژنم؛ د برخې نوم ووایئ.',permission:'یو ځل د مایکروفون اجازه ورکړئ.',privacy:'یوازې د اپ پرانیستې او مرستیال فعالېدو پر مهال اوري؛ آنلاین خدمت ته اړتیا کېدای شي.',close:'بندول',manual:'امر ولیکئ',run:'اجرا',settings:'تنظیمات',safe:'غږ په خپله مالي معامله نه ثبتوي.',offline:'ممکن انټرنېټ ته اړتیا ولري.',nav:'برخه پرانیستل',review:'بل وګورئ',stop:'بندول',resume:'بیا فعالول'},
 en:{title:'ZAVI Voice Assistant',enable:'Enable hands-free voice',disable:'Turn voice off',language:'Language & accent',off:'Voice is off',on:'Listening — speak naturally',pause:'Listening paused',error:'Microphone or permission unavailable.',unsupported:'Speech recognition unavailable; type the command instead.',example:'Say “open sales” or “show inventory”',heard:'Recognized',draft:'Draft ready. Review and confirm in the original invoice.',unknown:'Command not recognized; name a section.',permission:'Allow microphone once to use voice.',privacy:'Listens only while this app is open and enabled; pauses in background. Speech recognition may require an online provider.',close:'Close',manual:'Type a command',run:'Run',settings:'Settings',safe:'Voice never posts or deletes financial transactions.',offline:'Speech service may require internet.',nav:'Open section',review:'Review invoice',stop:'Stop',resume:'Resume'}
};
const locales={'fa-AF':'دری افغانستان','ps-AF':'پښتو افغانستان','fa-IR':'فارسی','en-GB':'English (UK)','en-US':'English (US)'};
const state={enabled:false,lang:'fa-AF',modal:null,rec:null,session:false,native:false,active:false,backoff:800,timer:null,heard:'',status:'',draft:null};
const q=()=>trans[state.lang.startsWith('ps')?'ps':state.lang.startsWith('en')?'en':'fa'];
const visible=e=>!!e&&e.isConnected&&!e.hidden&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden],[aria-hidden=true]');
function authorized(){
 const screen=$('#appScreen');
 if(ADMIN)return !!screen&&visible(screen)&&window.ZaviAdminAPI?.getMode?.()==='live';
 if(screen&&!visible(screen))return false;
 const login=$('#loginScreen');if(login&&visible(login))return false;
 return !!(screen&&visible(screen)||$('#content')&&visible($('#content')));
}
function save(){try{localStorage.setItem(SKEY,JSON.stringify({enabled:state.enabled,lang:state.lang}))}catch(_){}}
function restore(){try{let o=JSON.parse(localStorage.getItem(SKEY)||'{}');state.enabled=o.enabled===true;state.lang=locales[o.lang]?o.lang:'fa-AF'}catch(_){}}
const navNames={
 sales:['sales','sale','فروش','پلور'],purchase:['purchase','purchases','خرید','پېرود'],
 inventory:['inventory','stock','گدام','موجودی'],customers:['customers','مشتریان','پېرودونکي'],
 debt:['debtors','debts','قرضداران','پورونه'],reports:['reports','گزارش','راپور'],
 settingsPage:['settings','تنظیمات','تنظیمونه'],daily:['daily','dashboard','روزمره'],
 expenses:['expenses','مصارف','لګښتونه'],barcode:['barcode','بارکد','بارکوډ'],
 assistant:['assistant','دستیار','مرستیال'],
 subscriptions:['subscriptions','اشتراک','تمدید'],support:['support','پشتیبانی','ملاتړ'],
 devices:['devices','دستگاه'],communications:['communications','messages','پیام'],
 billing:['billing','finance','مالی','پرداخت'],audit:['audit','تاریخچه'],releases:['releases','آپدیت']
};
function navFor(r){
 const terms=r.kind==='navigate_label'?[r.label]:navNames[r.key]||[];
 if(!terms.length)return null;
 const candidates=[...document.querySelectorAll('#sidebarLinks [data-go],#mobileBottom [data-go],#side [data-go],#side [data-page],#appScreen .sidebar [data-page],#appScreen .nav [data-page],.nav-btn[data-page],.nav-item[data-page],a[data-page],button[data-page]')];
 return candidates.find(e=>{
  if(e.disabled||e.closest('#z198-easy,#z196-voice'))return false;
  const value=[e.dataset.go,e.dataset.page,e.textContent,e.getAttribute('aria-label')].filter(Boolean).join(' ').toLowerCase().replace(/\s+/g,' ');
  return terms.some(t=>value.includes(t.toLowerCase())&&t.length>=3)
 })||null
}
function refresh(){
 if(!state.modal)return;
 const t=q(),root=state.modal;
 $('#z198-title').textContent=t.title;
 $('#z198-power').textContent=state.enabled?t.disable:t.enable;
 $('#z198-power').classList.toggle('z198-powered',state.enabled);
 $('#z198-lang-label').textContent=t.language;
 $('#z198-lang').value=state.lang;
 $('#z198-status').textContent=state.status||(!state.enabled?t.off:state.active?t.on:t.pause);
 $('#z198-help').textContent=t.example;
 $('#z198-privacy').textContent=t.privacy;
 $('#z198-safe').textContent=t.safe;
 $('#z198-manual').placeholder=t.manual;
 $('#z198-run').textContent=t.run;
 $('#z198-close').setAttribute('aria-label',t.close);
 const h=$('#z198-heard');h.textContent=state.heard;
 h.hidden=!state.heard;
 root.classList.toggle('z198-on',state.enabled);
 root.classList.toggle('z198-live',state.enabled&&state.active);
 document.querySelectorAll('#z197-dashboard-mic').forEach(b=>{b.classList.toggle('z198-listening',state.enabled&&state.active);b.setAttribute('aria-pressed',String(state.enabled))});
}
function status(v){state.status=v;refresh()}
function stopSpeech(){
 clearTimeout(state.timer);state.timer=null;
 try{state.rec?.abort()}catch(_){}
 state.rec=null;
 if(state.native){try{window.ZaviAndroidHandsfree?.postMessage(JSON.stringify({op:'stop'}))}catch(_){}}
 state.native=false;state.active=false;refresh()
}
function disable(){state.enabled=false;state.session=false;stopSpeech();save();status(q().off)}
function nativeStart(){
 if(!window.ZaviAndroidHandsfree?.postMessage)return false;
 try{state.native=true;state.active=true;refresh();
 window.ZaviAndroidHandsfree.postMessage(JSON.stringify({op:'start',language:state.lang}));return true}catch(_){state.native=false;state.active=false;return false}
}
function browserStart(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech||!window.isSecureContext){state.active=false;status(q().unsupported);return}
 if(state.rec)return;
 try{
  const rec=new Speech();rec.lang=state.lang;rec.continuous=true;rec.interimResults=false;rec.maxAlternatives=1;
  state.rec=rec;rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)interpret(e.results[i][0].transcript)}};
  rec.onstart=()=>{state.active=true;state.backoff=800;status(q().on)};
  rec.onerror=e=>{state.active=false;if(e.error==='not-allowed'||e.error==='service-not-allowed'){state.session=false;status(q().permission)}};
  rec.onend=()=>{if(state.rec===rec)state.rec=null;state.active=false;refresh();
   if(state.enabled&&state.session&&authorized()&&!document.hidden){state.timer=setTimeout(browserStart,state.backoff);state.backoff=Math.min(8000,Math.round(state.backoff*1.75))}
  };
  rec.start()
 }catch(_){state.rec=null;state.active=false;status(q().unsupported)}
}
function begin(){
 if(!state.enabled||!authorized()||document.hidden)return;
 clearTimeout(state.timer);state.timer=null;
 if(nativeStart())return;
 browserStart()
}
function enable(){
 if(!authorized()){status(q().off);return}
 state.enabled=true;state.session=true;state.status='';save();refresh();begin()
}
function interpret(phrase){
 if(!state.enabled||!authorized()||document.hidden)return;
 const raw=String(phrase||'').trim().slice(0,400);if(!raw)return;
 const cleaned=raw.replace(/^(?:هی|ای|hey|ok|okay)?\s*(?:زاوی|زاوي|zavi|zavy|zavione|زاوی وان)[،,\s:]*/iu,'').trim()||raw;
 state.heard=raw;state.draft=null;
 const r=window.ZaviVoiceProV6596?.route?.(cleaned);
 if(!r||r.kind==='unknown'){status(q().unknown);return}
 if(r.kind==='draft'){
  state.draft=r.draft;const lines=r.draft.items.map(x=>x.product+' × '+(x.quantity??'?')+' '+(x.unit||'')).join('؛ ');
  state.heard=raw+'\n'+lines;status(q().draft);return
 }
 if(r.kind==='navigate'||r.kind==='navigate_label'){
  const target=navFor(r);
  if(!target){status(q().unknown);return}
  target.click();status(q().nav+' — '+cleaned);return
 }
 status(q().unknown)
}
window.ZaviHandsfreeNativeEvent=e=>{
 if(!state.enabled||!authorized())return;
 if(e?.type==='result')interpret(e.text);
 else if(e?.type==='listening'){state.active=true;status(q().on)}
 else if(e?.type==='paused'){state.active=false;status(q().pause)}
 else if(e?.type==='permission'){state.active=false;state.session=false;status(q().permission)}
 else if(e?.type==='error'){state.active=false;state.session=false;status(q().error)}
};
function build(){
 if(state.modal)return;
 const root=N('div','z198-easy');root.id='z198-easy';root.hidden=true;
 const modal=N('section','z198-dialog');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','z198-title');
 const head=N('div','z198-head'),title=N('h2','',q().title);title.id='z198-title';
 const close=N('button','z198-close','×');close.type='button';close.id='z198-close';close.addEventListener('click',()=>{root.hidden=true});
 head.append(title,close);
 const power=N('button','z198-power');power.type='button';power.id='z198-power';power.addEventListener('click',()=>state.enabled?disable():enable());
 const label=N('label','z198-label');label.id='z198-lang-label';label.textContent=q().language;
 const select=N('select','z198-lang');select.id='z198-lang';
 Object.entries(locales).forEach(([k,n])=>select.append(new Option(n,k)));
 select.value=state.lang;select.addEventListener('change',()=>{const on=state.enabled;stopSpeech();state.lang=select.value;state.status='';save();refresh();if(on)begin()});
 label.append(select);
 const ring=N('div','z198-ring');ring.setAttribute('aria-hidden','true');ring.textContent='🎙';
 const statusEl=N('p','z198-status');statusEl.id='z198-status';statusEl.setAttribute('role','status');
 const heard=N('p','z198-heard');heard.id='z198-heard';heard.hidden=true;
 const help=N('p','z198-help');help.id='z198-help';
 const details=N('details','z198-details');const summary=N('summary','z198-summary','⌨');summary.setAttribute('aria-label','Type a command');
 const textarea=N('textarea','z198-manual');textarea.id='z198-manual';textarea.rows=2;textarea.maxLength=400;
 const run=N('button','z198-run');run.id='z198-run';run.type='button';run.addEventListener('click',()=>interpret(textarea.value));
 details.append(summary,textarea,run);
 const privacy=N('p','z198-privacy');privacy.id='z198-privacy';
 const safe=N('p','z198-safe');safe.id='z198-safe';
 modal.append(head,power,label,ring,statusEl,heard,help,details,safe,privacy);
 root.append(modal);root.addEventListener('click',e=>{if(e.target===root)root.hidden=true});
 document.body.append(root);state.modal=root;refresh()
}
function open(){
 if(!authorized())return;
 build();state.modal.hidden=false;refresh()
}
function init(){
 restore();build();
 // Capturing BEFORE the old dashboard button listener prevents old complex dialog opening.
 document.addEventListener('click',e=>{
  const launch=e.target?.closest?.('#z197-dashboard-mic,#z196-launch');
  if(!launch||!authorized())return;
  e.preventDefault();e.stopImmediatePropagation();open()
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal&&!state.modal.hidden)state.modal.hidden=true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopSpeech();status(q().pause)}
  else if(state.enabled&&authorized()&&(state.native||window.ZaviAndroidHandsfree)){state.session=true;begin()}
 });
 window.addEventListener('pagehide',()=>{stopSpeech()});
 const check=()=>{
  if(!authorized()){if(state.active||state.rec||state.native)stopSpeech();return}
  // Only Android's explicit, origin-checked microphone bridge can auto-resume a saved
  // consent across app launches. Browser speech usually requires a fresh user gesture.
  if(state.enabled&&!state.native&&!state.active&&!state.rec&&!document.hidden&&window.ZaviAndroidHandsfree?.postMessage){
   state.session=true;begin()
  }
 };
 setInterval(check,2500);
 if(state.enabled&&window.ZaviAndroidHandsfree?.postMessage&&authorized())begin();
}
window.ZaviHandsfreeEasy6598=Object.freeze({open,interpret,stop:disable,isEnabled:()=>state.enabled,version:'65.98/1.4.44'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
