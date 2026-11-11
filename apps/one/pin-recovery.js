/* ZAVI ONE 24: password/PIN recovery request, verified by سرور مرکزی owner auth and seller approval.
   Never transmits, stores or exposes the old/new PIN to the ZAVI ADMIN server. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
let ownSession=null,authUser=null,workspaces=[],chosen='',requestId='',busy=false,visible=false,returnFocus=null;
// Approved V66.62 recovery-only UI. Server verification and PIN reset stay unchanged.
let recoveryStep=1,resetApproved=false;
const css=`
/* Approved V66.62 recovery-only four-stage modal; all other UI is unchanged. */
#z24Recovery{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;
 overflow-y:auto;overscroll-behavior:contain;padding:calc(14px + env(safe-area-inset-top)) 12px calc(14px + env(safe-area-inset-bottom));
 background:rgba(6,15,38,.78);font:14px var(--zds-font-family,Vazirmatn,Tahoma,Arial,sans-serif);
 box-sizing:border-box;direction:inherit}
html[dir="ltr"] #z24Recovery{direction:ltr!important}
html[dir="rtl"] #z24Recovery{direction:rtl!important}
#z24Recovery *,#z24Recovery *::before,#z24Recovery *::after{box-sizing:border-box}
#z24Recovery .z24-pbox{width:min(430px,100%);min-width:0;margin:auto;padding:17px;
 border-radius:21px;background:linear-gradient(154deg,#1d4389 0%,#152e66 46%,#10244e 100%);
 border:1px solid #577ec0;color:#f7fbff;box-shadow:0 24px 65px #0007}
#z24Recovery .z24-ph{padding:2px 2px 10px;text-align:start}
#z24Recovery .z24-ph h2{margin:0;font-size:21px;line-height:1.55;color:#fff}
#z24Recovery .z24-ph p{margin:4px 0 0;color:#d7e5ff;font-size:12px;line-height:1.65}
#z24Recovery .z24-progress{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
 gap:5px;margin:7px 0 14px}
#z24Recovery .z24-progress span{display:flex;flex-direction:column;align-items:center;gap:4px;
 min-width:0;padding:8px 2px;border-radius:10px;border:1px solid #5479b8;
 background:#112655;color:#b9cde8;font-size:11px;text-align:center}
#z24Recovery .z24-progress span b{font-size:13px;font-weight:750}
#z24Recovery .z24-progress span[data-current="true"]{background:#2261ac;
 border-color:#73dff6;color:#fff}
#z24Recovery .z24-stage{padding:14px 13px;border-radius:15px;
 background:#0b1b42bf;border:1px solid #335a93}
#z24Recovery .z24-stagetitle{font-size:15px;font-weight:750;color:#fff;margin:0 0 5px}
#z24Recovery .z24-stagehint{color:#c4d7f4;line-height:1.6;margin:0 0 10px;font-size:12px}
#z24Recovery .z24-pfield{display:block;margin:10px 0;color:#e5f0ff;font-size:12px;font-weight:700}
#z24Recovery .z24-pfield input,#z24Recovery .z24-pfield select{display:block;
 width:100%;min-width:0;min-height:45px;border:1px solid #6684b6;
 border-radius:10px;background:#1b3566;color:#fff;padding:9px 12px;
 margin-top:6px;outline-offset:2px;font-family:inherit;font-size:14px}
#z24Recovery .z24-pfield select option{background:#132957;color:#fff}
#z24Recovery .z24-pfield input::placeholder{color:#b5c9e5;opacity:1}
#z24Recovery :is(button,input,select):focus-visible{outline:3px solid #80e7fa;outline-offset:2px}
#z24Recovery .z24-pbtn{display:block;width:100%;min-height:44px;margin-top:9px;
 border:1px solid #43c6eb;border-radius:11px;background:linear-gradient(110deg,#2677bd,#13bcd2);
 padding:9px 12px;color:#fff;cursor:pointer;
 font:750 13px var(--zds-font-family,Vazirmatn,Tahoma,Arial,sans-serif);line-height:1.55}
#z24Recovery .z24-pbtn.alt{background:#19396f;border-color:#547eb5;color:#e5f2ff}
#z24Recovery .z24-pbtn:disabled{opacity:.48;cursor:not-allowed}
#z24Recovery .z24-pstatus{font-size:12px;line-height:1.65;color:#d6e6ff;
 white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 2px 5px}
#z24Recovery .z24-pstatus.err{color:#ffd4d4}
#z24Recovery .z24-support{display:flex;gap:6px;justify-content:center;
 flex-wrap:wrap;color:#c8defa;font-size:11px;margin:13px 0 7px;text-align:center}
#z24Recovery #z24Cancel{margin-top:12px}
#z24Recovery [hidden]{display:none!important}
@media(max-width:360px){#z24Recovery{padding-inline:7px}
 #z24Recovery .z24-pbox{padding:11px}
 #z24Recovery .z24-stage{padding:11px}}
@media(prefers-reduced-motion:reduce){#z24Recovery *{animation:none!important;transition:none!important}}
`;

const recoveryLabels={
 'fa-AF':{
  heading:'بازیابی حساب',intro:'حساب خود را در چند مرحله بازیابی کنید.',
  stepAccount:'حساب',stepStore:'دکان',stepRequest:'درخواست',stepPin:'رمز جدید',
  email:'ایمیل حساب آنلاین',password:'رمز حساب آنلاین (نه رمز خصوصی برنامه)',
  login:'دریافت دکان‌ها',load:'استفاده از حساب قبلی',workspace:'دکان من',
  next:'ادامه',back:'بازگشت',ask:'درخواست بازیابی',check:'بررسی پاسخ',
  finish:'ساخت رمز جدید',cancel:'بازگشت به ورود',
  storeHint:'دکان مربوط به حساب خود را انتخاب کنید.',
  requestHint:'درخواست شما برای تأیید به مدیریت ارسال می‌شود.',
  pinHint:'مدیریت تأیید کرده است. برای ساخت رمز جدید در همین دستگاه ادامه دهید.',
  support:'بازیابی به اینترنت نیاز دارد؛ معلومات حسابداری پاک نمی‌شود.',
  initial:'برای شروع، حساب آنلاین خود را تأیید کنید.',select:'انتخاب دکان'
 },
 'ps-AF':{
  heading:'د حساب بېرته ترلاسه کول',intro:'خپل حساب په څو اسانه پړاوونو کې بېرته ترلاسه کړئ.',
  stepAccount:'حساب',stepStore:'دوکان',stepRequest:'غوښتنه',stepPin:'نوی رمز',
  email:'د انلاین حساب ایمیل',password:'د انلاین حساب رمز (د اپ شخصي رمز نه دی)',
  login:'دوکانونه ترلاسه کول',load:'له پخواني حساب څخه کار اخیستل',workspace:'زما دوکان',
  next:'دوام',back:'بېرته',ask:'د بیا رغونې غوښتنه',check:'ځواب کتل',
  finish:'نوی رمز جوړول',cancel:'ننوتلو ته ستنېدل',
  storeHint:'د خپل حساب دوکان وټاکئ.',
  requestHint:'ستاسو غوښتنه د تایید لپاره مدیریت ته لېږل کېږي.',
  pinHint:'مدیریت تایید کړی. د همدې وسیلې نوی رمز جوړولو ته دوام ورکړئ.',
  support:'بیا رغونه انټرنېټ ته اړتیا لري؛ د حسابدارۍ معلومات نه پاکېږي.',
  initial:'لومړی خپل انلاین حساب تایید کړئ.',select:'دوکان وټاکئ'
 },
 'en':{
  heading:'Recover account',intro:'Recover access in a few simple steps.',
  stepAccount:'Account',stepStore:'Store',stepRequest:'Request',stepPin:'New PIN',
  email:'Online account email',password:'Online account password (not the device PIN)',
  login:'Get stores',load:'Use existing online account',workspace:'My store',
  next:'Continue',back:'Back',ask:'Request recovery',check:'Check response',
  finish:'Create new PIN',cancel:'Back to sign in',
  storeHint:'Select the store associated with your account.',
  requestHint:'Your request is sent to management for approval.',
  pinHint:'Management approved. Continue to create a new PIN on this device.',
  support:'Internet is required; accounting records are not deleted.',
  initial:'Verify your online account to get started.',select:'Select store'
 }
};
/* Client-side status strings for the verified recovery workflow.
 * Only the server may approve, consume or revoke a reset request. */
const RECOVERY_NOTICES={
 selectStore:['دوکان خود را انتخاب کرده و درخواست بازیابی بفرستید.','خپل دوکان وټاکئ او د بیا رغونې غوښتنه وکړئ.','Select your store and request recovery.'],
 previous:['درخواست قبلی پیدا شد؛ برای بررسی وضعیت دکمهٔ پاسخ مدیریت را بزنید.','پخوانۍ غوښتنه وموندل شوه؛ د مدیریت ځواب وګورئ.','Existing request found; check management approval.'],
 choose:['دوکان را انتخاب کنید.','دوکان وټاکئ.','Select a store.'],
 onlineLogin:['ورود به حساب آنلاین تأیید شد؛ حالا دوکان خود را انتخاب کنید.','انلاین ننوتل تایید شول؛ اوس دوکان وټاکئ.','Signed in to your online account. Select a store.'],
 asked:['درخواست ثبت شد. برای دریافت نتیجه وضعیت را بررسی کنید.','غوښتنه ثبت شوه؛ د پایلې لپاره حالت وګورئ.','Recovery request recorded. Check approval status.'],
 approved:['مدیریت درخواست شما را تأیید کرد. تا ۳۰ دقیقه فرصت انتخاب رمز تازه دارید.','مدیریت ستاسو غوښتنه تایید کړه؛ د نوي رمز لپاره ۳۰ دقیقې وخت لرئ.','Management approved your request. You have 30 minutes to set a new PIN.'],
 pending:['درخواست منتظر تأیید مدیریت است.','غوښتنه د مدیریت تایید ته منتظره ده.','Waiting for management approval.'],
 denied:['درخواست رد شد؛ با پشتیبانی تماس بگیرید.','غوښتنه رد شوه؛ له ملاتړ سره اړیکه ونیسئ.','Request denied. Contact support.'],
 expired:['مهلت تأیید پایان یافت؛ درخواست تازه بسازید.','د تایید وخت پای ته ورسېد؛ نوې غوښتنه وکړئ.','Approval expired. Create a new request.'],
 used:['این مجوز قبلاً مصرف شده است.','دا اجازه مخکې کارول شوې ده.','This permission has already been used.'],
 invalidStatus:['وضعیت درخواست مشخص نیست.','د غوښتنې حالت معلوم نه دی.','Request status is unknown.'],
 needOnline:['ابتدا با حساب آنلاین وارد شوید.','لومړی انلاین حساب ته ننوځئ.','Sign in to your online account first.'],
 noEmail:['ایمیل و رمز حساب آنلاین را وارد کنید.','د انلاین حساب ایمیل او رمز ولیکئ.','Enter your online account email and password.'],
 badLogin:['ورود آنلاین تأیید نشد.','انلاین ننوتل تایید نه شول.','Online sign-in failed.'],
 noStores:['برای این حساب دوکانی پیدا نشد.','د دې حساب لپاره دوکان ونه موندل شو.','No stores found for this account.'],
 noRequest:['اول درخواست بازیابی را ثبت کنید.','لومړی د بیا رغونې غوښتنه ثبت کړئ.','Create a recovery request first.'],
 mismatch:['این درخواست مربوط به دوکان انتخاب‌شده نیست.','دا غوښتنه د ټاکل شوي دوکان نه ده.','The request does not match the selected store.'],
 differentStore:['دوکان انتخاب‌شده با دوکان فعال این دستگاه متفاوت است.','ټاکل شوی دوکان د دې وسیلې له فعال دوکان سره توپیر لري.','Selected store differs from the active store on this device.'],
 browserStorage:['حافظهٔ این مرورگر قابل ذخیره نیست.','د براوزر حافظه د ساتلو وړ نه ده.','Browser storage is unavailable.'],
 consumed:['مجوز مصرف شده یا اعتبارش پایان یافته است.','اجازه کارول شوې یا یې وخت پای ته رسېدلی دی.','Approval was consumed or has expired.'],
 continueAsk:['درخواست بازیابی به مدیریت فرستاده شود؟','د بیا رغونې غوښتنه مدیریت ته واستول شي؟','Send recovery request to management?'],
 continueReset:['فقط رمز این دستگاه پس از تأیید سرور بازنشانی می‌شود. ادامه می‌دهید؟','یوازې د دې وسیلې رمز د سرور له تایید وروسته بیا جوړېږي. دوام ورکوئ؟','Only this device PIN will be reset after server approval. Continue?'],
 completed:['مجوز تأیید شد. اکنون یک رمز خصوصی ۶ تا ۱۲ رقمی تازه بسازید. معلومات حسابداری حذف نشد.','اجازه تایید شوه. اوس له ۶ تر ۱۲ شمېرو نوی شخصي رمز جوړ کړئ. د حسابدارۍ معلومات خوندي دي.','Approval confirmed. Create a new 6–12 digit device PIN. Accounting records were not deleted.'],
 error:['خطا','ستونزه','Error'],selectOption:['دوکان را انتخاب کنید','دوکان وټاکئ','Select a store']
};
function recoveryNoticeText(key){
 const l=String(document.documentElement.lang||'fa-AF').toLowerCase();
 const i=l.startsWith('en')?2:l.startsWith('ps')?1:0;
 return RECOVERY_NOTICES[key]?.[i]||key;
}
function notice(key,err=false){
 const node=$('z24RecoveryStatus');
 if(node){node.dataset.z24Notice=key;node.textContent=recoveryNoticeText(key);node.classList.toggle('err',err);}
}

function paintRecovery(){
 const root=$('z24Recovery');if(!root)return;
 const lang=String(document.documentElement.lang||'fa-AF');
 const words=recoveryLabels[lang.startsWith('en')?'en':lang.startsWith('ps')?'ps-AF':'fa-AF'];
 root.dir=document.documentElement.dir==='ltr'?'ltr':'rtl';
 root.querySelectorAll('[data-z24-label]').forEach(node=>{
  const value=words[node.dataset.z24Label];
  if(value)node.textContent=value;
 });
 const note=$('z24RecoveryStatus');
 if(note?.dataset.z24Notice)note.textContent=recoveryNoticeText(note.dataset.z24Notice);
 updateRecoveryView();
}
function updateRecoveryView(){
 const root=$('z24Recovery');if(!root)return;
 const logged=!!selectedToken(),hasStore=logged&&!!chosen;
 root.dataset.z24CurrentStage=String(recoveryStep);
 root.querySelectorAll('[data-z24-panel]').forEach(panel=>{
   panel.hidden=Number(panel.dataset.z24Panel)!==recoveryStep;
 });
 root.querySelectorAll('[data-z24-step]').forEach(tab=>{
   const n=Number(tab.dataset.z24Step);
   tab.dataset.current=n===recoveryStep?'true':'false';
   tab.setAttribute('aria-current',n===recoveryStep?'step':'false');
 });
 $('z24Load').hidden=!logged;
 $('z24Load').disabled=busy||!logged;
 $('z24Login').disabled=busy;
 $('z24Next').disabled=busy||!hasStore;
 $('z24Ask').disabled=busy||!hasStore;
 $('z24Check').hidden=!requestId;
 $('z24Check').disabled=busy||!hasStore||!requestId;
 $('z24Finish').disabled=busy||!resetApproved||!requestId;
 root.querySelectorAll('[data-z24-back]').forEach(b=>{b.disabled=busy});
}
function setRecoveryStep(next){
 const n=Number(next);
 if(![1,2,3,4].includes(n))return false;
 if(n>=2&&!selectedToken())return false;
 if(n>=3&&!chosen)return false;
 if(n===4&&!resetApproved)return false;
 recoveryStep=n;
 updateRecoveryView();
 return true;
}
function recoveryKeydown(event){
 const root=$('z24Recovery');if(!root)return;
 if(event.key==='Escape'){event.preventDefault();if(!busy)close();return;}
 if(event.key!=='Tab')return;
 const nodes=[...root.querySelectorAll('input:not(:disabled),select:not(:disabled),button:not(:disabled)')]
  .filter(el=>!el.hidden&&el.getClientRects().length>0);
 if(!nodes.length){event.preventDefault();root.focus();return;}
 const first=nodes[0],last=nodes[nodes.length-1],active=document.activeElement;
 if(event.shiftKey&&(active===first||active===root)){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(active===last||active===root)){event.preventDefault();first.focus();}
}
document.addEventListener('zavi:language-change',paintRecovery);
new MutationObserver(paintRecovery).observe(document.documentElement,{
 attributes:true,attributeFilter:['lang','dir']});
function cfg(){let o={};try{o=JSON.parse(localStorage.getItem('z20_cloud_settings')||'{}')}catch{}const defaults=window.ZAVI_CLOUD_DEFAULTS||{};return {url:(o.url||defaults.url||'').replace(/\/$/,''),key:o.key||defaults.key||''}}
function session(){return window.zaviCloudGetAuthSession?.()||null}
function selectedToken(){const s=session();if(ownSession?.access_token)return ownSession.access_token;if(s?.access_token&&s.user?.id)return s.access_token;return null}
function selectedUser(){return authUser||session()?.user||null}
async function refreshOwnSession(){
 if(!ownSession?.refresh_token)throw Error('نشست ورود پایان یافته است. دوباره با ایمیل و رمز حساب ابری وارد شوید.');
 const c=cfg();const res=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{
  method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},
  body:JSON.stringify({refresh_token:ownSession.refresh_token})
 });
 const next=await res.json();
 if(!res.ok||!next.access_token){ownSession=null;authUser=null;throw Error('نشست ورود پایان یافته است؛ دوباره وارد شوید.');}
 ownSession={...ownSession,...next};
 authUser=ownSession.user||authUser;
 return ownSession;
}
async function api(path,{body,method='POST',auth=true,retry=true}={}){
 const c=cfg();if(!/^https:\/\/[\w.-]+\.supabase\.co$/.test(c.url)||!c.key)throw Error('آدرس و کلید عمومی سرور مرکزی هنوز تنظیم نشده است.');
 if(auth&&ownSession?.expires_at&&Date.now()/1000>Number(ownSession.expires_at)-75){await refreshOwnSession();}
 // A cloud-session refresh must be initiated by cloud.js. We never rotate its token from this modal.
 if(auth&&!ownSession&&session()?.expires_at&&Date.now()/1000>Number(session().expires_at)-75){throw Error('نشست ابری نیاز به تازه‌سازی دارد؛ از همین صفحه با ایمیل و رمز خود وارد شوید.');}
 const hdr={'apikey':c.key,'Content-Type':'application/json'};
 hdr.Authorization='Bearer '+(auth?selectedToken()||'':c.key);
 const res=await fetch(c.url+path,{method,headers:hdr,body:body===undefined?undefined:JSON.stringify(body)});
 let result=null;try{result=await res.json()}catch{}
 if(res.status===401&&auth&&retry&&ownSession?.refresh_token){await refreshOwnSession();return api(path,{body,method,auth,retry:false});}
 if(!res.ok)throw Error(result?.message||result?.error_description||result?.msg||`خطای سرور ${res.status}`);
 return result;
}
const rpc=(name,body)=>api('/rest/v1/rpc/'+name,{body});
function state(text,err=false){const e=$('z24RecoveryStatus');if(e){delete e.dataset.z24Notice;e.textContent=text;e.classList.toggle('err',err)}}
function makeShell(){
 if(!$('z24RecoveryStyle')){
   const sheet=document.createElement('style');
   sheet.id='z24RecoveryStyle';sheet.textContent=css;document.head.appendChild(sheet);
 }
 const div=document.createElement('div');
 div.id='z24Recovery';div.setAttribute('role','dialog');
 div.setAttribute('aria-modal','true');
 div.setAttribute('aria-labelledby','z24RecoveryHeading');
 div.setAttribute('aria-describedby','z24RecoveryIntro');div.tabIndex=-1;
 div.innerHTML=`
 <div class="z24-pbox">
   <header class="z24-ph">
     <h2 id="z24RecoveryHeading" data-z24-label="heading">بازیابی حساب</h2>
     <p id="z24RecoveryIntro" data-z24-label="intro">حساب خود را در چند مرحله بازیابی کنید.</p>
   </header>
   <nav class="z24-progress" aria-label="Recovery progress">
     <span data-z24-step="1"><b>۱</b><small data-z24-label="stepAccount">حساب</small></span>
     <span data-z24-step="2"><b>۲</b><small data-z24-label="stepStore">دکان</small></span>
     <span data-z24-step="3"><b>۳</b><small data-z24-label="stepRequest">درخواست</small></span>
     <span data-z24-step="4"><b>۴</b><small data-z24-label="stepPin">رمز جدید</small></span>
   </nav>
   <section class="z24-stage" data-z24-panel="1" id="z24LoginFields">
     <label class="z24-pfield"><span data-z24-label="email">ایمیل حساب آنلاین</span>
       <input id="z24Email" type="email" dir="ltr" autocomplete="username" placeholder="name@example.com"></label>
     <label class="z24-pfield"><span data-z24-label="password">رمز حساب آنلاین</span>
       <input id="z24Password" type="password" autocomplete="current-password"></label>
     <button type="button" class="z24-pbtn" id="z24Login" data-z24-label="login">دریافت دکان‌ها</button>
     <button type="button" class="z24-pbtn alt" id="z24Load" data-z24-label="load" hidden>استفاده از حساب قبلی</button>
   </section>
   <section class="z24-stage" data-z24-panel="2" hidden>
     <p class="z24-stagetitle" data-z24-label="stepStore">دکان</p>
     <p class="z24-stagehint" data-z24-label="storeHint">دکان مربوط به حساب خود را انتخاب کنید.</p>
     <label class="z24-pfield"><span data-z24-label="workspace">دکان من</span>
       <select id="z24Workspace"><option value="" data-z24-label="select">انتخاب دکان</option></select></label>
     <button type="button" class="z24-pbtn" id="z24Next" data-z24-label="next">ادامه</button>
     <button type="button" class="z24-pbtn alt" data-z24-back="1" data-z24-label="back">بازگشت</button>
   </section>
   <section class="z24-stage" data-z24-panel="3" hidden>
     <p class="z24-stagetitle" data-z24-label="stepRequest">درخواست</p>
     <p class="z24-stagehint" data-z24-label="requestHint">درخواست شما برای تأیید به مدیریت ارسال می‌شود.</p>
     <button type="button" class="z24-pbtn" id="z24Ask" data-z24-label="ask" disabled>درخواست بازیابی</button>
     <button type="button" class="z24-pbtn alt" id="z24Check" data-z24-label="check" disabled hidden>بررسی پاسخ</button>
     <button type="button" class="z24-pbtn alt" data-z24-back="2" data-z24-label="back">بازگشت</button>
   </section>
   <section class="z24-stage" data-z24-panel="4" hidden>
     <p class="z24-stagetitle" data-z24-label="stepPin">رمز جدید</p>
     <p class="z24-stagehint" data-z24-label="pinHint">برای ساخت رمز جدید در همین دستگاه ادامه دهید.</p>
     <button type="button" class="z24-pbtn" id="z24Finish" data-z24-label="finish" disabled>ساخت رمز جدید</button>
     <button type="button" class="z24-pbtn alt" data-z24-back="3" data-z24-label="back">بازگشت</button>
   </section>
   <p class="z24-pstatus" id="z24RecoveryStatus" role="status" aria-live="polite" aria-atomic="true" data-z24-notice="initial">برای شروع، حساب آنلاین خود را تأیید کنید.</p>
   <p class="z24-support"><span data-z24-label="support">بازیابی به اینترنت نیاز دارد؛ معلومات حسابداری پاک نمی‌شود.</span>
      <span dir="ltr">0764713434</span></p>
   <button type="button" class="z24-pbtn alt" id="z24Cancel" data-z24-label="cancel">بازگشت به ورود</button>
 </div>`;
 document.body.appendChild(div);
 div.addEventListener('click',handle);
 div.addEventListener('keydown',recoveryKeydown);
 $('z24Workspace').addEventListener('change',()=>{
   chosen=$('z24Workspace').value;
   requestId=chosen?localStorage.getItem('zavi_v24_pin_request_'+chosen)||'':'';
   resetApproved=false;
   notice(requestId?'previous':'selectStore');
   updateRecoveryView();
 });
 paintRecovery();
 updateRecoveryView();
}
function close(){visible=false;recoveryStep=1;resetApproved=false;$('z24Recovery')?.remove();ownSession=null;authUser=null;workspaces=[];chosen='';requestId='';const target=returnFocus;returnFocus=null;if(target?.isConnected)target.focus();}
async function login(){const email=$('z24Email').value.trim(),password=$('z24Password').value;if(!email||!password)throw Error(recoveryNoticeText('noEmail'));const r=await api('/auth/v1/token?grant_type=password',{auth:false,body:{email,password}});if(!r?.access_token||!r?.user?.id)throw Error(recoveryNoticeText('badLogin'));ownSession=r;authUser=r.user;$('z24Password').value='';await fetchWorkspaces()}
async function fetchWorkspaces(){const s=selectedUser();if(!s?.id||!selectedToken())throw Error(recoveryNoticeText('needOnline'));const result=await api('/rest/v1/zavi_workspaces?select=id,name,owner_uid&owner_uid=eq.'+encodeURIComponent(s.id),{method:'GET'});if(!Array.isArray(result))throw Error('لیست دوکان‌ها دریافت نشد.');workspaces=result;const select=$('z24Workspace');select.innerHTML='<option value="">'+esc(recoveryNoticeText('selectOption'))+'</option>'+result.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');if(!result.length)throw Error(recoveryNoticeText('noStores'));const old=window.zaviCloudRestoreInfo?.()?.workspace;if(result.some(r=>r.id===old))select.value=old;else if(result.length===1)select.value=result[0].id;select.dispatchEvent(new Event('change'));notice('onlineLogin');setRecoveryStep(2);}
async function ask(){if(!chosen)throw Error(recoveryNoticeText('choose'));if(!confirm(recoveryNoticeText('continueAsk')))return;const id=await rpc('zavi_pin_reset_request',{p_workspace_id:chosen});if(typeof id!=='string'||!id)throw Error('شناسه درخواست از سرور دریافت نشد.');requestId=id;localStorage.setItem('zavi_v24_pin_request_'+chosen,id);$('z24Check').disabled=false;$('z24Finish').disabled=false;notice('asked');updateRecoveryView()}
async function status(){if(!requestId||!chosen)throw Error(recoveryNoticeText('noRequest'));const data=await rpc('zavi_pin_reset_status',{p_request_id:requestId});const row=Array.isArray(data)?data[0]:null;if(!row||row.workspace_id!==chosen)throw Error(recoveryNoticeText('mismatch'));if(row.request_status==='approved'){resetApproved=true;notice('approved');setRecoveryStep(4);return true}
 resetApproved=false;notice(['pending','denied','expired','used'].includes(row.request_status)?row.request_status:'invalidStatus');updateRecoveryView();return false}
async function finish(){if(!requestId||!chosen)throw Error(recoveryNoticeText('noRequest'));let linked=null;try{linked=JSON.parse(localStorage.getItem('z20_workspace_id')||'null')}catch{linked=null}if(linked&&linked!==chosen)throw Error(recoveryNoticeText('differentStore'));if(!(await status()))return;try{const probe='zavi_v24_recovery_storage_test';localStorage.setItem(probe,'1');localStorage.removeItem(probe)}catch{throw Error(recoveryNoticeText('browserStorage'))}if(!confirm(recoveryNoticeText('continueReset')))return;
 const ok=await rpc('zavi_pin_reset_consume',{p_request_id:requestId});if(ok!==true)throw Error(recoveryNoticeText('consumed'));localStorage.removeItem('zavi_v24_pin_request_'+chosen);close();document.dispatchEvent(new Event('zavi-v24-pin-reset-success'));alert(recoveryNoticeText('completed'));}
async function handle(e){
 const b=e.target.closest('button');if(!b||busy||!b.closest('#z24Recovery'))return;
 const id=b.id;
 if(id==='z24Cancel'){close();return}
 if(b.hasAttribute('data-z24-back')){
   setRecoveryStep(b.dataset.z24Back);return;
 }
 if(id==='z24Next'){
   if(chosen&&selectedToken())setRecoveryStep(3);
   else notice(chosen?'needOnline':'choose',true);
   return;
 }
 if(!['z24Login','z24Load','z24Ask','z24Check','z24Finish'].includes(id))return;
 if((id==='z24Login'||id==='z24Load')&&recoveryStep!==1)return;
 if((id==='z24Ask'||id==='z24Check')&&recoveryStep!==3)return;
 if(id==='z24Finish'&&(recoveryStep!==4||!resetApproved))return;
 e.preventDefault();
 busy=true;updateRecoveryView();
 try{
   if(id==='z24Login')await login();
   if(id==='z24Load')await fetchWorkspaces();
   if(id==='z24Ask')await ask();
   if(id==='z24Check')await status();
   if(id==='z24Finish')await finish();
 }catch(err){state(recoveryNoticeText('error')+': '+err.message,true)}
 finally{busy=false;updateRecoveryView()}
}
function open(){if(visible)return;recoveryStep=1;resetApproved=false;returnFocus=$('zawiForgotPinBtn')||document.activeElement;visible=true;makeShell();$('z24Email')?.focus();if(selectedToken()&&selectedUser()?.id)fetchWorkspaces().catch(e=>state(recoveryNoticeText('needOnline')+': '+e.message,true));}
document.addEventListener('click',e=>{if(e.target.closest('#zawiForgotPinBtn')){e.preventDefault();open()}});
})();
