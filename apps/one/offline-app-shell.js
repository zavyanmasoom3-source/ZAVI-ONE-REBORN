/* ZAVI ONE V40: actual app-shell readiness + distinct signed offline license.
   Only same-origin cached pages work when Chrome has no network. */
(()=>{'use strict';
const STATE={ready:false,controlled:false,missing:[],version:'',protocol:'',app_cached:false,message:'در حال بررسی آماده‌بودن آفلاین…'};
let ongoing=null;
function messageNow(){
 const license=window.zaviOfflineStatus?.()||{};
 if(!STATE.controlled||!STATE.ready)return '⚠️ فایل‌های آفلاین آماده نیستند.';
 if(!license.valid_now)return '⚠️ مجوز آفلاین این دستگاه آماده نیست.';
 const c=window.zaviCloudRestoreInfo?.()||{};
 if(!c.workspace||!window.zaviTenantIsBound?.())return '⚠️ اطلاعات فروشگاه در دستگاه آماده نیست.';
 return '✅ حسابداری آفلاین آماده است.';
}

function updateUI(){
 const health=window.zaviOfflineHealth;const account=window.zaviCloudRestoreInfo?.();
 const ready=STATE.ready&&STATE.controlled&&window.zaviOfflineStatus?.()?.valid_now===true && !!window.zaviTenantIsBound?.() && !!account?.workspace;
 const msg=STATE.ready?'✅ فایل‌های برنامه آماده‌اند؛ مجوز آفلاین دستگاه جداگانه بررسی می‌شود.':(STATE.message||'⚠️ فایل‌های آفلاین آماده نیستند.');
 document.querySelectorAll('[data-zavi-shell-state]').forEach(el=>{if(el.textContent!==msg)el.textContent=msg;el.style.color=STATE.ready?'#08785d':'#985c0c'});
 window.dispatchEvent(new CustomEvent('zavi-shell-status',{detail:{...STATE,fully_ready:ready}}));
}
function ask(worker,type){return new Promise((resolve,reject)=>{
 const port=new MessageChannel(),timer=setTimeout(()=>{port.port1.close();reject(Error('دانلود فایل‌ها زمان‌بر شد؛ اینترنت را وصل بگذارید و وضعیت را دوباره بررسی کنید.'))},95000);
 port.port1.onmessage=e=>{clearTimeout(timer);port.port1.close();resolve(e.data||{})};
 try{worker.postMessage({type},[port.port2])}catch(e){clearTimeout(timer);reject(e)}
});}
async function activeWorker(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)throw Error('برای کار آفلاین، HTTPS و مرورگر دارای Service Worker لازم است.');
 // When connection dies, use the ALREADY installed worker. Re-registering a
 // worker while offline may itself fail even though the old worker is usable.
 let registration=await navigator.serviceWorker.getRegistration('./');
 if(!registration || !registration.active){
   registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('نصب فایل‌های آفلاین تکمیل نشد؛ اینترنت را وصل کنید.')),22000))]);
 }
 if(!registration.active){await new Promise(resolve=>setTimeout(resolve,900));registration=await navigator.serviceWorker.getRegistration('./')||registration;}
 if(!registration.active)throw Error('فایل‌های برنامه هنوز نصب نشده‌اند. اینترنت را وصل و دوباره آماده‌سازی کنید.');
 // Request a non-destructive update; activation still follows the app's
 // unsent-transaction safety gate rather than force-skipping a waiting worker.
 if(navigator.onLine!==false){try{registration.update?.().catch?.(()=>{})}catch(_){}}

 if(!navigator.serviceWorker.controller){
   await new Promise(resolve=>{const t=setTimeout(resolve,2500);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(t);resolve()},{once:true})});
 }
 return registration.active;
}
async function check(prepare=false){
 if(ongoing)return ongoing;
 ongoing=(async()=>{
  try{
   const worker=await activeWorker();
   const status=await ask(worker,prepare?'ZAVI_SHELL_PREPARE':'ZAVI_SHELL_STATUS');
   STATE.controlled=!!navigator.serviceWorker.controller;
   // V65.19: status protocol replaces the obsolete v57-v19 cache-name check.
   // Never mark shell ready merely because an unrelated old worker controls the page.
   STATE.protocol=String(status.protocol||'');
   STATE.app_cached=status.app_cached===true;
   STATE.ready=status.ready===true&&STATE.controlled&&STATE.protocol==='zavi-shell-v2'&&STATE.app_cached;
   STATE.missing=Array.isArray(status.missing)?status.missing:[];
   STATE.version=String(status.version||'V57');
   STATE.message=STATE.ready?'فایل‌های برنامه برای استفاده بدون اینترنت آماده‌اند.':
       (status.error?String(status.error):!STATE.protocol?'نسخه قدیمی حافظه فعال است؛ بعد از همگام‌سازی معاملات، با اینترنت برنامه را ببندید و دوباره باز کنید.':
         status.ready&&!STATE.app_cached?'فایل صفحه اصلی ذخیره نشده است؛ دریافت فایل‌ها را دوباره بزنید.':
         'فایل‌های آفلاین کامل نیستند؛ دریافت فایل‌ها را دوباره بزنید.');
  }catch(e){STATE.ready=false;STATE.controlled=!!navigator.serviceWorker?.controller;STATE.message=e?.message||String(e)}
  updateUI();return {...STATE};
 })();
 try{return await ongoing}finally{ongoing=null}
}
window.zaviOfflineShell={status:()=>({...STATE}),prepare:()=>check(true),check:()=>check(false)};
document.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-zavi-shell-prepare],[data-zavi-shell-check]');
 if(!btn)return;
 e.preventDefault();if(btn.disabled)return;
 btn.disabled=true;
 try{
  if(btn.hasAttribute('data-zavi-shell-prepare')&&navigator.storage?.persist){try{await navigator.storage.persist()}catch(_){}}
  const s=await check(btn.hasAttribute('data-zavi-shell-prepare'));
  if(btn.hasAttribute('data-zavi-shell-check')){
   const lease=window.zaviOfflineStatus?.()||{};
   alert('فایل‌های لازم: '+(s.ready?'آماده':'ناقص')+'\nمجوز دستگاه/اشتراک: '+(lease.valid_now?'معتبر':'آماده نیست')+'\n'+messageNow());
  }
 }finally{btn.disabled=false}
});
window.addEventListener('zavi-offline-lease-ready',()=>setTimeout(updateUI,200));
window.addEventListener('zavi-offline-preparation',()=>setTimeout(updateUI,200));
window.addEventListener('offline',()=>setTimeout(updateUI,200));
window.addEventListener('online',()=>setTimeout(()=>check(true),800));
navigator.serviceWorker?.addEventListener('controllerchange',()=>setTimeout(()=>check(false),350));
document.addEventListener('DOMContentLoaded',()=>{
 setTimeout(()=>check(navigator.onLine!==false),400);
 const root=document.getElementById('content')||document.getElementById('app')||document.body;
 new MutationObserver(()=>{if(document.querySelector('[data-zavi-shell-state]'))updateUI()}).observe(root,{childList:true,subtree:true});
});
})();
