/* ZAVI ONE 24: password/PIN recovery request, verified by سرور مرکزی owner auth and seller approval.
   Never transmits, stores or exposes the old/new PIN to the ZAVI ADMIN server. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
let ownSession=null,authUser=null,workspaces=[],chosen='',requestId='',busy=false,visible=false,returnFocus=null;
const css=`
/* Owner sheet 11: live PIN recovery follows the same offline-safe theme tokens. */
#z24Recovery{position:fixed;inset:0;z-index:2147483000;
 display:grid;place-items:center;overflow:auto;overscroll-behavior:contain;
 padding:calc(16px + env(safe-area-inset-top)) 14px calc(16px + env(safe-area-inset-bottom));
 background:rgba(8,19,37,.75);color:var(--zds-text);
 font:14px var(--zds-font-family,Vazirmatn,Tahoma,Arial,sans-serif);direction:inherit;box-sizing:border-box}
html[dir="ltr"] #z24Recovery{direction:ltr!important}
html[dir="rtl"] #z24Recovery{direction:rtl!important}
#z24Recovery *,#z24Recovery *::before,#z24Recovery *::after{box-sizing:border-box}
#z24Recovery .z24-pbox{width:min(460px,100%);min-width:0;margin:auto;
 padding:clamp(16px,4vw,25px);border-radius:22px;
 background:var(--zds-surface,#fff)!important;color:var(--zds-text)!important;
 border:1px solid var(--zds-border);box-shadow:0 24px 68px #0005}
#z24Recovery .z24-ph{background:var(--zds-surface-alt);border:1px solid var(--zds-border);
 border-radius:15px;text-align:center;padding:13px 14px;color:var(--zds-text)}
#z24Recovery .z24-ph h2{margin:0;font-size:18px;line-height:1.5}
#z24Recovery .z24-ph p{margin:5px 0 0;color:var(--zds-muted);font-size:12px;line-height:1.7}
#z24Recovery .z24-note{background:var(--zds-surface-alt);
 color:var(--zds-muted);border:1px solid var(--zds-border);
 border-radius:12px;line-height:1.75;padding:11px;margin:12px 0;
 font-size:12px;overflow-wrap:anywhere}
#z24Recovery .z24-pfield{display:block;margin:10px 0;font-size:12px;
 font-weight:750;color:var(--zds-text)}
#z24Recovery .z24-pfield input,#z24Recovery .z24-pfield select{
 display:block;width:100%;min-width:0;min-height:46px;border:1px solid var(--zds-border);
 background:var(--zds-input);color:var(--zds-text);border-radius:12px;
 padding:9px 12px;margin-top:5px;outline-offset:2px;
 font-family:inherit;font-size:14px}
#z24Recovery :is(input,select,button):focus-visible{
 outline:3px solid var(--zds-focus);outline-offset:2px}
#z24Recovery .z24-pfield input::placeholder{color:var(--zds-muted);opacity:1}
#z24Recovery .z24-pactions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
 gap:8px;margin:12px 0}
#z24Recovery .z24-pbtn{min-height:46px;min-width:0;
 border:1px solid var(--zds-button);border-radius:11px;
 background:var(--zds-button);color:var(--zds-button-text);
 padding:9px 10px;font:750 12px var(--zds-font-family,Vazirmatn,Tahoma,Arial,sans-serif);
 line-height:1.5;cursor:pointer;white-space:normal;overflow-wrap:anywhere}
#z24Recovery .z24-pbtn.alt{background:var(--zds-surface-alt);
 border-color:var(--zds-border);color:var(--zds-text)}
#z24Recovery .z24-pbtn:disabled{opacity:.6;cursor:not-allowed}
#z24Recovery .z24-pstatus{font-size:12px;line-height:1.8;
 color:var(--zds-muted);white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0}
#z24Recovery .z24-pstatus.err{color:var(--zds-danger)}
#z24Recovery #z24Cancel{width:100%;margin-top:7px}
#z24Recovery [hidden]{display:none!important}
@media(max-width:360px){#z24Recovery{padding-inline:9px}
 #z24Recovery .z24-pactions{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){#z24Recovery *{animation:none!important;transition:none!important}}
`;

const recoveryLabels={
 'fa-AF':{heading:'بازیابی رمز خصوصی',subheading:'هویت مالک حساب برای بازیابی تأیید می‌شود.',intro:'با ایمیل و رمز حساب آنلاین وارد شوید، دوکان را انتخاب کنید و تأیید مدیریت را درخواست کنید. رمز قبلی و تازه به مدیریت ارسال نمی‌شود.',email:'ایمیل حساب آنلاین',password:'رمز حساب آنلاین (نه رمز خصوصی برنامه)',login:'ورود به حساب آنلاین',load:'انتخاب دوکان قبلی',workspace:'دوکان من',ask:'درخواست تأیید',check:'بررسی پاسخ مدیریت',finish:'تأیید و انتخاب رمز تازه',cancel:'بازگشت به قفل برنامه',support:'بازیابی به اینترنت نیاز دارد. معلومات حسابداری حذف نمی‌شود.',initial:'پس از تأیید مدیریت رمز تازه بسازید.',select:'ابتدا وارد حساب آنلاین شوید'},
 'ps-AF':{heading:'د شخصي رمز بېرته ترلاسه کول',subheading:'د حساب د مالک هویت تاییدېږي.',intro:'د خپل انلاین حساب ایمیل او رمز ولیکئ، دوکان وټاکئ او له مدیریت څخه تایید وغواړئ. شخصي رمز مدیریت ته نه استول کېږي.',email:'د انلاین حساب ایمیل',password:'د انلاین حساب رمز (شخصي رمز نه دی)',login:'انلاین حساب ته ننوتل',load:'پخوانی دوکان ټاکل',workspace:'زما دوکان',ask:'د تایید غوښتنه',check:'د مدیریت ځواب کتل',finish:'تایید او نوی رمز ټاکل',cancel:'د اپ قلف ته ستنېدل',support:'بیا رغونه انټرنېټ ته اړتیا لري. د حسابدارۍ معلومات نه پاکېږي.',initial:'له تایید وروسته نوی رمز جوړ کړئ.',select:'لومړی انلاین حساب ته ننوځئ'},
 'en':{heading:'Recover private PIN',subheading:'Verify the online account owner to recover access.',intro:'Sign in with your online account, select your store and request management approval. Previous and new PINs are never shared with management.',email:'Online account email',password:'Online account password (not the device PIN)',login:'Sign in to online account',load:'Select previous store',workspace:'My store',ask:'Request approval',check:'Check approval status',finish:'Confirm and choose new PIN',cancel:'Back to app lock',support:'Recovery needs internet. Accounting records are not deleted.',initial:'After approval, set a new PIN on this device.',select:'Sign in to your online account first'}
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
function makeShell(){if(!$('z24RecoveryStyle')){let s=document.createElement('style');s.id='z24RecoveryStyle';s.textContent=css;document.head.appendChild(s)}const div=document.createElement('div');div.id='z24Recovery';div.setAttribute('role','dialog');div.setAttribute('aria-modal','true');div.setAttribute('aria-labelledby','z24RecoveryHeading');div.setAttribute('aria-describedby','z24RecoveryIntro');div.tabIndex=-1;div.innerHTML=`<div class="z24-pbox"><div class="z24-ph"><h2 id="z24RecoveryHeading" data-z24-label="heading">بازیابی رمز شخصی ZAVI ONE</h2><p data-z24-label="subheading">تأیید هویت مالک حساب برای بازیابی</p></div><p class="z24-note" id="z24RecoveryIntro" data-z24-label="intro">برای بازیابی وارد حساب آنلاین شوید.</p><div id="z24LoginFields"><label class="z24-pfield"><span data-z24-label="email">ایمیل حساب آنلاین</span><input id="z24Email" type="email" dir="ltr" autocomplete="username" placeholder="you@example.com"></label><label class="z24-pfield"><span data-z24-label="password">رمز حساب آنلاین</span><input id="z24Password" type="password" autocomplete="current-password" placeholder="رمز حساب سرور مرکزی"></label></div><div class="z24-pactions"><button type="button" data-z24-label="login" class="z24-pbtn" id="z24Login">ورود و دریافت دوکان‌ها</button><button type="button" data-z24-label="load" class="z24-pbtn alt" id="z24Load">انتخاب دوکان از حساب قبلی</button></div><label class="z24-pfield"><span data-z24-label="workspace">دوکان من</span><select id="z24Workspace"><option value="" data-z24-label="select">اول وارد حساب آنلاین شوید</option></select></label><div class="z24-pactions"><button type="button" data-z24-label="ask" class="z24-pbtn" id="z24Ask" disabled>📨 ارسال درخواست به مدیریت</button><button type="button" data-z24-label="check" class="z24-pbtn alt" id="z24Check" disabled>↻ بررسی پاسخ مدیریت</button><button type="button" data-z24-label="finish" class="z24-pbtn alt" id="z24Finish" disabled>✓ تأیید و ساخت رمز تازه</button></div><p class="z24-pstatus" id="z24RecoveryStatus" role="status" aria-live="polite" aria-atomic="true" data-z24-label="initial">بعد از تأیید مدیریت رمز تازه بسازید.</p><p class="z24-note"><span data-z24-label="support">بازیابی به اینترنت نیاز دارد؛ معلومات پاک نمی‌شود.</span> <span dir="ltr">0764713434</span></p><button type="button" data-z24-label="cancel" class="z24-pbtn alt" id="z24Cancel">✕ برگشت به قفل برنامه</button></div>`;document.body.appendChild(div);div.addEventListener('click',handle);div.addEventListener('keydown',recoveryKeydown);paintRecovery();$('z24Load').disabled=!selectedToken();$('z24Workspace').addEventListener('change',()=>{chosen=$('z24Workspace').value;requestId=chosen?localStorage.getItem('zavi_v24_pin_request_'+chosen)||'':'';$('z24Ask').disabled=!chosen;$('z24Check').disabled=!requestId;$('z24Finish').disabled=!requestId;notice(requestId?'previous':'selectStore')});}
function close(){visible=false;$('z24Recovery')?.remove();ownSession=null;authUser=null;workspaces=[];chosen='';requestId='';const target=returnFocus;returnFocus=null;if(target?.isConnected)target.focus();}
async function login(){const email=$('z24Email').value.trim(),password=$('z24Password').value;if(!email||!password)throw Error(recoveryNoticeText('noEmail'));const r=await api('/auth/v1/token?grant_type=password',{auth:false,body:{email,password}});if(!r?.access_token||!r?.user?.id)throw Error(recoveryNoticeText('badLogin'));ownSession=r;authUser=r.user;$('z24Password').value='';await fetchWorkspaces()}
async function fetchWorkspaces(){const s=selectedUser();if(!s?.id||!selectedToken())throw Error(recoveryNoticeText('needOnline'));const result=await api('/rest/v1/zavi_workspaces?select=id,name,owner_uid&owner_uid=eq.'+encodeURIComponent(s.id),{method:'GET'});if(!Array.isArray(result))throw Error('لیست دوکان‌ها دریافت نشد.');workspaces=result;const select=$('z24Workspace');select.innerHTML='<option value="">'+esc(recoveryNoticeText('selectOption'))+'</option>'+result.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');if(!result.length)throw Error(recoveryNoticeText('noStores'));const old=window.zaviCloudRestoreInfo?.()?.workspace;if(result.some(r=>r.id===old))select.value=old;else if(result.length===1)select.value=result[0].id;select.dispatchEvent(new Event('change'));notice('onlineLogin');}
async function ask(){if(!chosen)throw Error(recoveryNoticeText('choose'));if(!confirm(recoveryNoticeText('continueAsk')))return;const id=await rpc('zavi_pin_reset_request',{p_workspace_id:chosen});if(typeof id!=='string'||!id)throw Error('شناسه درخواست از سرور دریافت نشد.');requestId=id;localStorage.setItem('zavi_v24_pin_request_'+chosen,id);$('z24Check').disabled=false;$('z24Finish').disabled=false;notice('asked')}
async function status(){if(!requestId||!chosen)throw Error(recoveryNoticeText('noRequest'));const data=await rpc('zavi_pin_reset_status',{p_request_id:requestId});const row=Array.isArray(data)?data[0]:null;if(!row||row.workspace_id!==chosen)throw Error(recoveryNoticeText('mismatch'));if(row.request_status==='approved'){notice('approved');return true}
 notice(['pending','denied','expired','used'].includes(row.request_status)?row.request_status:'invalidStatus');return false}
async function finish(){if(!requestId||!chosen)throw Error(recoveryNoticeText('noRequest'));let linked=null;try{linked=JSON.parse(localStorage.getItem('z20_workspace_id')||'null')}catch{linked=null}if(linked&&linked!==chosen)throw Error(recoveryNoticeText('differentStore'));if(!(await status()))return;try{const probe='zavi_v24_recovery_storage_test';localStorage.setItem(probe,'1');localStorage.removeItem(probe)}catch{throw Error(recoveryNoticeText('browserStorage'))}if(!confirm(recoveryNoticeText('continueReset')))return;
 const ok=await rpc('zavi_pin_reset_consume',{p_request_id:requestId});if(ok!==true)throw Error(recoveryNoticeText('consumed'));localStorage.removeItem('zavi_v24_pin_request_'+chosen);close();document.dispatchEvent(new Event('zavi-v24-pin-reset-success'));alert(recoveryNoticeText('completed'));}
async function handle(e){const b=e.target.closest('button');if(!b||busy)return;const id=b.id;if(id==='z24Cancel'){close();return}if(!['z24Login','z24Load','z24Ask','z24Check','z24Finish'].includes(id))return;e.preventDefault();busy=true;const controls=$('z24Recovery')?.querySelectorAll('button');controls?.forEach(x=>{if(x.id!=='z24Cancel')x.disabled=true});try{
 if(id==='z24Login')await login();if(id==='z24Load')await fetchWorkspaces();if(id==='z24Ask')await ask();if(id==='z24Check')await status();if(id==='z24Finish')await finish();
 }catch(err){state(recoveryNoticeText('error')+': '+err.message,true)}finally{busy=false;if($('z24Recovery')){const logged=!!selectedToken();$('z24Login').disabled=false;$('z24Load').disabled=!logged;$('z24Ask').disabled=!chosen;$('z24Check').disabled=!requestId;$('z24Finish').disabled=!requestId}}}
function open(){if(visible)return;returnFocus=$('zawiForgotPinBtn')||document.activeElement;visible=true;makeShell();$('z24Email')?.focus();if(selectedToken()&&selectedUser()?.id)fetchWorkspaces().catch(e=>state(recoveryNoticeText('needOnline')+': '+e.message,true));}
document.addEventListener('click',e=>{if(e.target.closest('#zawiForgotPinBtn')){e.preventDefault();open()}});
})();
