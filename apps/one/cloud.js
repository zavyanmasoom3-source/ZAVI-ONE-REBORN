/* ZAVI ONE — optional سرور مرکزی sync. Anonymous/public key ONLY.
 * Security: write permissions are enforced by سرور مرکزی Row-Level Security;
 * client-side disabled inputs are convenience and NOT a security boundary.
 */
(()=>{'use strict';
const OFFLINE_WORKSPACE_KEY='z20_workspace_offline_metadata_v31_';
const TENANT_PENDING_PREFIX='zavi_v34_pending_';
const PREFERRED_WORKSPACE_PREFIX='zavi_v651_preferred_owner_workspace_';
const CFGKEY='z20_cloud_settings', SESSIONKEY='z20_auth_session', PERSISTSESSIONKEY='z20_auth_session_persistent_v23_1', WSKEY='z20_workspace_id', PENDINGKEY='z20_pending_sync', ROLECACHEKEY='z20_role_cached';
const language=()=>window.zaviPublicLanguage?.()||'fa-AF';
const words={
 title:['اتصال دستگاه‌ها و اعضای تیم','د وسیلو او ټیم غړو نښلول','Device sync & team'],
 desc:['ابتدا از ابر اطلاعات فروشگاه دریافت می‌شود؛ هنگام قطع اینترنت، فقط نسخه همان حساب با مجوز معتبر در دستگاه کار می‌کند. اعضای دیگر فقط مشاهده می‌کنند.','اختیاري: اپ له سرور پرته هم کار کوي. څو وسیلو ته خوندي سرور پکار دی؛ نور غړي یوازې لیدلای شي.','Optional: use the app locally or connect a secure cloud service to share live records. Only the owner may edit; team members are view-only.'],
 noServer:['حالت مستقل — معلومات فقط در همین دستگاه','یوازې محلي حالت — په همدې وسیله کې','Local mode — this device only'],
 configured:['سرور آماده اتصال است','سرور چمتو دی','Cloud server configured'],
 setup:['تنظیم سرور (فقط مدیر راه‌اندازی)','د سرور تنظیم (یوازې مدیر)','Server setup (administrator)'],
 url:['آدرس پروژه سرور مرکزی','د سرور مرکزی پروژې پته','سرور مرکزی project URL'],
 key:['کلید عمومی / publishable / anon (نه کلید مخفی)','عامه / anon کلي (پټه کلي مه کاروئ)','Public / anon key (NEVER a secret key)'],
 save:['ذخیره آدرس سرور','د سرور پته خوندي کړئ','Save server details'],
 email:['ایمیل حساب','برېښنالیک','Account email'],
 password:['رمز عبور حساب','د حساب رمز','Account password'],
 signup:['ایجاد حساب','حساب جوړ کړئ','Sign up'],
 login:['ورود','ننوځئ','Sign in'],
 logout:['خروج از ابر','له کلاوډ وتل','Sign out'],
 uid:['شناسه اختصاصی شما (UID)','ستاسې ځانګړی UID','Your account UID'],
 workspaces:['انتخاب فروشگاه مشترک','شریک دوکان وټاکئ','Choose shared business'],
 create:['ایجاد فروشگاه ابری جدید (خالی)','نوی تش کلاوډ دوکان جوړ کړئ','Create a new empty cloud workspace'],
 workspaceName:['نام این فروشگاه ابری','د کلاوډ دوکان نوم','Workspace name'],
 sync:['همگام‌سازی / تازه‌سازی','همغږي / تازه کول','Sync / refresh'],
 invite:['افزودن همکار با UID (بدون اجازه معامله در آغاز)','د همکار UID زیاتول (لومړی بې له معاملې)','Add colleague by UID (no transaction rights initially)'],
 remove:['حذف دسترسی','لاسرسی لرې کړئ','Revoke access'],
 owner:['مالک — اجازه تغییر و ذخیره','مالک — د بدلون او خوندي کولو اجازه','Owner — can edit and save'],
 viewer:['همکار — مجوزها توسط مالک','همکار — د مالک اجازه','Colleague — owner-controlled permissions'],
 localsave:['معلومات محلی و پشتیبان مستقل محفوظ می‌ماند. برای استفاده هم‌زمان در چند دستگاه به حساب آنلاین وارد شوید.','محلي معلومات او بیک اپ پاتې کېږي. د سرور له تنظیم پرته همغږي نه شته.','Local storage and backups remain available. Cross-device sync requires a configured, working server.'],
 pending:['در حال ارسال تغییرات...','بدلونونه لېږل کېږي...','Uploading changes...'],
 synced:['همگام شد','همغږی شو','Synced'],
 error:['خطای ارتباط با سرور','د سرور د نښلونې ستونزه','Cloud connection error'],
 getuid:['این شناسه را به مالک بدهید تا شما را اضافه کند.','دا UID مالک ته ورکړئ چې تاسو اضافه کړي.','Give this UID to the owner to add your access.'],
 team:['همکاران فروشگاه','د دوکان همکاران','Store colleagues'],
 need:['برای این کار، اول به حساب ابری وارد شوید.','لومړی کلاوډ حساب ته ننوځئ.','Please sign in first.'],
 warning:['برای استفاده مشترک از حساب، با ایمیل و رمز خود وارد شوید. معلومات هر فروشگاه جداگانه در سرور مرکزی نگهداری می‌شود.','د میزبانی آنلاین لینک په خپله ګډ ډیټابېس نه جوړوي. له SQL سره خوندي سرور اړین دی.','میزبانی آنلاین hosting alone does NOT provide a shared database. The supplied SQL and secure backend must be configured first.']
};
const tr=k=>words[k]?.[language()==='en'?2:language()==='ps-AF'?1:0]||k;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Preserve the server explicitly selected by the user. Previously the default
// configuration overwrote saved settings on EVERY launch, which could redirect
// the next login to a different tenant/backend. Never silently switch servers.
const savedConfig=readStorage(localStorage,CFGKEY);
let config=savedConfig?.url&&savedConfig?.key?savedConfig:{};
if(!config.url&&window.ZAVI_CLOUD_DEFAULTS?.url&&window.ZAVI_CLOUD_DEFAULTS?.key){
 config={...window.ZAVI_CLOUD_DEFAULTS};
 writeStorage(localStorage,CFGKEY,config);
}
// Persist سرور مرکزی authentication on this trusted device. Session-only credentials are
// migrated transparently; sign-out removes BOTH copies. Never store user passwords.
let session=readStorage(localStorage,PERSISTSESSIONKEY)||readStorage(sessionStorage,SESSIONKEY)||null;
if(session?.access_token){writeStorage(sessionStorage,SESSIONKEY,session);writeStorage(localStorage,PERSISTSESSIONKEY,session)}
function saveAuthSession(){
 writeStorage(sessionStorage,SESSIONKEY,session);
 writeStorage(localStorage,PERSISTSESSIONKEY,session);
 // Notify the per-account interface settings without sharing tokens or IDs.
 window.dispatchEvent(new Event('zavi-cloud-session-changed'));
}
// Only the selected PUBLIC سرور مرکزی endpoint/key; safe for the browser, never a service secret.
window.zaviCloudGetPublicConfig=()=>({url:config.url||'',key:config.key||''});
window.zaviCloudGetAuthSession=()=>session;
window.zaviCloudRefreshAuthSession=async()=>{if(session?.expires_at&&Date.now()/1000>session.expires_at-80)await refreshToken();return session};

let priorRole=readStorage(localStorage,ROLECACHEKEY)||null;
let workspace=null,role=null,revision=0,pending=false,pushing=false,conflict=false,polling=false,lastError='',lastSync='',syncTimer=0,creating=false;
// V60: live count of authorized view-only accounts (NOT a false online-presence indicator).
// All member data stays in this running tab: never put other users' IDs in localStorage.
let memberRows=[],memberLoaded=false,memberLoading=false,memberError='',memberLastChecked=0,memberOwnerScope='',memberFetchPromise=null;
function memberScope(){return session?.user?.id&&workspace?.id&&role==='owner'?session.user.id+'|'+workspace.id:''}
function resetMemberState(){memberRows=[];memberLoaded=false;memberLoading=false;memberError='';memberLastChecked=0;memberOwnerScope=memberScope();memberFetchPromise=null}
const teamLabel=key=>{const l=language();const a={
  title:['👥 همکاران فقط‌مشاهده','👥 یوازې لیدونکي همکاران','👥 View-only colleagues'],
  count:['همکار دارای دسترسی','د لیدلو اجازه لرونکي همکاران','Authorized viewers'],
  current:['این تعداد حساب‌های ثبت‌شده است، نه افراد آنلاین در همین لحظه.','دا د ثبت شويو حسابونو شمېر دی، د آنلاین کسانو نه.','This counts permitted accounts, not live online users.'],
  manage:['مدیریت همکاران','د همکارانو اداره','Manage colleagues'],
  remove:['حذف دسترسی','لاسرسی لرې کول','Remove access'],
  refresh:['تازه‌سازی','تازه کول','Refresh'],
  added:['افزوده‌شده','زیات شوی','Added'],
  empty:['هیچ همکار دارای دسترسی نیست.','هیڅ همکار لاسرسی نه لري.','No authorized colleagues.'],
  loading:['در حال دریافت فهرست...','لړلیک رااخیستل کېږي...','Loading colleagues...'],
  offline:['اطلاعات تازه نیست؛ اتصال اینترنت را بررسی کنید.','انټرنېټ وګورئ؛ شمېر نه دی تازه شوی.','List is not up to date; check internet connection.']
};return a[key]?.[l==='en'?2:l==='ps-AF'?1:0]||key};
function memberCounter(){return memberLoaded?String(memberRows.length):'—'}
function memberListHTML(){
 if(memberError)return `<div class="z60-team-note z60-team-error">${esc(memberError)} <button type="button" data-z60-refresh class="btn tiny subtle">${teamLabel('refresh')}</button></div>`;
 if(!memberLoaded)return `<p class="z60-team-note">${teamLabel('loading')}</p>`;
 if(!memberRows.length)return `<p class="z60-team-note">${teamLabel('empty')}</p>`;
 return memberRows.map((m,i)=>{
  const short=String(m.member_uid||'');
  const date=m.added_at?new Date(m.added_at).toLocaleDateString(language()==='en'?'en-GB':'fa-AF'):'';
  return `<div class="z60-team-member"><div class="z60-team-person"><b>${esc(language()==='en'?'Colleague '+(i+1):'همکار '+(i+1))}</b><span class="z60-team-role">${esc(tr('viewer'))}</span><span class="z60-team-uid" dir="ltr" title="${esc(short)}">${esc(short)}</span>${date?`<small>${teamLabel('added')}: ${esc(date)}</small>`:''}</div><button type="button" class="btn tiny danger z60-team-remove" data-z20-remove="${esc(short)}" aria-label="${teamLabel('remove')} ${i+1}">${teamLabel('remove')}</button></div>`
 }).join('');
}
function renderTeamSections(){
 if(role!=='owner'||!workspace)return;
 const title=teamLabel('title'),n=memberCounter();
 const count=document.getElementById('z60TeamSettingsCount');if(count)count.textContent=n;
 const list=document.getElementById('z20Members');if(list)list.innerHTML=memberListHTML();
 // V62: colleagues are managed ONLY in the Daily Operations menu, never on dashboard.
}

function readStorage(store,key){try{return JSON.parse(store.getItem(key)||'null')}catch(e){return null}}
function writeStorage(store,key,value){try{if(value===null)store.removeItem(key);else store.setItem(key,JSON.stringify(value))}catch(e){}}
function tenantPendingKey(uid,wid){return TENANT_PENDING_PREFIX+uid+'_'+wid}
function readPending(uid,wid){return uid&&wid?readStorage(localStorage,tenantPendingKey(uid,wid)):null}
function writePending(value){if(session?.user?.id&&workspace?.id)writeStorage(localStorage,tenantPendingKey(session.user.id,workspace.id),value)}
// Remember ONLY workspace ownership metadata previously returned by the server.
// Only trusted tenant binding is restored here. Write permission still needs the ES256 signature and unexpired subscription.
function saveOfflineWorkspace(item){
 if(!item?.id||!item?.owner_uid||!session?.user?.id||session.user.id!==item.owner_uid)return;
 writeStorage(localStorage,OFFLINE_WORKSPACE_KEY+item.id,{id:item.id,name:item.name||'ZAVI ONE',owner_uid:item.owner_uid,revision:Number(item.revision||0),user_uid:session.user.id});
}
function restoreOfflineWorkspace(){
 const id=readStorage(localStorage,WSKEY);
 if(!id||!session?.user?.id)return false;
 const cache=readStorage(localStorage,OFFLINE_WORKSPACE_KEY+id);
 if(!cache||cache.id!==id||cache.user_uid!==session.user.id||cache.owner_uid!==session.user.id||!window.zaviTenantHasCached?.(session.user.id,id))return false;
 workspace={id:cache.id,name:cache.name,owner_uid:cache.owner_uid};role='owner';
 const waiting=readPending(session.user.id,id);
 pending=!!(waiting&&waiting.workspace_id===id&&waiting.owner_uid===session.user.id);
 revision=pending?Number(waiting.revision||0):Number(cache.revision||0);
 lastSync='';return true;
}

const validConfig=()=>/^https:\/\/[\w.-]+\/?$/.test(String(config.url||''))&&String(config.key||'').length>20;
function cloudHeaders(extra={}){return {apikey:config.key,Authorization:`Bearer ${session?.access_token||config.key}`,...extra}}
function apiPath(path){return String(config.url||'').replace(/\/$/,'')+path}
// V58: separate, persistent logins for each member; synchronize refresh across
// browser tabs so one tab cannot invalidate the other tab's rotated refresh token.
// A viewer always signs in with THEIR OWN سرور مرکزی account/UID, never with the
// owner's password. Switching the owner's device does not modify membership.
let refreshInFlight=null;
function freshSavedSession(){
 const saved=readStorage(localStorage,PERSISTSESSIONKEY)||readStorage(sessionStorage,SESSIONKEY);
 return saved?.user?.id===session?.user?.id&&saved?.access_token?saved:null;
}
function mergeRefreshedSession(next){
 if(!next?.access_token||!session||next.user?.id&&next.user.id!==session.user?.id)return false;
 session={...session,...next,user:session.user||next.user};saveAuthSession();return true;
}
async function refreshToken(){
 if(refreshInFlight)return refreshInFlight;
 const ownerUid=session?.user?.id,previousRefresh=session?.refresh_token;
 if(!previousRefresh)throw Error('نشست حساب پایان یافته است. دوباره وارد شوید.');
 const run=async()=>{
  // A neighboring tab may have refreshed during the lock wait.
  const latest=freshSavedSession();
  if(latest?.refresh_token&&latest.refresh_token!==previousRefresh){
   if(!mergeRefreshedSession(latest))throw Error('حساب تغییر کرده است.');
   return session;
  }
  if(session?.user?.id!==ownerUid)throw Error('حساب تغییر کرده است.');
  let res,info;
  try{
   res=await fetch(apiPath('/auth/v1/token?grant_type=refresh_token'),{
    method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:previousRefresh})});
   info=await res.json().catch(()=>({}));
  }catch(e){throw Error('اتصال اینترنت قطع شده است؛ نشست شما محفوظ است و بعداً دوباره بررسی می‌شود.');}
  if(!res.ok){
   // A token rotated concurrently by the invoice page can be recovered.
   const newer=freshSavedSession();
   if(newer?.refresh_token&&newer.refresh_token!==previousRefresh){
    mergeRefreshedSession(newer);return session;
   }
   // Never clear viewer account or workspace merely because the network/auth
   // server rejected a refresh. The user may retry or sign out explicitly.
   throw Error(info.msg||info.error_description||'نشست هنوز تأیید نشد؛ دوباره امتحان کنید.');
  }
  if(session?.user?.id!==ownerUid)throw Error('حساب تغییر کرده است.');
  const valid={...info,expires_at:info.expires_at||(info.expires_in?Math.floor(Date.now()/1000)+Number(info.expires_in):session.expires_at)};
  mergeRefreshedSession(valid);return session;
 };
 refreshInFlight=(async()=>{
  // Web Locks is supported by modern Safari/Chromium. A same-tab promise is
  // still used where Web Locks is unavailable.
  if(navigator.locks?.request){
   return navigator.locks.request('zavi-auth-refresh-v58', {mode:'exclusive'},run);
  }
  return run();
 })();
 try{return await refreshInFlight}finally{refreshInFlight=null}
}
async function request(path,{method='GET',body=null,prefer=null,auth=true,retry=true}={}){
 if(!validConfig())throw Error('آدرس سرور یا کلید عمومی نادرست است.');
 if(auth&&session?.expires_at&&Date.now()/1000>session.expires_at-80)await refreshToken();
 const h=cloudHeaders({'Content-Type':'application/json'});if(prefer)h.Prefer=prefer;
 if(!auth)h.Authorization=`Bearer ${config.key}`;
 let res;
 try{res=await fetch(apiPath(path),{method,headers:h,body:body===null?undefined:JSON.stringify(body)})}catch(e){throw Error('به سرور دسترسی نیست. اتصال انترنت را بررسی کنید.');}
 if(res.status===401&&auth&&retry&&session?.refresh_token){
  const newer=freshSavedSession();
  if(newer?.refresh_token&&newer.refresh_token!==session.refresh_token){mergeRefreshedSession(newer)}
  else await refreshToken();
  return request(path,{method,body,prefer,auth,retry:false});
 }
 let out=null;try{out=await res.json()}catch(e){}
 if(!res.ok)throw Error(out?.message||out?.msg||out?.error_description||out?.error||`HTTP ${res.status}`);
 return out;
}
// V65.15: keep signed-in accounts on this device during normal app restarts,
// offline periods and browser tab suspension. Refresh only when connected;
// failures never delete saved credentials or unsent customer invoices.
let resumeInFlight=null;
function resumeAuthQuietly(){
 if(!session?.refresh_token || !validConfig() || !navigator.onLine || document.visibilityState==='hidden')return;
 if(resumeInFlight)return resumeInFlight;
 resumeInFlight=(async()=>{
   try{await window.zaviCloudRefreshAuthSession();}
   catch(err){console.info('ZAVI cloud: session kept for later retry',err?.message||'offline');}
 })().finally(()=>{resumeInFlight=null});
 return resumeInFlight;
}
// When a customer explicitly signs out in another tab, respect that choice.
// Do not let an old tab continue to display the previous owner's account.
window.addEventListener('storage',e=>{
 if(e.key!==PERSISTSESSIONKEY)return;
 if(e.newValue===null && session){
  clearTimeout(syncTimer);session=null;workspace=null;role=null;priorRole=null;
  revision=0;pending=false;conflict=false;resetMemberState();
  writeStorage(sessionStorage,SESSIONKEY,null);
  writeStorage(localStorage,ROLECACHEKEY,null);
  window.zaviTenantClearView?.();
  window.dispatchEvent(new Event('zavi-cloud-session-changed'));
  refreshTop();if(document.getElementById('content'))render();
  return;
 }
 if(e.newValue && session){
  const newer=readStorage(localStorage,PERSISTSESSIONKEY);
  if(newer?.user?.id===session.user?.id && newer?.access_token){
   session={...session,...newer};writeStorage(sessionStorage,SESSIONKEY,session);
  }
 }
});
window.addEventListener('pageshow',()=>{resumeAuthQuietly();});
window.addEventListener('online',()=>{resumeAuthQuietly();});
window.addEventListener('focus',()=>{resumeAuthQuietly();});
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible')resumeAuthQuietly();
});
setInterval(()=>{if(document.visibilityState==='visible')resumeAuthQuietly();},10*60*1000);
function state(){if(!validConfig())return tr('noServer');if(!session)return tr('configured');if(!workspace)return session.user?.email||tr('configured');return `${role==='owner'?tr('owner'):tr('viewer')} · ${workspace.name} · ${pending?tr('pending'):conflict?'تداخل ویرایش':lastSync?tr('synced'):tr('configured')}`;}
function canEdit(){return !!(session?.user?.id&&workspace?.id&&role==='owner'&&window.zaviTenantIsBound?.());}
function uiPanel(){const enabled=validConfig();const signed=!!session?.user;const own=workspace&&role==='owner';
 const person=session?.user?.id||'';
 return `<section class="z20-panel" id="z20CloudPanel"><div class="z20-team"><div><h3>☁️ ${tr('title')} <span class="z20-pill">ZAVI ONE</span></h3><p>${window.ZAVI_CLOUD_DEFAULTS?.url?'برای شروع فقط حساب شخصی خود را بسازید و فروشگاه تان را انتخاب کنید. تنظیمات سرور از قبل آماده شده است.':tr('desc')}</p></div><span class="z20-pill">${esc(state())}</span></div>
 <div class="z20-alert">${tr('warning')}</div>
 <details class="z20-advanced" ${window.ZAVI_CLOUD_DEFAULTS?.url?'style="display:none"':(enabled?'':'open')}><summary>⚙️ ${tr('setup')}</summary><div class="z20-row"><label class="z20-label">${tr('url')}<input class="z20-input" id="z20CloudUrl" type="url" dir="ltr" value="${esc(config.url||'')}" placeholder="آدرس سرور اختصاصی شما"></label><label class="z20-label">${tr('key')}<input class="z20-input" id="z20CloudKey" dir="ltr" type="password" value="${esc(config.key||'')}" placeholder="sb_publishable_..."></label></div><button class="btn subtle" type="button" data-z20-cloud="setConfig">${tr('save')}</button><p class="z20-sub">فقط کلید عمومی / anon استفاده کنید. کلید service_role یا کلید مخفی را در این صفحه وارد نکنید.</p></details>
 ${enabled?(signed?`<div class="z20-actions"><span class="z20-pill">✓ ${esc(session?.user?.email||tr('owner'))}</span><button class="btn subtle" type="button" data-z20-cloud="logout">${tr('logout')}</button></div><p class="z20-sub">${language()==='en'?'You stay signed in on this device. Use Sign out only when you want to leave.':language()==='ps-AF'?'ستاسو ننوتل په همدې وسیله کې ساتل کېږي؛ یوازې د وتلو تڼۍ په وهلو ووځئ.':'ورود شما در همین دستگاه محفوظ می‌ماند. فقط هر وقت خودتان خواستید «خروج از ابر» را بزنید.'}</p>`:`<div class="z20-row"><label class="z20-label">${tr('email')}<input class="z20-input" id="z20Email" dir="ltr" type="email" autocomplete="username"></label><label class="z20-label">${tr('password')}<input class="z20-input" id="z20Password" type="password" autocomplete="current-password" placeholder="••••••••"></label></div><div class="z20-actions"><button class="btn primary" type="button" data-z20-cloud="login">${tr('login')}</button><button class="btn subtle" type="button" data-z20-cloud="signup">${tr('signup')}</button></div>`):''}
 ${signed?`<div class="z20-alert"><b>${esc(session.user.email||'')}</b><br>${tr('uid')}: <span dir="ltr" style="user-select:all">${esc(person)}</span><p>${tr('getuid')}</p><button type="button" class="btn tiny subtle" data-z20-cloud="copyUID">Copy UID / کاپی شناسه</button></div><div class="z20-actions"><button class="btn subtle" type="button" data-z20-cloud="workspaces">${tr('workspaces')}</button><button class="btn subtle" type="button" data-z20-cloud="sync">${tr('sync')}</button></div><div id="z20Workspaces"></div>${!workspace?`<label class="z20-label">${tr('workspaceName')}<input class="z20-input" id="z20NewName" maxlength="90" value="${esc(db.storeName||'ZAVI Business')}"></label><button class="btn primary" type="button" data-z20-cloud="create">${tr('create')}</button>`:''}`:''}
 
 <p class="z20-status" id="z20CloudStatus">${esc(lastError||tr('localsave'))}${lastSync?' · '+esc(lastSync):''}</p>
 </section>`;
}
function changeInfo(message,isError=false){lastError=message||'';const el=document.getElementById('z20CloudStatus');if(el){el.textContent=message;el.style.color=isError?'#c94b56':'#338072';}refreshTop();}
function refreshTop(){const el=document.getElementById('z20TopStatus');if(!el)return;el.style.display='inline-flex';el.innerHTML=`<i class="z20-dot"></i> ${esc(state())}`;document.body.classList.toggle('z20-readonly',!canEdit());}
function afterRender(){refreshTop();if(role==='owner'&&workspace){renderTeamSections();if(!memberLoaded&&!memberLoading)loadMembers().catch(()=>{});}if(role==='viewer'){
 // read-only mode: navigation and printing remain available, destructive form actions are blocked.
 for(const el of document.querySelectorAll('[data-module-id],[data-z20-option],#shopForm input,#shopForm select,#shopForm button,#usdRateForm input,#usdRateForm button'))el.disabled=true;
 }
}
async function authenticate(signup){
 const email=document.getElementById('z20Email')?.value.trim(),password=document.getElementById('z20Password')?.value;
 if(!email||!password)throw Error('ایمیل و رمز عبور را کامل وارد کنید.');
 const endpoint=signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
 const contact=signup?await window.ZaviSignupOnceV6548.collect():null; const res=await request(endpoint,{method:'POST',body:signup?{email,password,data:{zavi_contact:contact}}:{email,password},auth:false});
 const authResult=res?.session?.access_token?{...res.session,user:res.user||res.session.user}:res;
 if(!authResult?.access_token){changeInfo('حساب ساخته شد. اگر تایید ایمیل فعال است، ایمیل خود را تایید و سپس وارد شوید.');return;}
 if(workspace&&pending&&!confirm('این فروشگاه هنوز تغییرات ارسال‌نشده دارد. قبل از تغییر حساب پشتیبان بگیرید. ادامه می‌دهید؟'))return;
 session={...authResult,user:authResult.user||res?.user};saveAuthSession();
 workspace=null;role=null;revision=0;pending=false;conflict=false;priorRole=null;resetMemberState();
 writeStorage(localStorage,WSKEY,null);writeStorage(localStorage,ROLECACHEKEY,null);
 window.zaviTenantClearView?.();
 if(!session.user)throw Error('مشخصات حساب دریافت نشد.');
 if(session.expires_in&&!session.expires_at){session.expires_at=Math.floor(Date.now()/1000)+session.expires_in;saveAuthSession()}
 changeInfo('ورود موفق بود؛ در حال دریافت خودکار معلومات فروشگاه مجاز از ابر...');render();await loadWorkspaces({auto:true});}
async function loadWorkspaces({auto=false}={}){if(!session?.user?.id)return [];
 const expectedUser=session.user.id;
 const rows=await request('/rest/v1/zavi_workspaces?select=id,name,owner_uid,revision,updated_at&order=updated_at.desc');
 // A slow response must never select a store belonging to the account that signed out.
 if(!session||session.user?.id!==expectedUser)return [];
 const el=document.getElementById('z20Workspaces');
 if(el)el.innerHTML=rows.length?rows.map(x=>`<div class="z20-team"><span>🏬 ${esc(x.name)} <small class="z20-sub">${x.owner_uid===expectedUser?tr('owner'):tr('viewer')}</small></span><button class="btn tiny ${workspace?.id===x.id?'primary':''}" type="button" data-z20-select="${esc(x.id)}">${workspace?.id===x.id?'✓':'انتخاب / Open'}</button></div>`).join(''):'<div class="z20-alert">هنوز هیچ فروشگاه مشترکی برای این حساب وجود ندارد.</div>';
 if(!rows.length&&session?.user?.id===expectedUser){
  try{
   const staff=await request('/rest/v1/rpc/zavi_v648_staff_workspaces',{method:'POST',body:{}});
   if(session?.user?.id===expectedUser&&el&&Array.isArray(staff)&&staff.length)
    el.innerHTML='<div class="z20-alert">'+esc(language()==='en'?'Colleague account: use the secure sale and purchase panel.':language()==='ps-AF'?'د همکار حساب: د پېر او پلور خوندي پینل وکاروئ.':'حساب همکار: برای خرید و فروش از پنل امن همکار استفاده کنید.')
    +'</div><button type="button" class="btn primary" data-z648-open>'+esc(language()==='en'?'Open colleague POS':language()==='ps-AF'?'د همکار پېر او پلور':'بازکردن پنل خرید و فروش همکار')+'</button>';
  }catch(_){/* Pre-migration servers may lack the permission endpoint. */ }
 }
 if(auto&&!workspace){
  const preferred=readStorage(localStorage,PREFERRED_WORKSPACE_PREFIX+expectedUser);
  const decision=window.ZaviCloudHandoff651?.plan(rows,expectedUser,preferred);
  if(decision?.id){
   try{
    await choose(decision.id,true);
    if(session?.user?.id===expectedUser&&workspace?.id===decision.id)
     changeInfo('✅ معلومات فروشگاه مجاز از حساب ابری به این دستگاه منتقل و محفوظ شد. اگر دستگاه اصلی دیگری دارید، انتقال مجوز آفلاین تنها با تأیید مالک انجام می‌شود.');
   }catch(err){
    // The original list stays available, never create an empty replacement workspace.
    changeInfo('انتقال خودکار تکمیل نشد؛ معلومات محلی حذف نشده است. فروشگاه را انتخاب کنید: '+(err?.message||err),true);
   }
  }else if(decision?.reason==='multiple-owner-workspaces'){
   changeInfo('چند فروشگاه به این حساب وصل است. برای جلوگیری از انتقال اشتباه، یک فروشگاه را انتخاب کنید.');
  }
 }
 return rows;
}
async function createWorkspace(){if(creating)return;creating=true;try{
 if(!session)throw Error(tr('need'));
 if(workspace)throw Error('برای ایجاد فروشگاه جدید ابتدا از حساب قبلی خارج شوید.');
 const name=document.getElementById('z20NewName')?.value.trim()||'ZAVI Business';
 if(!confirm('فروشگاه ابری جدید با اطلاعات خالی ساخته شود؟ سوابق هیچ فروشگاه قبلی منتقل نمی‌شود.'))return;
 const payload={...blankDB(),storeName:name};
 const rows=await request('/rest/v1/zavi_workspaces?select=*',{method:'POST',body:{owner_uid:session.user.id,name,payload,revision:1},prefer:'return=representation'});
 if(!rows?.[0])throw Error('ساخت فروشگاه با مشکل روبه‌رو شد.');
 await choose(rows[0].id,true);changeInfo('فروشگاه ابری ایجاد شد.');
 }finally{creating=false;}}
async function choose(id,created=false){
 const identity=session?.user?.id;
 if(!identity)throw Error(tr('need'));
 if(workspace?.id!==id&&pending)throw Error('این فروشگاه هنوز تغییرات ارسال‌نشده دارد. ابتدا معلومات را با ابر همگام کنید یا پشتیبان بگیرید.');
 const rows=await request('/rest/v1/zavi_workspaces?select=*&id=eq.'+encodeURIComponent(id));
 // Late responses must not select a former customer's account after logout/switch.
 if(!session?.user?.id||session.user.id!==identity)throw Error('نشست حساب تغییر کرده است. دوباره فروشگاه را انتخاب کنید.');
 if(!rows?.length)throw Error('اجازه دسترسی به این فروشگاه وجود ندارد.');
 const item=rows[0];
 if(!item.payload||!Array.isArray(item.payload.tx)||!Array.isArray(item.payload.products)||!Array.isArray(item.payload.contacts))throw Error('داده فروشگاه مشترک درست نیست.');
 const nextRole=item.owner_uid===identity?'owner':'viewer';
 let waiting=readPending(identity,id);
 const hasCache=window.zaviTenantHasCached?.(identity,id)===true;
 const serverRevision=Number(item.revision||0);
 // V43: On a legacy crash, the snapshot might be durable but the pending flag absent.
 // Recover only if it is demonstrably newer than the last server snapshot; do not
 // silently replace it with older server data. This is a conservative safeguard.
 if(nextRole==='owner'&&hasCache&&!waiting){
  let local=null;
  try{local=readStorage(localStorage,'zavi_v34_tenant_'+identity+'_'+id)}catch(_){}
  if(local&&Array.isArray(local.tx)&&Array.isArray(local.products)&&Array.isArray(local.contacts)&&
     Number(local.updatedAt||0)>Number(item.payload.updatedAt||0)){
   const meta=readStorage(localStorage,OFFLINE_WORKSPACE_KEY+id);
   const safeRevision=Number(meta?.revision||serverRevision);
   waiting={workspace_id:id,owner_uid:identity,revision:safeRevision,source:'v43_recovered'};
   writeStorage(localStorage,tenantPendingKey(identity,id),waiting);
  }
 }
 const validWaiting=nextRole==='owner'&&waiting?.workspace_id===id&&waiting.owner_uid===identity&&hasCache;
 const pendingRevision=Number(waiting?.revision||0);
 // The owner's explicit maintenance reset supersedes obsolete pending snapshots.
 // Quarantine previous local records before clearing the per-tenant pending flag.
 const resetIsNewer=!!item.payload.zaviMaintenanceResetAt&&validWaiting&&serverRevision>pendingRevision;
 if(resetIsNewer){
  const key='zavi_v34_tenant_'+identity+'_'+id;
  try{
   const old=localStorage.getItem(key);
   if(old)localStorage.setItem('zavi_v35_reset_quarantine_'+identity+'_'+id+'_'+Date.now(),old);
  }catch(e){throw Error('پشتیبان محلی حساب پیش از بازنشانی ذخیره نشد؛ فضای حافظه را بررسی کنید.');}
  writeStorage(localStorage,tenantPendingKey(identity,id),null);
  waiting=null;
 }
 const preserve=!!validWaiting&&!resetIsNewer;
 const hasConflict=preserve&&pendingRevision!==serverRevision;
 // Cloud is authoritative for normal logins; local pending data only from SAME tenant.
 window.zaviTenantActivate(identity,id,item.payload,preserve);
 workspace=item;revision=preserve?pendingRevision:serverRevision;
 role=nextRole;priorRole=role;resetMemberState();saveOfflineWorkspace(item);
 writeStorage(localStorage,ROLECACHEKEY,role);pending=preserve;conflict=hasConflict;
 writeStorage(localStorage,WSKEY,id);
 // Remember preferred store under this AUTH UID only, never the globally shared store name.
 if(nextRole==='owner')writeStorage(localStorage,PREFERRED_WORKSPACE_PREFIX+identity,id);
 closeModal();page='dashboard';render();
 window.dispatchEvent(new CustomEvent('zavi-cloud-workspace-selected',{detail:{workspace:id,role:nextRole}}));
 if(nextRole==='owner'&&!preserve&&!hasConflict){lastSync=new Date().toLocaleTimeString();window.dispatchEvent(new CustomEvent('zavi-cloud-sync-confirmed',{detail:{workspace:id,source:'initial-cloud-pull'}}));}
 changeInfo(resetIsNewer?'حساب آزمایشی از ابر پاک‌سازی و تازه‌سازی شد؛ سوابق قدیمی جداگانه محفوظ‌اند.':hasConflict?'نسخه سرور تغییر کرده و معلومات محلی ارسال‌نشده موجود است. همگام‌سازی متوقف شد؛ قبل از جایگزینی پشتیبان بگیرید.':preserve?'تغییرات ارسال‌نشده همین فروشگاه محفوظ است.':'معلومات مخصوص همین فروشگاه از ابر دریافت شد.',hasConflict);
 if(role==='owner'&&!preserve)await loadMembers();
 if(preserve&&!hasConflict&&navigator.onLine){clearTimeout(syncTimer);syncTimer=setTimeout(push,1500)}
}
async function loadMembers(force=false){
 const scope=memberScope();if(!scope)return [];
 if(!force&&memberLoaded&&!memberError&&Date.now()-memberLastChecked<13000)return memberRows;
 if(memberFetchPromise&&memberOwnerScope===scope){
  if(!force)return memberFetchPromise;
  await memberFetchPromise;
  if(memberScope()!==scope)return [];
 }
 memberOwnerScope=scope;memberLoading=true;
 memberFetchPromise=(async()=>{
  try{
   const wid=workspace.id,uid=session.user.id;
   const rows=await request('/rest/v1/zavi_workspace_members?select=member_uid,role,added_at&workspace_id=eq.'+encodeURIComponent(wid)+'&order=added_at.asc');
   if(memberScope()!==scope||session?.user?.id!==uid||workspace?.id!==wid)return [];
   memberRows=[...new Map((Array.isArray(rows)?rows:[]).filter(m=>m.role==='viewer'&&m.member_uid).map(m=>[m.member_uid,m])).values()];
   memberLoaded=true;memberError='';memberLastChecked=Date.now();renderTeamSections();
   return memberRows;
  }catch(err){
   if(memberScope()===scope){memberError=err?.message||teamLabel('offline');renderTeamSections()}
   return [];
  }finally{if(memberScope()===scope){memberLoading=false;memberFetchPromise=null}}
 })();return memberFetchPromise;
}
async function addViewer(){
 if(role!=='owner'||!workspace)throw Error('فقط مالک می‌تواند عضو اضافه کند.');
 const member_uid=document.getElementById('z20MemberUID')?.value.trim();
 if(!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(member_uid||''))throw Error('شناسه UID معتبر وارد کنید.');
 if(member_uid.toLowerCase()===session.user.id.toLowerCase())throw Error('مالک نمی‌تواند خودش را عضو مشاهده اضافه کند.');
 await request('/rest/v1/zavi_workspace_members',{method:'POST',body:{workspace_id:workspace.id,member_uid,role:'viewer'},prefer:'return=minimal'});
 changeInfo('همکار فقط‌مشاهده اضافه شد.');
 const input=document.getElementById('z20MemberUID');if(input)input.value='';
 await loadMembers(true);
}
async function removeViewer(memberUid){
 if(role!=='owner'||!workspace)throw Error('فقط مالک می‌تواند دسترسی همکار را حذف کند.');
 const member=memberRows.find(m=>m.member_uid===memberUid);
 if(!member)throw Error('این همکار دیگر در فهرست دسترسی نیست؛ فهرست را تازه کنید.');
 if(!confirm('دسترسی فقط‌مشاهدهٔ همکار '+memberUid+' از این فروشگاه حذف شود؟\nاین کار حساب همکار را پاک نمی‌کند و هیچ اطلاعات مالی را حذف نمی‌کند.'))return;
 const targetWorkspace=workspace.id,targetOwner=session.user.id;
 const deleted=await request('/rest/v1/zavi_workspace_members?select=member_uid&workspace_id=eq.'+encodeURIComponent(targetWorkspace)+'&member_uid=eq.'+encodeURIComponent(memberUid),{method:'DELETE',prefer:'return=representation'});
 if(session?.user?.id!==targetOwner||workspace?.id!==targetWorkspace||role!=='owner')return;
 if(!Array.isArray(deleted)||!deleted.some(x=>x.member_uid===memberUid))throw Error('سرور حذف را تایید نکرد؛ فهرست را تازه کنید.');
 changeInfo('دسترسی مشاهدهٔ همکار لغو شد.');
 await loadMembers(true);
}
// Server-confirmed revocation: remove the old viewer's displayed accounting data.
// A device that is completely offline cannot receive a revocation until it reconnects.
function revokedViewerWorkspace(){
 if(role!=='viewer'||!workspace)return;
 workspace=null;role=null;priorRole=null;revision=0;pending=false;conflict=false;
 writeStorage(localStorage,WSKEY,null);writeStorage(localStorage,ROLECACHEKEY,null);
 window.zaviTenantClearView?.();
 if(typeof page!=='undefined')page='settings';
 render();changeInfo('مالک دسترسی مشاهدهٔ شما را لغو کرده است. فروشگاه دیگر در دسترس نیست.',true);
}
async function reloadCloud(force=false){if(!workspace||polling||(!force&&(pending||pushing||conflict)))return;
 const loadedWorkspace=workspace.id,loadedOwner=session?.user?.id;
 polling=true;try{
 const rows=await request('/rest/v1/zavi_workspaces?select=*&id=eq.'+workspace.id);
 if(!rows?.length){
  if(role==='viewer'&&session?.user?.id===loadedOwner&&workspace?.id===loadedWorkspace){
   // V65.8: owner-only raw-ledger RLS intentionally hides the full workspace from staff.
   // An empty result is NOT proof that the owner revoked their membership.
   try{
    const memberships=await request('/rest/v1/zavi_workspace_members?select=workspace_id&workspace_id=eq.'+encodeURIComponent(loadedWorkspace)+'&member_uid=eq.'+encodeURIComponent(loadedOwner));
    if(!session||session.user?.id!==loadedOwner||workspace?.id!==loadedWorkspace)return;
    if(Array.isArray(memberships)&&memberships.length){
     workspace=null;role=null;priorRole=null;revision=0;pending=false;conflict=false;
     writeStorage(localStorage,WSKEY,null);writeStorage(localStorage,ROLECACHEKEY,null);
     window.zaviTenantClearView?.();render();
     await loadWorkspaces();
     changeInfo('دسترسی همکار فعال است. برای فروش و خرید از پنل امن همکار استفاده کنید؛ معلومات سرمایه مالک دیگر به این دستگاه ارسال نمی‌شود.');
     return;
    }
   }catch(_){changeInfo('تأیید دسترسی همکار از سرور ممکن نشد. برای حفاظت از سرمایه، معلومات قبلی را نمایش نمی‌دهیم.',true);return;}
   revokedViewerWorkspace();return;
  }
  changeInfo('دسترسی به فروشگاه در سرور پیدا نشد. اطلاعات محلی پاک نشده است؛ از پشتیبان JSON استفاده کنید و با مدیر تماس بگیرید.',true);return
 }
 if(!session||session.user?.id!==loadedOwner||workspace?.id!==loadedWorkspace)return;
 const item=rows[0];saveOfflineWorkspace(item);if(pending){if(Number(item.revision)>revision){conflict=true;changeInfo('تعارض: تغییرات آفلاین هنوز ارسال نشده و سرور نیز تغییر کرده است. پیش از ادامه پشتیبان بگیرید.',true)}return;}if(Number(item.revision)>revision){
 if(!force&&document.activeElement?.matches('input,textarea,select'))return;
 window.zaviTenantActivate(session.user.id,item.id,item.payload,false);revision=Number(item.revision);workspace=item;pending=false;conflict=false;
 if(db.uiModules)zaviModules={...db.uiModules};render();changeInfo('معلومات تازه دریافت شد.');
 }else if(force){revision=Number(item.revision);window.zaviTenantActivate(session.user.id,item.id,item.payload,false);workspace=item;pending=false;conflict=false;render();changeInfo('معلومات سرور تازه شد.');}
 if(role==='owner'&&!pending&&!conflict&&workspace?.id===loadedWorkspace){lastSync=new Date().toLocaleTimeString();window.dispatchEvent(new CustomEvent('zavi-cloud-sync-confirmed',{detail:{workspace:loadedWorkspace,source:'verified-cloud-refresh'}}));}
 }catch(e){changeInfo(e.message,true)}finally{polling=false;}}
function afterSave(){if(role!=='owner'||!workspace)return;pending=true;writePending({workspace_id:workspace.id,revision,owner_uid:session?.user?.id});changeInfo(navigator.onLine?'تغییرات محلی محفوظ شد؛ تلاش برای ارسال به ابر...':'📴 خرید و فروش در همین دستگاه ذخیره شد؛ با وصل شدن انترنت همگام می‌شود.',false);clearTimeout(syncTimer);if(navigator.onLine)syncTimer=setTimeout(push,150)}
async function push(){if(!pending||!workspace||role!=='owner'||pushing||conflict||navigator.onLine===false)return;
 pushing=true;const snapshotJSON=JSON.stringify(db);const snapshot=JSON.parse(snapshotJSON);const at=Number(snapshot.updatedAt||0);const oldRev=revision;
 // V65.11: compare the WHOLE saved payload after a request: equal timestamps do not prove equal ledgers.
 // Only a deliberate store-name edit may change the cloud/ADMIN workspace title.
 const renameName=snapshot.zaviRenameRequested===true&&typeof snapshot.storeName==='string'&&snapshot.storeName.trim().length>=2&&snapshot.storeName.trim().length<=65?snapshot.storeName.trim():null;
 const updateBody={payload:snapshot,revision:oldRev+1,updated_at:new Date().toISOString()};
 if(renameName&&renameName!==workspace.name)updateBody.name=renameName;const uploadWorkspace=workspace.id,uploadOwner=session?.user?.id,uploadTenantKey=window.zaviTenantKey?.();
 try{
 const rows=await request('/rest/v1/zavi_workspaces?select=id,name,revision,updated_at&id=eq.'+workspace.id+'&revision=eq.'+oldRev,{method:'PATCH',body:updateBody,prefer:'return=representation'});
 if(!workspace||workspace.id!==uploadWorkspace||session?.user?.id!==uploadOwner||window.zaviTenantKey?.()!==uploadTenantKey)return;
 if(!rows?.length){
  // Network may have died after the server accepted this exact optimistic update.
  try{const latest=await request('/rest/v1/zavi_workspaces?select=id,name,revision,payload&id=eq.'+workspace.id);
   if(!workspace||workspace.id!==uploadWorkspace||session?.user?.id!==uploadOwner||window.zaviTenantKey?.()!==uploadTenantKey)return;
   const current=latest?.[0];
   if(current&&Number(current.revision)===oldRev+1&&JSON.stringify(current.payload?.tx||[])===JSON.stringify(snapshot.tx||[])&&Number(current.payload?.updatedAt||0)===at&&(!renameName||current.name===renameName)){
    revision=Number(current.revision);workspace={...workspace,name:current.name,revision};saveOfflineWorkspace(workspace);
    pending=JSON.stringify(db)!==snapshotJSON;writePending(pending?{workspace_id:workspace.id,revision,owner_uid:session?.user?.id}:null);
    lastSync=new Date().toLocaleTimeString();changeInfo('سرور قبلاً همین تغییرات را دریافت کرده است.');if(!pending&&!conflict)window.dispatchEvent(new CustomEvent('zavi-cloud-sync-confirmed',{detail:{workspace:uploadWorkspace,source:'server-confirmed-upload'}}));return;
   }
  }catch(_){changeInfo('دریافت پاسخ سرور کامل نشد؛ معلومات در دستگاه محفوظ است و بعداً دوباره بررسی می‌شود.',true);return;}
  conflict=true;changeInfo('تداخل تغییرات در دو دستگاه؛ اطلاعات محلی پاک نشده است. پشتیبان بگیرید و سپس با احتیاط همگام‌سازی کنید.',true);return
 }
 revision=Number(rows[0].revision);workspace={...workspace,revision,name:rows[0].name||workspace.name};saveOfflineWorkspace(workspace);pending=JSON.stringify(db)!==snapshotJSON;if(pending)writePending({workspace_id:workspace.id,revision,owner_uid:session?.user?.id});else writePending(null);
 lastSync=new Date().toLocaleTimeString();changeInfo(pending?'تغییر تازه در صف ارسال است.':tr('synced'));
 if(!pending&&!conflict)window.dispatchEvent(new CustomEvent('zavi-cloud-sync-confirmed',{detail:{workspace:uploadWorkspace,source:'uploaded'}}));
 if(renameName&&document.getElementById('z20Workspaces'))loadWorkspaces().catch(()=>{});
 }catch(e){if(workspace?.id===uploadWorkspace&&session?.user?.id===uploadOwner){pending=true;changeInfo('معلومات در همین دستگاه محفوظ است؛ ارسال ابری انجام نشد: '+e.message,true)}}finally{pushing=false;refreshTop();if(pending&&!conflict){clearTimeout(syncTimer);syncTimer=setTimeout(push,12000)}}
}
function logout(){
 if(workspace&&role==='owner'&&pending&&!confirm('این فروشگاه هنوز تغییرات ارسال‌نشده دارد. معلومات آن در حافظه اختصاصی همین حساب نگهداری می‌شود. خارج می‌شوید؟'))return;
 clearTimeout(syncTimer);
 session=null;saveAuthSession();workspace=null;role=null;priorRole=null;revision=0;pending=false;conflict=false;resetMemberState();
 writeStorage(localStorage,ROLECACHEKEY,null);writeStorage(localStorage,WSKEY,null);writeStorage(localStorage,PENDINGKEY,null);
 // Never display or write the previous owner's ledger after logout.
 window.zaviTenantClearView?.();window.dispatchEvent(new Event('zavi-cloud-logged-out'));changeInfo('خروج انجام شد. اطلاعات هر مشتری فقط در حساب خودش نمایش داده می‌شود.');
}
async function click(action,el){switch(action){
 case 'setConfig':{if(workspace)throw Error('اول از فروشگاه مشترک خارج شوید.');const url=document.getElementById('z20CloudUrl')?.value.trim().replace(/\/$/,'');const key=document.getElementById('z20CloudKey')?.value.trim();if(/service_role|secret/i.test(key||''))throw Error('کلید مخفی وارد نکنید؛ فقط publishable/anon مجاز است.');config={url,key};if(!validConfig())throw Error('آدرس HTTPS و کلید عمومی معتبر وارد کنید.');writeStorage(localStorage,CFGKEY,config);session=null;saveAuthSession();render();changeInfo('آدرس سرور ذخیره شد. حالا وارد شوید.');break}
 case 'signup':await authenticate(true);break;
 case 'login':await authenticate(false);break;
 case 'logout':logout();break;
 case 'workspaces':await loadWorkspaces();break;
 case 'create':await createWorkspace();break;
 case 'sync':if(role==='owner'&&pending&&!conflict)await push();else if(conflict){
   // Never replace offline accounting with a cloud snapshot just from a refresh click.
   changeInfo('تعارض همگام‌سازی: اطلاعات محلی شما محفوظ است. ابتدا پشتیبان JSON بگیرید و مشکل را با پشتیبانی حل کنید.',true);
   alert('⚠️ تعارض اطلاعات: برای جلوگیری از حذف فروش‌ها و خریدهای آفلاین، جایگزینی خودکار مسدود شد. از حساب پشتیبان JSON بگیرید و با مدیریت تماس بگیرید.');
  }else await reloadCloud(true);break;
 case 'addViewer':await addViewer();break;
 case 'copyUID':try{await navigator.clipboard.writeText(session?.user?.id||'');changeInfo('شناسه کاپی شد.')}catch(e){changeInfo('روی شناسه بزنید و Copy را انتخاب کنید.')}break;
 }}
// GUI guards are extra protection, not a substitute for RLS at the server.
function viewerGuard(e){if(role!=='viewer'||!workspace)return;
 const el=e.target.closest('button,input,select,textarea,label,a');if(!el)return;
 if(el.closest('#z20CloudPanel')||el.closest('.zavi-language-picker')||el.id==='zaviSettingsLanguage'||el.matches('[data-go],[data-ledger],[data-statement],[data-wa],[data-detail],[data-invoice-print],[data-invoice-share],[data-invoice-save],[data-save-image],[data-share-image],[data-print-ledger]')||el.closest('[data-go]'))return;
 if(el.matches('[data-action]')&&['backup','backup_secure','export_transactions','export_contacts','export_products','export_csv'].includes(el.dataset.action))return;
 if(el.closest('.searchbox,.filterbar,.settings-card .file-button')&&el.type!=='file')return;
 if(el.closest('#dialogForm,#shopForm,#usdRateForm')||el.matches('[data-action],[data-collect],[data-module-id],[data-z20-option],#importFile,#productCsvImport,#zawiChangePin,#zawiSettingsLock,#topSaleBtn,#voidDoc,#addLine')||el.closest('.remove-line')){
 e.preventDefault();e.stopImmediatePropagation();changeInfo('شما فقط اجازه مشاهده دارید. تنها مالک می‌تواند معلومات را تغییر دهد.',true)
 }
}
for(const type of ['click','submit','change'])document.addEventListener(type,viewerGuard,true);
document.addEventListener('click',async e=>{
 const cloud=e.target.closest('[data-z20-cloud]'),select=e.target.closest('[data-z20-select]'),remove=e.target.closest('[data-z20-remove]'),refresh=e.target.closest('[data-z60-refresh]');if(!cloud&&!select&&!remove&&!refresh)return;
 e.preventDefault();try{if(cloud)await click(cloud.dataset.z20Cloud,cloud);if(select)await choose(select.dataset.z20Select);if(remove)await removeViewer(remove.dataset.z20Remove);if(refresh)await loadMembers(true)}catch(err){changeInfo(err.message||tr('error'),true);console.error('ZAVI cloud',err)}
});
// Invoice editor can open in another tab. Merge its manual invoices for the SAME tenant only.
window.addEventListener('storage',e=>{
 if(!workspace||role!=='owner'||!session?.user?.id||e.key!==window.zaviTenantKey?.()||!e.newValue)return;
 try{
  const incoming=JSON.parse(e.newValue);
  if(!Array.isArray(incoming.manualInvoices))return;
  const old=Array.isArray(db.manualInvoices)?db.manualInvoices:[];
  const known=new Map(old.map(x=>[String(x.id),x]));
  let changed=false;
  for(const inv of incoming.manualInvoices){if(!inv?.id)continue;const prior=known.get(String(inv.id));if(!prior||JSON.stringify(prior)!==JSON.stringify(inv)){known.set(String(inv.id),inv);changed=true}}
  if(changed&&window.zaviCloudCanEdit?.())commit(next=>{next.manualInvoices=[...known.values()]});
 }catch(err){console.warn('Tenant invoice merge skipped:',err)}
});
window.zaviCloudPanel=uiPanel;
window.zaviCloudCanEdit=canEdit;
window.zaviCloudAfterSave=afterSave;
window.zaviCloudAfterRender=afterRender;
window.zaviCloudRestoreInfo=()=>({workspace:workspace?.id,role,revision,pending,conflict});
// V65.2: self-reported sync status; never asserts remote-offline device is clean.
window.zaviCloudDeviceSyncStatus=()=>({workspace:workspace?.id,role,pending,conflict,last_sync_successful:!!lastSync&&!pending&&!conflict});
document.addEventListener('change',e=>{if(e.target.matches('.zavi-language-picker,#zaviSettingsLanguage'))setTimeout(()=>{if(typeof page!=='undefined'&&page==='settings')render()},120)});
// Poll only when visible and no local unsent changes. Never overwrite pending local edits.
setInterval(()=>{if(workspace&&document.visibilityState==='visible'&&navigator.onLine){if(pending&&!conflict)push();else if(!pushing&&!conflict)reloadCloud(false);if(role==='owner')loadMembers(true).catch(()=>{})}},18000);
window.addEventListener('online',()=>{if(workspace&&pending&&!conflict)push();else if(workspace&&!pending&&!conflict)reloadCloud(false)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&role==='owner'&&workspace&&navigator.onLine)loadMembers(true).catch(()=>{})});
const restoredOfflineWorkspace=restoreOfflineWorkspace();
if(restoredOfflineWorkspace)changeInfo('فروشگاه قبلی از حافظه باز شد؛ در انتظار بررسی مجوز امضاشده آفلاین.');
async function restoreOfflineLedgerSafely(){
 if(!session?.user?.id||!workspace?.id||role!=='owner'||window.zaviTenantIsBound?.())return false;
 const uid=session.user.id,ws=workspace.id;
 const cached=await window.zaviSecureOfflineLicense?.cached(ws).catch(()=>null);
 if(!cached||cached.claims?.sub!==uid||cached.claims.workspace_id!==ws||cached.claims.device_id!==window.zaviSecureOfflineLicense?.device())return false;
 if(!session||session.user.id!==uid||workspace?.id!==ws)return false;
 const key='zavi_v34_tenant_'+uid+'_'+ws;
 let local=null;try{local=JSON.parse(localStorage.getItem(key)||'null')}catch(_){return false}
 if(!local||!Array.isArray(local.tx)||!Array.isArray(local.products)||!Array.isArray(local.contacts))return false;
 // This binding does not grant subscription access; annual-license.js validates the signed expiry for every write.
 window.zaviTenantActivate(uid,ws,local,true);
 changeInfo('📴 اطلاعات اختصاصی این حساب باز شد؛ مجوز امضاشده آفلاین بررسی شده است.');
 return true;
}
window.addEventListener('load',()=>setTimeout(()=>restoreOfflineLedgerSafely().catch(e=>changeInfo('بازیابی آفلاین: '+e.message,true)),250));
(async()=>{try{if(session&&validConfig()){
 if(!session.user){const u=await request('/auth/v1/user');session.user=u;saveAuthSession()}
 const id=readStorage(localStorage,WSKEY);if(!id){
  // Newly signed in / newly installed browser: download its unique owner workspace.
  // Multiple businesses are NEVER guessed; the owner sees the selection list.
  await loadWorkspaces({auto:true});
 }else{
 const record=readPending(session.user.id,id);
 if(record?.workspace_id===id&&record?.owner_uid===session.user?.id){
  const rows=await request('/rest/v1/zavi_workspaces?select=id,name,owner_uid,revision,updated_at&id=eq.'+encodeURIComponent(id));
  if(rows?.[0]&&rows[0].owner_uid===session.user.id&&window.zaviTenantHasCached(session.user.id,id)){workspace=rows[0];saveOfflineWorkspace(rows[0]);role='owner';priorRole='owner';revision=record.revision;pending=true;changeInfo('یک تغییر محلی هنوز به سرور نرسیده است؛ تلاش برای ارسال...');clearTimeout(syncTimer);syncTimer=setTimeout(push,1800)}
  else await choose(id,true);
 }else await choose(id,true);
 }
 }}catch(e){changeInfo('ورود حساب محفوظ است؛ اما اتصال یا انتخاب دوکان کامل نشد: '+e.message+' — انترنت را بررسی و دوباره همگام‌سازی کنید.',true);saveAuthSession()}finally{refreshTop();if(document.getElementById('content'))render()}})();
})();
