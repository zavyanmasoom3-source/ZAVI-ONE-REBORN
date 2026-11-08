/* Restored from design-system V66.05 with safe login guard, independent text commands, and honest native-voice feature detection. */
/* ZAVI COMMAND CENTER V66.05 / ADMIN V1.4.51
 * Two distinct inputs, one allowlisted read-only command router.
 * Native device-only speech via bundled Whisper; typed text uses identical intent checks.
 * Never posts sales, purchases, payments, deletes or changes privileges.
 */
(()=>{'use strict';
if(window.ZaviDualCommand605)return;
const ADMIN=!!document.querySelector('script[data-zavi-command-app="admin"]');
const APP=ADMIN?'admin':'one',STORE_KEY='zavi.dual.605.'+APP;
const $=(sel,root=document)=>root?.querySelector(sel)||null;
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f\u0670\u200c\u200e\u200f\u0640]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإآ]/g,'ا').replace(/[ۀة]/g,'ه').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const L={
 fa:{title:'ZAVI VOICE',voice:'دستور صوتی',write:'دستور نوشتاری',choose:'زبان فرمان',start:'شروع شنیدن',stop:'توقف شنیدن',execute:'اجرای دستور',placeholder:'مثلاً: بخش فروش را باز کن',hint:'دستور را بنویسید و «اجرای دستور» را بزنید.',ready:'برای گفتن دستور، میکروفون را فعال کنید.',loading:'مدل صوتی آماده می‌شود...',listening:'گوش می‌دهم؛ صحبت کنید.',heard:'صدا دریافت شد.',processing:'در حال تشخیص صحبت...',unheard:'صدایی دریافت نشد؛ نزدیک میکروفون صحبت کنید.',unclear:'گفتار واضح نبود؛ دوباره بگویید.',forbidden:'برای امنیت، این فرمان از دستیار قابل اجرا نیست.',unknown:'دستور شناسایی نشد. «فروش را باز کن» را امتحان کنید.',noTarget:'این بخش در حساب فعلی در دسترس نیست.',sent:'فرمان به بخش مربوط فرستاده شد.',draft:'پیش‌نویس آماده شد؛ هیچ معامله‌ای ثبت نشده است.',review:'برای بررسی فاکتور، بخش مربوط را باز کنید.',openReview:'رفتن به فاکتور',cancel:'لغو',micError:'اجازه میکروفون یا مدل صوتی در دسترس نیست.',cloud:'پس از ورود و بازکردن حسابداری از دستیار استفاده کنید.',example:'فروش را باز کن',example2:'تنظیمات را باز کن',example3:'گدام را باز کن',transcript:'متن تشخیص‌شده',dismiss:'بستن',keep:'عملیات مالی فقط بعد از تأیید در فرم اصلی ثبت می‌شود.'},
 ps:{title:'ZAVI VOICE',voice:'غږیز امر',write:'لیکلی امر',choose:'د امر ژبه',start:'غږ اورېدل پیل کړه',stop:'غږ بند کړه',execute:'امر اجرا کړه',placeholder:'بېلګه: د پلور برخه خلاصه کړه',hint:'امر ولیکئ او اجرا تڼۍ کېکاږئ.',ready:'د خبرو لپاره مایکروفون فعال کړئ.',loading:'غږیز ماډل چمتو کېږي...',listening:'اورم؛ خبرې وکړئ.',heard:'غږ ترلاسه شو.',processing:'د خبرو پېژندنه...',unheard:'غږ نه اورم؛ مایکروفون ته نږدې وغږېږئ.',unclear:'خبرې روښانه نه وې؛ بیا ووایئ.',forbidden:'د خوندیتوب لپاره دا امر نه اجرا کېږي.',unknown:'امر ونه پېژندل شو. د پلور برخه خلاصه کړه.',noTarget:'دا برخه په دې حساب کې نشته.',sent:'امر اړوندې برخې ته ولېږل شو.',draft:'مسوده چمتو ده؛ معامله نه ده ثبت شوې.',review:'د وروستي ثبت لپاره بل وګورئ.',openReview:'بل وګورئ',cancel:'لغوه',micError:'مایکروفون یا ماډل کار نه کوي.',cloud:'لومړی خپل حساب ته ننوځئ.',example:'پلور خلاص کړه',example2:'تنظیمات خلاص کړه',example3:'ګدام خلاص کړه',transcript:'اورېدل شوې خبرې',dismiss:'بندول',keep:'مالي معامله یوازې په اصلي فورمه کې د تایید وروسته ثبتېږي.'},
 en:{title:'ZAVI VOICE',voice:'Voice command',write:'Typed command',choose:'Command language',start:'Start listening',stop:'Stop listening',execute:'Execute command',placeholder:'e.g. open sales',hint:'Type a command and press Execute.',ready:'Tap the microphone to speak.',loading:'Loading offline speech model...',listening:'Listening — speak now.',heard:'Audio detected.',processing:'Recognizing speech...',unheard:'No speech detected. Move closer to the microphone.',unclear:'Speech unclear. Please repeat.',forbidden:'This command is not permitted from the assistant.',unknown:'Command not recognized. Try “open sales”.',noTarget:'That section is not available for this account.',sent:'Command sent to the requested section.',draft:'Draft created; no financial record was posted.',review:'Review the invoice in its original form.',openReview:'Open invoice',cancel:'Cancel',micError:'Microphone permission or offline model unavailable.',cloud:'Sign in and open your workspace first.',example:'Open sales',example2:'Open settings',example3:'Open inventory',transcript:'Recognized words',dismiss:'Close',keep:'Financial operations must be reviewed and confirmed in the original form.'}
};
const languages={'fa-AF':'دری افغانستان','ps-AF':'پښتو افغانستان','en-GB':'English'};
const sections=ADMIN?{
 overview:['داشبورد','خانه','صفحه اصلی','کور','home','dashboard','overview'],
 customers:['مشتریان','مشتری ها','مشتری','پېرودونکي','customers','users'],
 devices:['دستگاه ها','دستگاه','وسایل','devices'],
 support:['پشتیبانی','پیام ها','ملاتړ','support'],
 payments:['پرداخت ها','پرداخت','بلینگ','payments','billing'],
 finance:['گزارش های مالی','گزارش مالی','گزارش ها','گزارش','مالی','راپورونه','راپور','finance','reports','report','revenue'],
 activity:['فعالیت ها','تاریخچه','فعالیت','audit','activity','history'],
 health:['وضعیت سیستم','سلامت سیستم','health'],
 brand:['برند','brand'],
 security:['امنیت','security'],
 settings:['تنظیمات','تنظیم','تنزیمات','تظیمات','تنظیمونه','امستنې','setting','settings']
}:{
 dashboard:['داشبورد','خانه','صفحه اصلی','کور','home','dashboard'],
 sales:['فروش','فروشی','فروخت','فروشات','پلور','خرڅلاو','sale','sales','selling'],
 purchases:['خرید','خریداری','پیرود','پېرود','پېرودنې','purchase','purchases','buy'],
 products:['گدام','ګدام','گدوم','گدامداری','انبار','موجودی','کالاها','اجناس','توکي','stock','inventory','products','warehouse'],
 contacts:['مشتری','مشتریان','پېرودونکي','مشتری ها','customers','contacts'],
 debtors:['قرضداران','قرضدار','قرض ها','بدهکاران','پورونه','debtors','debts'],
 creditors:['بدهی ما','طلبکاران','creditors'],
 reports:['گزارش','گزارشات','گزارش ها','راپور','راپورونه','report','reports'],
 settings:['تنظیمات','تنظیم','تنزیمات','تظیمات','تنظیمونه','امستنې','setting','settings'],
 expenses:['مصارف','مصرف','هزینه','لګښتونه','expense','expenses'],
 money:['نقدی','دریافت','money','cash'],
 hawala:['حواله','حوالات','hawala','remittance'],
 phonebook:['دفترچه','phonebook'],
 journal:['روزنامچه','ژورنال','journal'],
 waste:['ضایعات','waste'],
 repairs:['تعمیرات','ترمیم','repairs'],
 subscription:['اشتراک','تمدید','subscription','renewal']
};
const commands=Object.entries(sections).map(([key,labels])=>({key,aliases:[key,...labels].map(norm)}));
const NA=/\b(?:حذف|پاک|نابود|مسح|reset|delete|remove|erase|drop|wipe|ړنګ|لرې)\b/u;
const DANGEROUS=/(حذف|پاک\s*کن|پاک\s*کړه|نابود|مسح|reset|delete|remove|erase|drop|wipe|ړنګ|لرې\s*کړه|غیرفعال کردن امنیت|تغییر مجوز|grant access)/iu;
const NAV=/(?:^|\s)(?:باز|بکن|بکو|وا|برو|بیار|بگذار|ببین|نمایش|نشان|بخش|برخه|صفحه|منو|داشبورد|خلاص|خلاصه|خلاصې|کړه|پرانی|پراني|پرانیځه|وښیه|ورشه|open|show|go|navigate|display|view|launch)(?:\s|$)/iu;
function parseCommand(raw){
 const n=norm(raw);
 if(!n||n.length>280)return {kind:'unknown',reason:'empty'};
 if(DANGEROUS.test(n))return {kind:'refuse',reason:'unsafe'};
 const removeWake=n.replace(/^(?:ای|هی|های|hey|ok|okay)?\s*(?:زاوی|زاوي|زاوی وان|زاوي وان|zavi one|zavi|zavy)[\s،,]*/iu,'').trim();
 const n2=removeWake||n;
 let matches=[];
 for(const x of commands){
  for(const a of x.aliases){
   if(!a||a.length<3)continue;
   const whole=n2===a;
   const part=(' '+n2+' ').includes(' '+a+' ');
   if(whole||part&&NAV.test(n2))matches.push({key:x.key,score:(whole?500:100)+a.length+(a===x.key?15:0)});
  }
 }
 matches.sort((a,b)=>b.score-a.score);
 const distinct=[...new Set(matches.map(x=>x.key))];
 if(matches.length&&!(matches.length>1&&matches[0].score===matches.find(x=>x.key!==matches[0].key)?.score)){
  // An instruction containing quantities/customers is not simply page navigation.
  const quantity=/(?:^|\s)(?:\d+|یک|دو|سه|پنځه|پنج|کیلو|عدد|بسته|گرام|kg|pcs)(?:\s|$)/iu;
  const explicit=/(باز|خلاص|open|show|نمایش|نشان|ورشه|پراني|صفحه|بخش|go)/iu.test(n2);
  if(explicit||!quantity.test(n2)&&n2.split(' ').length<=3)return {kind:'navigate',key:matches[0].key,normalized:n2,score:matches[0].score};
 }
 // Allow a safe draft preview from the ORIGINAL parser; never auto post.
 if(!ADMIN){const r=window.ZaviVoiceProV6596?.route?.(raw);
  if(r?.kind==='draft'&&r.draft?.items?.length)return {kind:'draft',key:r.key,draft:r.draft,normalized:n2};
 }
 return {kind:'unknown',reason:distinct.length?'ambiguous':'no_match',normalized:n2};
}
function existingSession(){
 // Startup uses the original app gate; cloud management stays inside the app.
 if(ADMIN){
  const a=$('#appScreen');const screen=$('#authScreen');
  if(!a||a.hidden||getComputedStyle(a).display==='none')return false;
  if(screen&&!screen.hidden&&getComputedStyle(screen).display!=='none')return false;
  return window.ZaviAdminAPI?.getMode?.()==='live';
 }
 if(document.documentElement.classList.contains('zawi-locked'))return false;
 const privateGate=$('#loginScreen'),content=$('#content'),app=$('#appScreen');
 if(privateGate&&!privateGate.hidden&&getComputedStyle(privateGate).display!=='none')return false;
 return !!((content&&!content.hidden&&getComputedStyle(content).display!=='none')||
   (app&&!app.hidden&&getComputedStyle(app).display!=='none'));
}
function findNavigation(key){
 if(!Object.hasOwn(sections,key))return null;
 // Route only through existing authenticated navigation controls.
 const allowed=['#sidebarLinks [data-go]','#sidebarLinks2 [data-go]','#mobileBottom [data-go]','#side [data-go]',
  '#appScreen .sidebar [data-page]','#appScreen .nav [data-page]','#appScreen [data-page].nav-item',
  '#appScreen [data-page].nav-btn','#content [data-go].nav-btn','#content [data-go].nav-item'];
 let nodes=[...document.querySelectorAll(allowed.join(','))];
 nodes=nodes.filter(n=>n.isConnected&&!n.disabled&&!n.closest('#z605-panel,#z196-voice,#z199-voice,#z198-easy'));
 const exact=nodes.find(n=>(n.dataset.go||n.dataset.page)===key);
 if(exact)return exact;
 // Match only the label of a navigation element, never a financial button.
 const aliases=sections[key].map(norm);
 return nodes.find(n=>{const label=norm([n.textContent,n.getAttribute?.('aria-label'),n.getAttribute?.('title')].filter(Boolean).join(' '));
 return aliases.some(a=>label===a)});
}
const state={tab:'text',enabled:false,active:false,starting:false,lang:'fa-AF',status:'',heard:'',lastInput:'',lastTime:0,pending:null};
let panel=null,launcher=null;
const w=()=>L[state.lang.startsWith('ps')?'ps':state.lang.startsWith('en')?'en':'fa'];
function remember(){try{localStorage.setItem(STORE_KEY,JSON.stringify({lang:state.lang,tab:state.tab}))}catch(_){}}
function restore(){try{const o=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');if(languages[o.lang])state.lang=o.lang;if(['voice','text'].includes(o.tab))state.tab=o.tab; if(!window.ZaviAndroidLocalVoice?.postMessage)state.tab='text'}catch(_){}}
function postNative(op){if(!window.ZaviAndroidLocalVoice?.postMessage)return false;
 try{window.ZaviAndroidLocalVoice.postMessage(JSON.stringify({op,language:state.lang}));return true}catch(_){return false}}
function stopVoice(){state.enabled=false;state.active=false;state.starting=false;postNative('stop');render()}
function startVoice(){
 if(!existingSession()){state.status=w().cloud;render();return}
 if(state.tab!=='voice')return;
 if(!window.ZaviAndroidLocalVoice?.postMessage){state.status=w().micError;render();return}
 state.enabled=true;state.starting=true;state.status=w().loading;
 if(!postNative('start')){state.enabled=false;state.starting=false;state.status=w().micError}
 render();
}
function showStatus(text){state.status=text;render()}
function changeTab(tab){
 if(!['voice','text'].includes(tab))return;
 if(tab!=='voice')stopVoice();
 state.tab=tab;remember();state.status=tab==='text'?w().hint:w().ready;
 render();
}
function execute(raw,source='text'){
 if(!existingSession()){showStatus(w().cloud);return {kind:'blocked'}}
 const text=String(raw||'').trim().slice(0,300);
 if(!text){showStatus(w().unknown);return {kind:'unknown'}}
 if(source==='voice'){
  if(!state.enabled||state.tab!=='voice')return {kind:'blocked'};
  const now=Date.now(),fingerprint=norm(text);
  if(state.lastInput===fingerprint&&now-state.lastTime<3800)return {kind:'duplicate'};
  state.lastInput=fingerprint;state.lastTime=now;
 }
 state.heard=text;
 const result=parseCommand(text);
 if(result.kind==='refuse'){state.pending=null;showStatus(w().forbidden);return result}
 if(result.kind==='draft'){state.pending=result;showStatus(w().draft);return result}
 if(result.kind==='navigate'){
  const dest=findNavigation(result.key);
  if(!dest){state.pending=null;showStatus(w().noTarget);return {kind:'unavailable',key:result.key}}
  state.pending=null;
  // A native click is the same navigation route that the signed-in user uses.
  // No direct DB, billing, RLS or form submission calls.
  dest.click();
  if(panel)panel.hidden=true;
  stopVoice();
  showStatus(w().sent);
  return result;
 }
 state.pending=null;showStatus(w().unknown);return result;
}
function create(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function build(){
 if(panel)return;
 panel=create('div','z605-overlay');panel.id='z605-panel';panel.hidden=true;
 const shell=create('section','z605-shell');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-labelledby','z605-title');
 shell.innerHTML='<div class="z605-head"><div class="z605-badge" aria-hidden="true">Z</div><div class="z605-title"><b id="z605-title">ZAVI VOICE</b><small>INTELLIGENT COMMAND CENTER</small></div><button id="z605-close" type="button" aria-label="Close">×</button></div><div class="z605-tabs"><button type="button" id="z605-voice-tab"></button><button type="button" id="z605-text-tab"></button></div><div class="z605-locale"><label id="z605-locale-label" for="z605-locale"></label><select id="z605-locale"></select></div><div class="z605-content"><div id="z605-voice-area"><div class="z605-pulse"><span class="z605-rings"></span><span class="z605-micro">🎙</span></div><button id="z605-mic" type="button"></button><p id="z605-speech-status" role="status"></p><div class="z605-heard" id="z605-heard" hidden><small id="z605-transcript-label"></small><p id="z605-transcript"></p></div></div><div id="z605-text-area" hidden><label id="z605-type-label" for="z605-type"></label><textarea id="z605-type" rows="3" maxlength="300"></textarea><button type="button" id="z605-execute"></button><div id="z605-suggestions"></div></div></div><div class="z605-draft" id="z605-draft" hidden></div><div class="z605-feedback" id="z605-feedback" role="status" aria-live="polite"></div><p class="z605-safe" id="z605-safe"></p>';
 const options=$('#z605-locale',shell);
 for(const [key,label] of Object.entries(languages)){const op=document.createElement('option');op.value=key;op.textContent=label;options.append(op)}
 shell.querySelector('#z605-close').addEventListener('click',close);
 shell.querySelector('#z605-voice-tab').addEventListener('click',()=>changeTab('voice'));
 shell.querySelector('#z605-text-tab').addEventListener('click',()=>changeTab('text'));
 options.addEventListener('change',()=>{const enabled=state.enabled;stopVoice();state.lang=options.value;remember();if(enabled&&state.tab==='voice')startVoice();else render()});
 shell.querySelector('#z605-mic').addEventListener('click',()=>state.enabled?stopVoice():startVoice());
 shell.querySelector('#z605-execute').addEventListener('click',()=>execute($('#z605-type',shell).value,'text'));
 shell.querySelector('#z605-type').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();execute(e.target.value,'text')}});
 panel.addEventListener('click',e=>{if(e.target===panel)close()});
 panel.append(shell);document.body.append(panel);render();
}
function open(){
 if(!existingSession())return;
 build();panel.hidden=false;render();
 if(state.tab==='text')$('#z605-type',panel)?.focus({preventScroll:true});
}
function close(){stopVoice();if(panel)panel.hidden=true}
function render(){
 if(!panel)return;
 const q=w();panel.dir=state.lang.startsWith('en')?'ltr':'rtl';
 const nativeVoice=!!window.ZaviAndroidLocalVoice?.postMessage;
 for(const [sel,txt] of [['#z605-title',q.title],['#z605-locale-label',q.choose],['#z605-voice-tab','🎙 '+q.voice],['#z605-text-tab','⌨ '+q.write],['#z605-mic',state.enabled?q.stop:q.start],['#z605-speech-status',state.enabled?(state.status||q.listening):q.ready],['#z605-type-label',q.hint],['#z605-execute',q.execute],['#z605-safe',q.keep],['#z605-transcript-label',q.transcript]]){
  const n=$(sel,panel);if(n)n.textContent=txt;
 }
 $('#z605-close',panel).setAttribute('aria-label',q.dismiss);
 const voiceBtn=$('#z605-mic',panel);if(voiceBtn)voiceBtn.disabled=!nativeVoice;
 $('#z605-locale',panel).value=state.lang;
 const input=$('#z605-type',panel);input.placeholder=q.placeholder;
 $('#z605-voice-tab',panel).classList.toggle('active',state.tab==='voice');
 $('#z605-text-tab',panel).classList.toggle('active',state.tab==='text');
 $('#z605-voice-area',panel).hidden=state.tab!=='voice';
 $('#z605-text-area',panel).hidden=state.tab!=='text';
 $('#z605-speech-status',panel).textContent=state.tab==='voice'?(!nativeVoice?q.micError:(state.status||q.ready)):'';
 const heard=$('#z605-heard',panel);heard.hidden=state.tab!=='voice'||!state.heard;
 $('#z605-transcript',panel).textContent=state.heard;
 $('#z605-feedback',panel).textContent=state.status||'';
 const p=$('#z605-draft',panel);p.replaceChildren();p.hidden=!state.pending;
 if(state.pending){
  const d=state.pending.draft;
  p.append(create('strong','',q.draft));
  if(d?.party)p.append(create('p','',String(d.party).slice(0,100)));
  for(const item of (d?.items||[]).slice(0,10))p.append(create('p','',String(item.product||'')+' · '+String(item.quantity||'')));
  const action=create('button','z605-review',q.openReview),cancel=create('button','z605-cancel',q.cancel);
  action.type='button';cancel.type='button';
  action.addEventListener('click',()=>{
   const key=state.pending?.key;state.pending=null;
   const sec=key==='purchase'?'purchases':key==='sales'?'sales':key;
   if(sec&&Object.hasOwn(sections,sec))execute('open '+(sections[sec].find(x=>/[a-z]/.test(x))||sec),'text');
  });
  cancel.addEventListener('click',()=>{state.pending=null;render()});
  p.append(action,cancel);
 }
 const suggestions=$('#z605-suggestions',panel);suggestions.replaceChildren();
 for(const sample of [q.example,q.example2,q.example3]){
  const b=create('button','z605-chip',sample);b.type='button';
  b.addEventListener('click',()=>{input.value=sample;execute(sample,'text')});suggestions.append(b);
 }
 $('#z605-mic',panel).classList.toggle('active',state.enabled);
}
window.ZaviVoiceLocalNativeEvent=event=>{
 if(!event||!state.enabled||state.tab!=='voice'||!existingSession())return;
 if(event.type==='loading'){state.starting=true;showStatus(w().loading)}
 else if(event.type==='ready'){state.active=true;state.starting=false;showStatus(w().listening)}
 else if(event.type==='heard')showStatus(w().heard)
 else if(event.type==='working')showStatus(w().processing)
 else if(event.type==='result'){const result=execute(event.text,'voice');if(result.kind!=='navigate'&&state.enabled)showStatus(state.status||w().listening)}
 else if(event.type==='no_audio')showStatus(w().unheard)
 else if(event.type==='unrecognized')showStatus(w().unclear)
 else if(event.type==='permission'||event.type==='error'){stopVoice();showStatus(w().micError)}
 else if(event.type==='stopped'){state.active=false;state.starting=false}
};
function attach(){
 restore();
 build();
 launcher=create('button','z605-launch','🤖');launcher.id='z605-launch';launcher.type='button';
 launcher.setAttribute('aria-label','ZAVI VOICE');launcher.addEventListener('click',open);document.body.append(launcher);
 document.addEventListener('click',e=>{
  const b=e.target?.closest?.('#z197-dashboard-mic,#z196-launch,#z198-power,.z196-launch,.z197-fab,#z199-launch');
  if(!b||!existingSession())return;
  e.preventDefault();e.stopImmediatePropagation();open();
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden)close()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){close()}});
 window.addEventListener('pagehide',stopVoice);
 const updateLauncher=()=>{if(launcher)launcher.hidden=!existingSession()};
 updateLauncher();
 // Existing accounting SPA replaces DOM nodes, but assistant launcher is fixed and
 // its visibility must track the actual login/workspace, not a stale local flag.
 setInterval(updateLauncher,1300);
}
window.ZaviDualCommand605=Object.freeze({open,close,execute,parseCommand,findNavigation,stopVoice,app:APP,version:'66.05'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();