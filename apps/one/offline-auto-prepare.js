/* ZAVI ONE V47 — Automatic offline readiness, without subscription bypass.
 * Online-first: cache the same-origin application shell and (for the signed-in
 * owner of an active paid workspace) acquire/renew an ES256 offline lease.
 * IMPORTANT: never silently revoke a different primary device.
 */
(()=>{'use strict';
const RETRY_ERROR_MS=3*60*1000;
const RENEW_BEFORE_MS=20*60*1000;
const STATUS={phase:'starting',workspace:'',detail:'در حال آماده‌سازی خودکار برنامه…',ready:false,shell_ready:false,license_ready:false,updated_at:Date.now()};
let job=null, jobWorkspace='', lastAttempt='', lastTry=0, timer=null;
function context(){try{return window.zaviCloudRestoreInfo?.()||{}}catch{return {}}}
function currentUid(){return window.zaviCloudGetAuthSession?.()?.user?.id||''}
function online(){return navigator.onLine!==false}
// A signed lease and cached HTML alone cannot guarantee a usable account.
// Require the account's own complete snapshot before displaying "ready".
function localSnapshotReady(uid,ws){
 if(!uid||!ws)return false;
 try{
  const key='zavi_v34_tenant_'+uid+'_'+ws;
  const value=localStorage.getItem(key);
  if(!value)return false;
  const d=JSON.parse(value);
  return !!(d&&Array.isArray(d.tx)&&Array.isArray(d.products)&&Array.isArray(d.contacts)&&Array.isArray(d.accounts));
 }catch(_){return false}
}
function leaseForOwner(lease,uid,ws){
 const p=lease?.claims;
 return !!(p&&p.sub===uid&&p.workspace_id===ws&&p.device_id===window.zaviSecureOfflineLicense?.device()&&p.can_write===true&&p.exp*1000>Date.now());
}

function set(phase,detail,extra={}){
 Object.assign(STATUS,{phase,detail,updated_at:Date.now()},extra);
 // Do not accidentally expose one tenant's status after sign out/switch.
 document.querySelectorAll('[data-zavi-auto-prep-status]').forEach(node=>{
  const language=window.zaviPublicLanguage?.()||document.documentElement.lang||'fa-AF';
  const labels={
   'fa-AF':{ready:'✅ آفلاین آماده است.',action_required:'⚠️ انتقال آفلاین نیاز به تأیید مالک دارد؛ اطلاعات همگام‌شده ابری قابل دریافت است.',error:'⚠️ آماده‌سازی آفلاین کامل نشد.',viewer:'فقط مشاهده',offline_wait:'⚠️ مجوز آفلاین هنوز آماده نیست.',working:'در حال آماده‌سازی آفلاین…'},
   'ps-AF':{ready:'✅ آفلاین چمتو دی.',action_required:'⚠️ آفلاین لېږد د مالک تایید غواړي؛ همغږي شوي معلومات له کلاوډ څخه ترلاسه کېدای شي.',error:'⚠️ د آفلاین چمتووالی بشپړ نه شو.',viewer:'یوازې کتل',offline_wait:'⚠️ د آفلاین اجازه لا چمتو نه ده.',working:'آفلاین چمتو کېږي…'},
   en:{ready:'✅ Offline ready.',action_required:'⚠️ Offline transfer needs owner approval; synced cloud data remains available.',error:'⚠️ Offline setup incomplete.',viewer:'View only',offline_wait:'⚠️ Offline license not ready.',working:'Preparing offline access…'}
  }[language]||null;
  const v=labels||{ready:'✅ آفلاین آماده است.',action_required:'⚠️ انتقال دستگاه نیاز به تأیید مالک دارد.',error:'⚠️ آماده‌سازی آفلاین انجام نشد.',viewer:'فقط مشاهده',offline_wait:'⚠️ مجوز آفلاین آماده نیست.',working:'در حال آماده‌سازی آفلاین…'};
  node.textContent=phase==='ready'||phase==='offline_ready'?v.ready:phase==='action_required'?v.action_required:phase==='error'?v.error:phase==='viewer'?v.viewer:phase==='offline_wait'?v.offline_wait:v.working;
  node.style.color=STATUS.ready?'#087b5b':phase==='action_required'||phase==='error'?'#a45712':'#3e6479';
 });
 window.dispatchEvent(new CustomEvent('zavi-auto-offline-status',{detail:{...STATUS}}));
}
function noteNoWorkspace(){set('waiting','☁️ برنامه به‌صورت خودکار برای آفلاین ذخیره می‌شود. پس از ورود آنلاین و فعال‌شدن اشتراک، مجوز دستگاه نیز خودکار آماده خواهد شد.',{workspace:'',ready:false,license_ready:false});}
function actionRequired(text){set('action_required','⚠️ '+text+' برای جلوگیری از غیرفعال‌شدن ناخواسته دستگاه قبلی، انتقال دستگاه فقط پس از تأیید مالک انجام می‌شود.',{ready:false,license_ready:false});}
function clock(){return Date.now()}
async function cachedLease(ws){try{return await window.zaviSecureOfflineLicense?.cached(ws)||null}catch{return null}}
function leaseLongEnough(lease){return !!(lease?.claims?.exp && lease.claims.exp*1000-clock()>RENEW_BEFORE_MS)}
async function shell(){
 const manager=window.zaviOfflineShell;
 if(!manager)throw Error('ماژول ذخیره فایل‌های آفلاین بارگذاری نشده است.');
 let s=manager.status();
 if(!s.ready || !s.controlled || s.protocol!=='zavi-shell-v2')s=await manager.prepare();
 // Cache preparation is required, not just a successful registration.
 if(!s.ready || !s.controlled || s.protocol!=='zavi-shell-v2'){
  throw Error(s.message||'فایل‌های برنامه هنوز کامل آماده نشده‌اند. با اینترنت، دکمه دریافت فایل‌ها را بزنید.');
 }
 return s;
}
async function prepareOnce(force=false){
 const ctx=context(),ws=ctx.workspace||'',user=currentUid();
 if(job && jobWorkspace===ws)return job;
 if(job && jobWorkspace!==ws){try{await job}catch(_){} }
 if(!online()){
  const shellState=window.zaviOfflineShell?.status?.()||{};
  const lease=ws?await cachedLease(ws):null;
  const valid=!!(ws&&ctx.role==='owner'&&leaseForOwner(lease,user,ws)&&localSnapshotReady(user,ws)&&shellState.ready&&shellState.controlled);
  set(valid?'offline_ready':'offline_wait',valid?'📴 مجوز امضاشده معتبر قبلاً ذخیره شده است. اطلاعات همین فروشگاه در دسترس است.':'📴 اینترنت قطع است؛ آماده‌سازی اولیه باید یک‌بار هنگام اتصال انجام شود.',{workspace:ws,ready:valid,license_ready:valid});
  return valid;
 }
 const attemptKey=user+'|'+ws;
 if(!force && lastAttempt===attemptKey && clock()-lastTry<RETRY_ERROR_MS && !STATUS.ready)return false;
 lastAttempt=attemptKey;lastTry=clock();jobWorkspace=ws;
 job=(async()=>{
  set('shell','در حال ذخیره خودکار فایل‌های برنامه برای بازشدن بدون اینترنت…',{workspace:ws,ready:false});
  const shellReady=await shell();
  if(ws!==context().workspace)throw Error('فروشگاه انتخاب‌شده تغییر کرد؛ آماده‌سازی حساب جدید در نوبت است.');
  if(!ws||!user){noteNoWorkspace();return false}
  if(ctx.role!=='owner'){
   set('viewer','✅ فایل‌ها آماده‌اند؛ دسترسی فقط‌مشاهده.',{workspace:ws,shell_ready:true,license_ready:false,ready:false});
   return false;
  }
  const already=await cachedLease(ws);
  if(leaseLongEnough(already)&&leaseForOwner(already,user,ws)&&localSnapshotReady(user,ws)){
    set('ready','✅ آفلاین آماده است.',{workspace:ws,shell_ready:true,license_ready:true,ready:true});
    return true;
  }
  set('license','فایل‌های برنامه آماده‌اند؛ در حال ثبت/بررسی دستگاه و دریافت مجوز امضاشده از سرور…',{workspace:ws,shell_ready:true,license_ready:false,ready:false});
  if(!window.zaviDeviceActivation?.prepare)throw Error('بخش مجوز دستگاه قابل استفاده نیست.');
  const lease=await window.zaviDeviceActivation.prepare({silent:true});
  if(context().workspace!==ws||currentUid()!==user)throw Error('حساب تغییر کرده است؛ مجوز حساب قبلی به حساب جدید منتقل نمی‌شود.');
  if(!lease?.claims?.can_write)throw Error('سرور مجوز معتبر برای این دستگاه صادر نکرد.');
  const snapshot=localSnapshotReady(user,ws);
  set(snapshot?'ready':'waiting',snapshot?'✅ آفلاین آماده است.':'اطلاعات همین فروشگاه هنوز به‌طور کامل در دستگاه محفوظ نشده است.',{workspace:ws,shell_ready:true,license_ready:true,ready:snapshot});
  return snapshot;
 })();
 try{return await job}catch(e){
  const message=String(e?.message||e);
  if(/ANOTHER_DEVICE_ACTIVE|دستگاه یا آدرس میزبانی آنلاین دیگری|another.device.active|Device not authorized|دستگاه اصلی دیگری/i.test(message)||e?.code==='ANOTHER_DEVICE_ACTIVE')actionRequired('برای این فروشگاه دستگاه اصلی دیگری ثبت شده است. در «اشتراک من»، «انتقال دستگاه اصلی به همین دستگاه» را با تأیید مالک انجام دهید.');
  else set('error','⚠️ آماده‌سازی خودکار کامل نشد: '+message,{workspace:ws,shell_ready:!!window.zaviOfflineShell?.status?.()?.ready,license_ready:false,ready:false});
  return false;
 }finally{job=null;jobWorkspace=''}
}
function plan(force=false,ms=200){clearTimeout(timer);timer=setTimeout(()=>{prepareOnce(force).catch(e=>console.warn('ZAVI automatic offline preparation:',e))},ms)}
window.zaviAutoOffline={prepare:()=>prepareOnce(true),status:()=>({...STATUS})};
function refreshStatus(){
 const ws=context().workspace;
 if(STATUS.workspace!==ws){plan(false,300);return;}
 // Persisted token on reload is the authority; updating the UI must not invent a grant.
 const ready=window.zaviOfflineStatus?.()?.valid_now===true;
 if(!online()&&ready && localSnapshotReady(currentUid(),ws) && window.zaviOfflineShell?.status?.()?.ready){set('offline_ready','✅ فروش و خرید آفلاین در همین حساب با مجوز معتبر آماده است.',{ready:true,license_ready:true});}
}
document.addEventListener('DOMContentLoaded',()=>plan(false,700));
window.addEventListener('load',()=>plan(false,1100));
window.addEventListener('online',()=>plan(true,1000));
window.addEventListener('zavi-cloud-workspace-selected',()=>{lastAttempt='';plan(true,1100)});
window.addEventListener('zavi-cloud-logged-out',()=>{lastAttempt='';noteNoWorkspace()});
navigator.serviceWorker?.addEventListener('controllerchange',()=>plan(true,700));
window.addEventListener('offline',refreshStatus);
window.addEventListener('focus',()=>{if(online())plan(false,1100);else refreshStatus()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')plan(false,900)});
window.addEventListener('zavi-offline-lease-ready',()=>{const ws=context().workspace;const s=window.zaviOfflineShell?.status?.();if(s?.ready&&localSnapshotReady(currentUid(),ws)&&window.zaviOfflineStatus?.()?.valid_now===true){set('ready','✅ آفلاین آماده است.',{workspace:ws,shell_ready:true,license_ready:true,ready:true})}});
window.addEventListener('zavi-offline-preparation',e=>{
 const detail=e?.detail||{};
 if(detail.status==='error'&&/دستگاه یا آدرس میزبانی آنلاین دیگری/.test(detail.message||'')) actionRequired('دستگاه دیگری ثبت شده است. انتقال دستگاه اصلی به همین دستگاه فقط با تأیید مالک انجام می‌شود.');
});
// Catch workspaces chosen asynchronously by cloud.js (or a switch between owners).
let observed='';setInterval(()=>{
 const c=context(),identity=currentUid()+'|'+(c.workspace||'')+'|'+(c.role||'');
 if(identity!==observed){observed=identity;lastAttempt='';if(online())plan(false,700);else refreshStatus();return}
 if(online()){
   const ws=c.workspace;
   if(ws&&c.role==='owner'&&STATUS.workspace===ws&&STATUS.ready && window.zaviOfflineStatus?.()?.valid_now===true)return;
   if(clock()-lastTry>RETRY_ERROR_MS)plan(false,700);
 }
},15000);
})();
