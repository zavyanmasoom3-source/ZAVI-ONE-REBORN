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

/* Owner-approved neon account recovery – same ZAVI ONE blue family as PIN.
   Original cloud sign-in, ownership approval, server RPC and PIN reset untouched. */
#z24Recovery{
 --z66r-paper:#162f69;--z66r-deep:#0c1d4a;--z66r-field:#16336c;
 --z66r-ink:#f9fcff;--z66r-muted:#cbdffa;--z66r-border:#608cd0;
 --z66r-glow:#14d7ff;--z66r-warn:#ffd2db;
 background:radial-gradient(ellipse 90% 65% at 85% 10%,#122f77d9,transparent 72%),
 radial-gradient(ellipse 90% 55% at 14% 90%,#342d86d9,transparent 75%),
 rgba(4,12,38,.95)!important;
 padding:calc(12px + env(safe-area-inset-top,0px))
  max(12px,env(safe-area-inset-right,0px))
  calc(12px + env(safe-area-inset-bottom,0px))
  max(12px,env(safe-area-inset-left,0px))!important;
 overflow-x:hidden!important;
 scrollbar-width:none!important;
}
#z24Recovery::-webkit-scrollbar{display:none!important;width:0!important}
#z24Recovery .z24-pbox{
 position:relative;isolation:isolate;
 width:min(410px,100%)!important;
 max-height:calc(100vh - 24px)!important;
 max-height:calc(100dvh - 24px)!important;
 overflow-x:hidden!important;overflow-y:auto!important;
 scrollbar-width:none!important;
 margin:auto!important;padding:16px!important;
 background:linear-gradient(150deg,var(--z66r-paper),var(--z66r-deep) 90%)!important;
 border:1px solid #71d8f2bc!important;border-radius:23px!important;
 box-shadow:0 0 0 1px #4576c455 inset,0 22px 65px #0009,
 0 0 40px #1189ed24!important;
 color:var(--z66r-ink)!important;
 animation:z66rec-pop .48s cubic-bezier(.19,1,.22,1) both;
}
#z24Recovery .z24-pbox::-webkit-scrollbar{display:none!important;width:0!important}
#z24Recovery .z24-pbox::before{
 content:"";display:block;position:absolute;inset:0 0 auto;height:3px;z-index:0;
 background:linear-gradient(90deg,#6a4dff,#18daff,#2e82ff,#9b53ff);
 background-size:210% auto;animation:z66rec-line 8s linear infinite;
 pointer-events:none;
}
#z24Recovery .z24-pbox::after{
 content:"";position:absolute;inset:auto 0 -13% 0;height:130px;
 z-index:0;pointer-events:none;opacity:.65;
 background:radial-gradient(ellipse at 45% 95%,#0bd2ff75,transparent 65%),
 radial-gradient(ellipse at 95% 80%,#8853eb8a,transparent 65%);
 filter:blur(12px);
}
#z24Recovery .z24-pbox > *{position:relative;z-index:1;max-width:100%}
#z24Recovery .z24-ph{padding:0 0 9px!important;display:flex;flex-direction:column;align-items:center;gap:3px}
#z24Recovery #z24Cancel{
 align-self:flex-start;width:auto;min-width:0;min-height:37px;
 padding:6px 12px!important;margin:0 0 6px!important;
 color:#d5efff!important;background:#132f66!important;
 border:1px solid #7fa9e8!important;border-radius:22px!important;
 font-size:11px!important;font-weight:700!important;
 box-shadow:none!important;
}
#z24Recovery .z66rec-brand{
 display:flex;align-items:center;justify-content:center;gap:8px;
 font:850 16px/1.3 system-ui,Arial,sans-serif;letter-spacing:.015em;
 color:var(--z66r-ink);margin:3px 0 1px;
}
#z24Recovery .z66rec-mark{
 width:37px;height:37px;display:grid;place-items:center;
 color:#fff;line-height:1;font:900 18px/1 system-ui,Arial,sans-serif;
 border:1px solid #5feaff;border-radius:11px;
 background:linear-gradient(135deg,#167adf,#18d7ed);
 box-shadow:0 0 18px #10aeee86;
}
#z24Recovery .z66rec-shield{
 display:grid;place-items:center;position:relative;
 width:73px;height:73px;margin:4px auto 2px;
 border:1px solid #6cbeff;border-radius:24px;
 background:radial-gradient(circle at 42% 20%,#59eafa50,#1562c775 55%,#152765);
 box-shadow:0 0 25px #14c9ff52,0 0 40px #6755ff3f;
 animation:z66rec-shield 5.5s ease-in-out infinite;
}
#z24Recovery .z66rec-shield svg{
 width:45px;height:45px;stroke:#eefaff;fill:none;stroke-width:1.7;
 stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 0 7px #65e7ff99);
}
#z24Recovery .z24-ph h2{
 margin:2px 0 0!important;
 color:var(--z66r-ink)!important;
 text-align:center;font-size:clamp(18px,5vw,22px)!important;
 text-shadow:0 2px 10px #082b596e;
}
#z24Recovery .z24-ph p{
 margin:1px 0 0!important;text-align:center!important;max-width:290px;
 color:var(--z66r-muted)!important;font-size:12px!important;
}
#z24Recovery .z24-progress{
 width:100%;margin:9px 0 12px!important;gap:5px!important;
}
#z24Recovery .z24-progress span{
 min-width:0;padding:7px 2px!important;border-radius:11px!important;
 background:var(--z66r-field)!important;color:var(--z66r-muted)!important;
 border:1px solid var(--z66r-border)!important;
 transition:border-color .18s ease,background .18s ease,box-shadow .18s ease!important;
}
#z24Recovery .z24-progress span[data-current="true"]{
 color:#fff!important;background:linear-gradient(125deg,#174cc1,#0c9fca)!important;
 border-color:#6ee9ff!important;box-shadow:0 0 13px #10beed44!important;
}
#z24Recovery .z24-progress span :is(b,small){color:inherit!important}
#z24Recovery .z24-stage{
 margin:0;padding:12px!important;
 color:var(--z66r-ink)!important;
 background:linear-gradient(145deg,#132c6199,#0d2453cc)!important;
 border:1px solid var(--z66r-border)!important;border-radius:15px!important;
}
#z24Recovery .z24-stagetitle{color:var(--z66r-ink)!important}
#z24Recovery .z24-stagehint{color:var(--z66r-muted)!important}
#z24Recovery .z24-pfield{
 color:var(--z66r-ink)!important;font-size:12px!important;
}
#z24Recovery .z24-pfield :is(input,select){
 color:var(--z66r-ink)!important;background:var(--z66r-field)!important;
 border:1px solid var(--z66r-border)!important;border-radius:11px!important;
 min-height:46px!important;
}
#z24Recovery .z24-pfield input::placeholder{color:var(--z66r-muted)!important;opacity:1}
#z24Recovery .z24-pbtn:not(.alt){
 min-height:46px!important;border:1px solid #52d6f0!important;
 border-radius:12px!important;background:linear-gradient(105deg,#1e65ee,#0bc9d7)!important;
 color:#fff!important;font-size:13px!important;
 box-shadow:0 6px 16px #08a5ed44!important;
 transition:transform .18s ease,box-shadow .18s ease!important;
}
#z24Recovery .z24-pbtn:not(.alt):active:not(:disabled){transform:scale(.985)}
#z24Recovery .z24-pbtn.alt{
 background:#183a76!important;border-color:#5e91db!important;color:#e4f4ff!important;
}
#z24Recovery .z24-pstatus{
 color:var(--z66r-muted)!important;
 border-radius:11px;margin:10px 1px 0!important;
 padding:8px 9px!important;
 background:#14426f99;border:1px solid #4c7eb077;
}
#z24Recovery .z24-pstatus.err{color:var(--z66r-warn)!important;border-color:#ee92ad88}
#z24Recovery .z24-support{
 color:var(--z66r-muted)!important;
 font-size:11px!important;line-height:1.7!important;
 margin:9px 1px 0!important;
}
#z24Recovery .z24-support [dir="ltr"]{unicode-bidi:isolate}
#z24Recovery :is(button,input,select):focus-visible{
 outline:3px solid #65e9ff!important;outline-offset:2px!important;
}
html[data-zavi-theme="light"] #z24Recovery,
html[data-zavi-appearance="light"] #z24Recovery{
 --z66r-paper:#f2f8ff;--z66r-deep:#e1efff;--z66r-field:#fff;
 --z66r-ink:#173a60;--z66r-muted:#3d5e85;--z66r-border:#9cc3ee;
 --z66r-warn:#9c1737;
 background:rgba(12,33,68,.62)!important;
}
html[data-zavi-theme="light"] #z24Recovery .z24-stage,
html[data-zavi-appearance="light"] #z24Recovery .z24-stage{
 background:#f8fbff!important;
}
html[data-zavi-theme="light"] #z24Recovery .z24-pstatus,
html[data-zavi-appearance="light"] #z24Recovery .z24-pstatus{
 background:#e5f1ff!important;border-color:#b4cdec!important;
}
html[data-zavi-theme="light"] #z24Recovery .z24-pbtn.alt,
html[data-zavi-appearance="light"] #z24Recovery .z24-pbtn.alt,
html[data-zavi-theme="light"] #z24Recovery #z24Cancel,
html[data-zavi-appearance="light"] #z24Recovery #z24Cancel{
 color:#174c7f!important;background:#eef6ff!important;border-color:#7ca9da!important;
}
html[data-zavi-theme="light"] #z24Recovery .z24-progress span,
html[data-zavi-appearance="light"] #z24Recovery .z24-progress span{
 background:#f8fcff!important;color:#345b85!important;
}
html[data-zavi-theme="light"] #z24Recovery .z24-progress span[data-current="true"],
html[data-zavi-appearance="light"] #z24Recovery .z24-progress span[data-current="true"]{
 color:#fff!important;background:linear-gradient(125deg,#175ab9,#1b9cb8)!important;
}
@keyframes z66rec-pop{from{opacity:0;transform:translateY(12px) scale(.975)}
 to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes z66rec-line{to{background-position:210% 0}}
@keyframes z66rec-shield{50%{box-shadow:0 0 30px #14c9ff8c,0 0 42px #6755ff65}}
html[data-z637-no-motion="true"] #z24Recovery *,
html.zx-lite #z24Recovery *,
html[data-z637-no-motion="true"] #z24Recovery .z24-pbox::before,
html.zx-lite #z24Recovery .z24-pbox::before{
 animation:none!important;transition:none!important;
}
@media(prefers-reduced-motion:reduce){
 #z24Recovery *,#z24Recovery .z24-pbox::before{
 animation:none!important;transition:none!important}
}
@media(max-height:600px){
 #z24Recovery .z24-pbox{
 max-height:calc(100dvh - 12px)!important;
 padding:10px!important;
 }
 #z24Recovery .z66rec-shield{width:52px;height:52px;border-radius:17px}
 #z24Recovery .z66rec-shield svg{width:32px;height:32px}
 #z24Recovery .z24-progress{margin:5px 0 8px!important}
}
@media(max-width:360px){
 #z24Recovery .z24-pbox{padding:11px!important}
 #z24Recovery .z66rec-shield{width:60px;height:60px;border-radius:19px}
 #z24Recovery .z66rec-shield svg{width:38px;height:38px}
}
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
     <div class="z66rec-brand" aria-hidden="true"><span class="z66rec-mark">Z1</span><span>ZAVI ONE</span></div>
     <div class="z66rec-shield" aria-hidden="true">
       <svg viewBox="0 0 48 48" focusable="false">
         <path d="M24 3 41 10v12c0 11-6.5 18.2-17 22C13.5 40.2 7 33 7 22V10Z"/>
         <rect x="17" y="22" width="14" height="12" rx="3"/>
         <path d="M20 22v-4a4 4 0 0 1 8 0v4M24 28v2"/>
       </svg>
     </div>
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
 // Move the existing native cancel action to the header, not a fake back button.
 // No extra bypass or recovery endpoint is introduced.
 const cancel=div.querySelector('#z24Cancel');
 if(cancel)div.querySelector('.z24-ph')?.prepend(cancel);
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
