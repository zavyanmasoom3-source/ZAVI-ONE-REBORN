/* ZAVI ONE V47 — automatic offline user experience.
 * Everything non-destructive is automatic for the active owner/subscription.
 * Never silently move an already bound primary device; only owner confirmation.
 * Never promise offline permission based on UI; signed lease and RLS remain authoritative.
 */
(()=>{'use strict';
let scheduled=false,lastKey='';
const $=s=>document.querySelector(s);
function visible(el,show){if(el&&el.hidden===show)el.hidden=!show;}
function text(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function online(){return navigator.onLine!==false;}
function ctx(){try{return window.zaviCloudRestoreInfo?.()||{}}catch{return {}}}
function signed(){try{return window.zaviOfflineStatus?.()?.valid_now===true}catch{return false}}
function localDataReady(c){
 try{
  const uid=window.zaviCloudGetAuthSession?.()?.user?.id||'';
  if(!uid||!c.workspace)return false;
  const text=localStorage.getItem('zavi_v34_tenant_'+uid+'_'+c.workspace);
  const value=text?JSON.parse(text):null;
  return !!(value&&Array.isArray(value.tx)&&Array.isArray(value.products)&&Array.isArray(value.contacts)&&Array.isArray(value.accounts));
 }catch(_){return false}
}

function state(){try{return window.zaviAutoOffline?.status?.()||{phase:'starting'}}catch{return {phase:'starting'}}}
function shell(){try{return window.zaviOfflineShell?.status?.()||{}}catch{return {}}}
function recoveryChoice(phase,ctxInfo){return !!(ctxInfo?.workspace && ctxInfo?.role==='owner' && (phase==='action_required'||phase==='error'));}
function statusMessage(phase,c,valid,appReady){
 if(!c.workspace)return {kind:'waiting',summary:'پس از فعال‌سازی اشتراک آماده می‌شود.',help:''};
 if(c.role!=='owner')return {kind:'viewer',summary:'دسترسی فقط‌مشاهده',help:''};
 if(valid&&appReady)return {kind:'ready',summary:'آفلاین آماده است',help:''};
 if(phase==='action_required')return {kind:'action_required',summary:'برای فعال‌کردن آفلاین یک‌بار «انتقال دستگاه اصلی به این دستگاه» را بزنید.',help:'در صورت تأیید سرور، مجوز و فایل‌های آفلاین خودکار آماده می‌شوند. اگر دستگاه قبلی همگام نشده یا در دسترس نیست، برای حفظ فاکتورها ابتدا از همان دستگاه همگام‌سازی یا از پشتیبان بازیابی کنید.'};
 if(!online())return {kind:'offline_wait',summary:'مجوز آفلاین فعال نیست',help:'برای دریافت مجوز، اینترنت لازم است.'};
 if(phase==='error')return {kind:'error',summary:'آماده‌سازی تکمیل نشد',help:'برنامه در اتصال بعدی دوباره تلاش می‌کند. در صورت نیاز، بررسی مشکل را باز کنید.'};
 return {kind:'working',summary:'در حال آماده‌سازی خودکار…',help:''};
}
function paint(){
 const card=$('[data-zavi-auto-offline-card]');if(!card)return;
 const c=ctx(),s=state(),sh=shell(),valid=signed(),appReady=!!(sh.ready&&sh.controlled&&localDataReady(c));
 const sameOwner=s.workspace===c.workspace||!s.workspace;
 const phase=sameOwner?s.phase:'starting';
 const output=statusMessage(phase,c,valid,appReady);
 card.dataset.state=output.kind;
 text(card.querySelector('[data-zavi-auto-offline-status]'),output.summary);
 text(card.querySelector('[data-zavi-auto-offline-help]'),output.help);
 const actions=card.querySelector('[data-zavi-offline-recovery]');
 // Only errors, insufficient permissions and manual device transfers expose tools.
 const needHelp=!!(c?.workspace && c.role==='owner');
 visible(actions,needHelp);
 const transfer=card.querySelector('[data-zavi-offline-transfer]');
 visible(transfer,needHelp&&output.kind==='action_required'&&online());
 const retry=card.querySelector('[data-zavi-auto-retry]');
 visible(retry,needHelp&&online());
 if(!needHelp)text(card.querySelector('[data-zavi-health]'),'');
 const key=(c.workspace||'')+'|'+(c.role||'')+'|'+output.kind;
 if(key!==lastKey){lastKey=key;}
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;paint()});}
async function retry(button){
 if(button.disabled)return;
 button.disabled=true;
 text($('[data-zavi-auto-offline-status]'),'در حال تلاش دوباره…');
 try{await window.ZaviAutoLease?.refresh?.();await window.zaviAutoOffline?.prepare?.();}catch(e){console.warn('ZAVI offline retry:',e)}
 finally{button.disabled=false;schedule()}
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-zavi-auto-retry]');if(btn){e.preventDefault();retry(btn)}});
const events=['zavi-auto-offline-status','zavi-shell-status','zavi-offline-lease-ready','zavi-offline-preparation','zavi-cloud-workspace-selected','zavi-cloud-logged-out','online','offline','visibilitychange'];
for(const ev of events)window.addEventListener(ev,schedule);
// annual-license.js repaints its view repeatedly. Observe inserted cards only, not attributes.
function init(){
 const root=document.getElementById('app')||document.body;
 new MutationObserver(()=>schedule()).observe(root,{childList:true,subtree:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
// Signed expiry may pass without an event; refresh the chip without auto-renewing offline.
setInterval(schedule,30000);
window.zaviOfflineAutoUI={refresh:schedule};
})();
