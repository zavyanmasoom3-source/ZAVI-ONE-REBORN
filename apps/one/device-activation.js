/* ZAVI ONE V41: secure self-service owner transfer and paid offline onboarding.
 * Existing primary devices are never silently revoked or swapped.
 */
(()=>{'use strict';
const DEVICE_KEY='zavi_v26_primary_device_uuid';
let registeredFor='', registeredAt=0, inflight=null, preparingFor='', leaseInflight=null, leaseFor='', lastState={status:'idle',message:'',updated_at:0};
let transferInflight=null;
const lang=()=>window.zaviPublicLanguage?.()||document.documentElement.lang||'fa-AF';
const msg=(fa,en,ps)=>lang()==='en'?en:lang()==='ps-AF'?ps:fa;
function transferMessage(text,kind='info'){
 const btn=document.getElementById('zaviDeviceReplace');
 if(!btn)return;let out=document.getElementById('zaviDeviceTransferStatus');
 if(!out){out=document.createElement('p');out.id='zaviDeviceTransferStatus';out.setAttribute('role','status');out.setAttribute('aria-live','polite');out.style.cssText='margin:10px 0;padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.8;white-space:pre-line;';btn.insertAdjacentElement('afterend',out)}
 out.style.background=kind==='error'?'rgba(217,106,41,.12)':kind==='success'?'rgba(12,161,119,.13)':'rgba(64,143,212,.10)';
 out.style.border='1px solid '+(kind==='error'?'rgba(217,106,41,.35)':kind==='success'?'rgba(12,161,119,.35)':'rgba(64,143,212,.28)');
 out.style.color='inherit';out.textContent=text;
}
// Emergency owner recovery is opt-in, not an automatic response to a stale report.
// Never claim that offline-only records on an unreachable device were transferred/deleted.
const EMERGENCY_CODES=new Set(['previous_stale','previous_pending']);
function emergencyWarning(reason){
 const pending=reason==='previous_pending';
 return pending?msg(
  '⚠️ دستگاه قبلی معاملات ارسال‌نشده گزارش کرده است.\n\nاگر انتقال را ادامه دهید، فقط اطلاعاتی که قبلاً در ابر ذخیره شده‌اند روی دستگاه جدید می‌آیند. معاملات ارسال‌نشده دستگاه قبلی ممکن است برای همیشه از دست بروند.\n\nدستگاه قبلی را بعد از انتقال برای ثبت معامله استفاده نکنید.\n\nآیا به‌عنوان مالک، خطر ازدست‌رفتن این معاملات را می‌پذیرید و انتقال اضطراری را تأیید می‌کنید؟',
  '⚠️ The previous device REPORTS UNSENT TRANSACTIONS.\n\nOnly cloud-synced data can be restored. Unsent invoices on that device may be permanently lost. Do not keep using the previous device after transfer.\n\nAs the owner, do you accept that loss and approve emergency transfer?',
  '⚠️ پخوانۍ وسیله نه لېږل شوې معاملې لري.\n\nیوازې د کلاوډ خوندي معلومات به راوګرځي. نه لېږل شوي بلونه ښايي د تل لپاره له لاسه ولاړ شي. له لېږد وروسته پخوانۍ وسیله مه کاروئ.\n\nایا د مالک په توګه دا خطر منئ او بېړنی لېږد تاییدوئ؟'):
 msg(
  '⚠️ گزارش دستگاه قبلی قدیمی یا نامعلوم است.\n\nاین انتقال اضطراری است. فقط اطلاعات همگام‌شده در ابر به دستگاه جدید می‌آیند؛ فاکتورها و معاملاتِ فقط موجود در دستگاه قبلی ممکن است برای همیشه از دست بروند.\n\nاگر دستگاه قبلی بعداً روشن شد، قبل از هر استفاده، با پشتیبانی بررسی کنید.\n\nآیا به‌عنوان مالک این خطر را می‌پذیرید و انتقال اضطراری را تأیید می‌کنید؟',
  '⚠️ The previous device status is stale or unknown.\n\nEmergency transfer restores only cloud-synced data. Offline-only invoices may be permanently lost. If the old device returns, do not use it until reviewed.\n\nAs owner, do you accept this risk and approve emergency transfer?',
  '⚠️ د پخوانۍ وسیلې حالت زوړ یا نامعلوم دی.\n\nبېړنی لېږد یوازې د کلاوډ خوندي معلومات راوړي. یوازې په پخوانۍ وسیله کې پاتې بلونه ښايي د تل لپاره له لاسه ولاړ شي.\n\nکه پخوانۍ وسیله بیا پیدا شي، تر کتنې مخکې یې مه کاروئ.\n\nایا دا خطر منئ او بېړنی لېږد تاییدوئ؟');
}
async function confirmEmergencyTransfer(reason){
 const question=emergencyWarning(reason);
 // The branded dialog avoids browser-provided host names in alerts and remains
 // accessible on Safari. Fallback to confirm for older/no-dialog environments.
 if(typeof HTMLDialogElement==='undefined'||!document.body?.appendChild){return !!window.confirm?.(question)}
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='z6523-emergency-dialog';
  dialog.setAttribute('aria-labelledby','z6523EmergencyTitle');
  const box=document.createElement('div');box.className='z6523-emergency-box';
  const title=document.createElement('h3');title.id='z6523EmergencyTitle';
  title.textContent=msg('بازیابی اضطراری دستگاه','Emergency device recovery','د وسیلې بېړنی بېرته فعالول');
  const para=document.createElement('p');para.className='z6523-emergency-warning';para.textContent=question;
  const actions=document.createElement('div');actions.className='z6523-emergency-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='btn subtle';cancel.textContent=msg('انصراف','Cancel','لغوه');
  const approve=document.createElement('button');approve.type='button';approve.className='btn danger';approve.textContent=msg('تأیید انتقال اضطراری','Confirm emergency transfer','بېړنی لېږد تایید کړه');
  actions.append(cancel,approve);box.append(title,para,actions);dialog.append(box);
  let settled=false;
  const close=value=>{if(settled)return;settled=true;dialog.close?.();dialog.remove();resolve(value)};
  cancel.addEventListener('click',()=>close(false));approve.addEventListener('click',()=>close(true));
  dialog.addEventListener('cancel',ev=>{ev.preventDefault();close(false)});
  dialog.addEventListener('close',()=>close(false));
  document.body.appendChild(dialog);
  try{dialog.showModal();cancel.focus()}catch(_){dialog.remove();resolve(!!window.confirm?.(question))}
 });
}
async function verifyCloudWorkspace(ws,auth,cfg){
 // Read-only check: never delete or replace the owner's cloud ledger to activate a device.
 const url=cfg?.url?.replace(/\/$/,'');
 if(!url||!cfg.key||!auth?.access_token)throw Error(msg('اتصال ابری معتبر نیست.','A valid cloud session is required.','د کلاوډ معتبره ناسته اړینه ده.'));
 const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),12000);
 try{
  const res=await fetch(url+'/rest/v1/zavi_workspaces?select=id,revision&id=eq.'+encodeURIComponent(ws),{headers:{apikey:cfg.key,Authorization:'Bearer '+auth.access_token,Accept:'application/json'},cache:'no-store',signal:ctl.signal});
  if(!res.ok)throw Error('HTTP '+res.status);
  const rows=await res.json();
  if(!Array.isArray(rows)||rows.length!==1||rows[0]?.id!==ws)throw Error('Workspace not found in the cloud');
  return true;
 }finally{clearTimeout(timeout)}
}
function busyTransfer(busy){const b=document.getElementById('zaviDeviceReplace');if(b){b.disabled=!!busy;b.setAttribute('aria-busy',String(!!busy))}}
const update=(status,message='')=>{lastState={status,message,updated_at:Date.now()};window.dispatchEvent?.(new CustomEvent('zavi-offline-preparation',{detail:{status,message}}));};
function getDeviceId(){let value='';try{value=localStorage.getItem(DEVICE_KEY)||''}catch{}if(!value){value=crypto.randomUUID();try{localStorage.setItem(DEVICE_KEY,value)}catch{throw Error('حافظه دستگاه قابل استفاده نیست. اجازه ذخیره مرورگر را فعال کنید.')}}return value;}
function currentWs(){const s=window.zaviCloudRestoreInfo?.()||{};if(!s.workspace||s.role!=='owner')throw Error('فقط مالک فروشگاه می‌تواند دستگاه اصلی را فعال کند.');return s.workspace;}
function config(){return window.ZAVI_CLOUD_DEFAULTS||JSON.parse(localStorage.getItem('z20_cloud_settings')||'{}');}
async function rpc(name,body,session,cfg){
 const auth=session||await window.zaviCloudRefreshAuthSession?.();const c=cfg||config();
 if(!auth?.access_token||!c.url||!c.key)throw Error('ابتدا به حساب ابری خود وارد شوید.');
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);
 let res;try{res=await fetch(c.url.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:c.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal})}finally{clearTimeout(timeout)}
 const value=await res.json().catch(()=>null);
 if(!res.ok){const e=new Error(value?.message||'عملیات ثبت دستگاه در سرور موفق نبود.');e.httpStatus=res.status;throw e;}
 return value;
}
async function ensureRegistered(ws,session,cfg){
 if(!ws||currentWs()!==ws)throw Error('فروشگاه انتخاب‌شده عوض شده است.');
 if(registeredFor===ws&&Date.now()-registeredAt<120000)return true;
 if(inflight&&preparingFor===ws)return inflight;
 // Do not reuse another tenant's pending device request.
 if(inflight&&preparingFor!==ws)await inflight.catch(()=>{});
 preparingFor=ws;
 inflight=(async()=>{
  const device=getDeviceId(),args={p_workspace_id:ws,p_device_id:device};
  const checked=await rpc('zavi_v26_check_device',args,session,cfg);const state=Array.isArray(checked)?checked[0]:checked;
  if(state?.device_allowed===true&&state?.device_status==='active'){registeredFor=ws;registeredAt=Date.now();return true;}
  const result=await rpc('zavi_v26_register_device',{...args,p_device_name:(navigator.userAgentData?.platform||navigator.platform||'ZAVI ONE Device').slice(0,150)},session,cfg);
  if(result==='ANOTHER_DEVICE_ACTIVE'){
    const e=new Error('این حساب در دستگاه یا آدرس میزبانی آنلاین دیگری فعال است. اگر مالک حساب هستید، با اینترنت دکمه «انتقال دستگاه اصلی به همین دستگاه» را در «اشتراک من» بزنید.');e.code='ANOTHER_DEVICE_ACTIVE';throw e;
  }
  if(!['DEVICE_ACTIVATED','DEVICE_ALREADY_ACTIVE'].includes(result))throw Error('ثبت دستگاه تأیید نشد: '+result);
  registeredFor=ws;registeredAt=Date.now();return true;
 })();
 try{return await inflight}finally{inflight=null;preparingFor='';}
}
async function prepare({silent=false,session=null,cfg=null}={}){
 const ws=currentWs();
 if(leaseInflight&&leaseFor===ws)return leaseInflight;
 if(leaseInflight&&leaseFor!==ws)await leaseInflight.catch(()=>{});
 leaseFor=ws;update('preparing','در حال بررسی دستگاه و دریافت مجوز امضاشده...');
 leaseInflight=(async()=>{try{
  const auth=session||await window.zaviCloudRefreshAuthSession?.(),settings=cfg||config();
  await ensureRegistered(ws,auth,settings);
  if(!window.zaviSecureOfflineLicense)throw Error('ماژول تأیید مجوز آفلاین بارگذاری نشده است.');
  const lease=await window.zaviSecureOfflineLicense.request(ws,auth,settings);
  if(window.zaviCloudRestoreInfo?.()?.workspace!==ws)throw Error('حساب فعال تغییر کرده است.');
  if(!lease?.claims?.can_write)throw Error('مجوز معتبر از سرور دریافت نشد.');
  update('ready','دستگاه آماده است؛ فروش و خرید با اینترنت قطع تا زمان اعتبار مجوز ذخیره می‌شوند.');
  window.dispatchEvent?.(new CustomEvent('zavi-offline-lease-ready',{detail:{workspace:ws,expires_at:lease.claims.exp*1000}}));
  if(!silent)alert('✅ مجوز آفلاین معتبر دریافت شد. می‌توانید پس از قطع اینترنت خرید و فروش ثبت کنید.');
  return lease;
 }catch(e){update('error',e?.message||String(e));if(!silent)alert('آماده‌سازی آفلاین انجام نشد:\n'+(e?.message||e));throw e;}})();
 try{return await leaseInflight}finally{leaseInflight=null;leaseFor=''}
}
// V65.21: exactly one owner action launches safe transfer, signed lease and
// app-shell download. The owner does not need to press three separate buttons.
// No stale or unknown previous-device report can be treated as a clean sync.
async function replacePrimary(){
 if(transferInflight)return transferInflight;
 transferInflight=(async()=>{
  const ws=currentWs();
  if(navigator.onLine===false){transferMessage(msg('برای انتقال دستگاه به اینترنت وصل شوید.','Connect to the internet to transfer this device.','د وسیلې د لېږد لپاره انټرنېټ سره ونښلئ.'),'error');return false;}
  busyTransfer(true);
  transferMessage(msg('در حال بررسی و فعال‌سازی آفلاین…','Checking the device and enabling offline access…','وسیله کتل کېږي او آفلاین اجازه فعالېږي…'));
  update('preparing','در حال بررسی انتقال و آماده‌سازی آفلاین…');
  let moved=false;
  try{
   const auth=await window.zaviCloudRefreshAuthSession?.();
   if(!auth?.access_token)throw Error(msg('ابتدا با حساب مالک وارد ابر شوید.','Sign in as the business owner first.','لومړی د دوکان د مالک حساب ته ننوځئ.'));
   const cfg=config(),id=getDeviceId();
   const result=await rpc('zavi_v26_check_device',{p_workspace_id:ws,p_device_id:id},auth,cfg);
   const device=Array.isArray(result)?result[0]:result;
   const already=device?.device_allowed===true&&device?.device_status==='active';
   if(!already){
    if(typeof window.ZaviDevices652?.guardTransfer!=='function')throw Error(msg('بخش بررسی ایمنی دستگاه بارگذاری نشده است. صفحه را با اینترنت دوباره باز کنید.','Device safety check is unavailable. Reopen the page while online.','د وسیلې خوندي کتنه نشته؛ پاڼه له انټرنېټ سره بیا خلاصه کړئ.'));
    // New release: device list is fetched fresh on every transfer attempt.
    const approved=await window.ZaviDevices652.guardTransfer(ws,id,{silent:true});
    if(!approved){
       transferMessage(msg('در حال بررسی اجازه انتقال در سرور…','Checking device transfer eligibility on the server…','د سرور له لارې د وسیلې لېږد څېړل کېږي…'),'info');
     }
     const reply=await rpc('zavi_v6580_owner_one_tap_transfer',{p_workspace_id:ws,p_new_device_id:id,p_new_device_name:(navigator.userAgentData?.platform||navigator.platform||'ZAVI ONE Device').slice(0,150)},auth,cfg);
    if(!['DEVICE_ACTIVATED','DEVICE_REPLACED','DEVICE_ALREADY_ACTIVE'].includes(reply))throw Error(msg('انتقال توسط سرور تأیید نشد.','The server did not confirm the transfer.','سرور لېږد تایید نه کړ.'));
    moved=true;registeredFor='';registeredAt=0;
   }
   // Obtain the signed offline lease immediately after transfer/renewal.
   transferMessage(msg('دستگاه تأیید شد؛ در حال دریافت مجوز آفلاین و فایل‌های برنامه…','Device verified; obtaining your offline license and app files…','وسیله تایید شوه؛ آفلاین اجازه او د پروګرام فایلونه ترلاسه کېږي…'));
   await prepare({silent:true,session:auth,cfg});
   let filesReady=false;
   try{
    const shell=window.zaviOfflineShell;
    const state=shell?.prepare?await shell.prepare():null;
    filesReady=!!(state?.ready&&state?.controlled&&state?.protocol==='zavi-shell-v2');
   }catch(_){/* Signed lease is still valid; file download can be retried. */}
   // The account snapshot is a separate prerequisite for actual offline sales.
   const snapshot=!!window.zaviTenantIsBound?.();
   if(filesReady&&snapshot){
    update('ready','دستگاه اصلی فعال و مجوز آفلاین دریافت شد.');
    transferMessage(msg('✅ مجوز آفلاین دریافت شد و برنامه آماده است.','✅ Offline license received. The app is ready.','✅ آفلاین اجازه ترلاسه شوه او پروګرام چمتو دی.'),'success');
    return true;
   }
   update('license_ready','مجوز دستگاه دریافت شد؛ فایل‌ها یا اطلاعات فروشگاه باید تکمیل شوند.');
   transferMessage(filesReady?
    msg('✅ مجوز آفلاین دریافت شد. برای فروش بدون اینترنت، ابتدا اطلاعات فروشگاه را همگام کنید.','✅ License received. Sync business data before offline sales.','✅ اجازه ترلاسه شوه؛ د آفلاین پلور لپاره د دوکان معلومات همغږي کړئ.'):
    msg('✅ مجوز آفلاین دریافت شد. دانلود فایل‌های آفلاین هنوز کامل نیست؛ با اینترنت «دریافت فایل‌ها» را بزنید.','✅ License received. App files are still downloading; use Prepare offline files while online.','✅ اجازه ترلاسه شوه؛ د پروګرام آفلاین فایلونه لا بشپړ نه دي.'));
   return true;
  }catch(e){
   const raw=e?.message||String(e);
   const detail=/Could not find the function|PGRST202|schema cache/i.test(raw)?
     msg('تابع دستگاه در سرور موجود نیست. سرور اصلی را بررسی کنید.','The device function is unavailable on the server.','د وسیلې خدمت په سرور کې نشته.'):raw;
   const lead=moved?msg('دستگاه منتقل شد، ولی مجوز آفلاین هنوز دریافت نشده است. اینترنت را وصل نگه دارید و دوباره همین دکمه را بزنید.','Device transferred, but the offline license was not issued. Stay online and press the same button again.','وسیله ولېږدېده، خو آفلاین اجازه لا نه ده صادره شوې.'):'';
   update(moved?'transfer_done_lease_failed':'error',detail);
   transferMessage((lead?lead+'\n':'')+detail,'error');return false;
  }finally{busyTransfer(false)}
 })();
 try{return await transferInflight}finally{transferInflight=null}
}
async function check(){
 try{
  const ws=currentWs(),lease=await window.zaviSecureOfflineLicense?.cached(ws);
  if(!navigator.onLine){alert(lease?'✅ مجوز امضاشده معتبر است.\nدقیقه باقی‌مانده: '+Math.ceil((lease.claims.exp*1000-Date.now())/60000):'مجوز آفلاین این دستگاه موجود نیست یا مدت آن تمام شده است. ابتدا آنلاین شوید و دستگاه را آماده کنید.');return}
  const auth=await window.zaviCloudRefreshAuthSession?.();const state=await rpc('zavi_v26_check_device',{p_workspace_id:ws,p_device_id:getDeviceId()},auth,config());const d=Array.isArray(state)?state[0]:state;
  alert('وضعیت دستگاه: '+(d?.device_status||'نامشخص')+'\nمجوز سرور: '+(d?.device_allowed?'مجاز':'مجاز نیست')+'\nمجوز امضاشده محلی: '+(lease?'معتبر':'موجود نیست یا ختم‌شده')+'\n'+(d?.device_allowed?'':'اگر دستگاه دیگری فعال است، دکمه «انتقال دستگاه اصلی به همین دستگاه» را بزنید؛ فقط مالک اشتراک فعال مجاز است.'));
 }catch(e){alert('بررسی دستگاه: '+(e?.message||e))}
}
async function copyId(){const id=getDeviceId();try{await navigator.clipboard.writeText(id);alert('شناسه دستگاه کاپی شد؛ برای درخواست تعویض به مدیریت برند بفرستید.')}catch{window.prompt('شناسه دستگاه را کاپی کنید:',id)}}
window.zaviDeviceActivation={getDeviceId,ensureRegistered,prepare,replacePrimary,activate:()=>prepare().catch(()=>false),check,copyId,getStatus:()=>({...lastState})};

// V65.17: A newly signed-in browser may safely read the owner's SYNCED data,
// but an offline primary-device grant is distinct and requires verified transfer.
// Never display a recurring modal or automatically invoke replacePrimary on a
// background preparation error. The existing manual action remains available
// under Subscription and device management, where the owner can review it.
document.addEventListener('click',e=>{const button=e.target.closest('#zaviDeviceActivate,#zaviDeviceCheck,#zaviDeviceCopyId,#zaviDeviceReplace');if(!button)return;e.preventDefault();
 if(button.id==='zaviDeviceActivate')prepare().catch(()=>{});
 else if(button.id==='zaviDeviceCheck')check();else if(button.id==='zaviDeviceReplace')replacePrimary().catch(e=>alert('خطای انتقال: '+(e.message||e)));else copyId();
});
})();
