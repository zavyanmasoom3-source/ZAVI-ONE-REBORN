/* ZAVI ONE 65.70 - clear read-only offline licence details in Settings.
 * Reads existing authenticated, owner-scoped server status; never modifies permissions.
 * The issued ES256 device lease, not the local status text, determines write access.
 */
(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s);
const dict={
 fa:{heading:'وضعیت مجوز آفلاین من',sub:'مجوز واقعی به دستگاه اصلی و اشتراک فعال وابسته است.',not:'برای مشاهده، نخست وارد حساب ابری شوید و فروشگاه را انتخاب کنید.',loading:'در حال بررسی وضعیت سرور...',active:'آفلاین فعال',disabled:'مجوز آفلاین فعال نیست',duration:'مدت مجاز',expired:'پایان اشتراک',effective:'پایان مجوز امضاشده دستگاه',remaining:'روزهای باقی‌مانده',refresh:'تازه‌سازی وضعیت',need:'برای دریافت مجوز امضاشده باید با اینترنت وارد شوید و دستگاه اصلی تأیید شود.',off:'در حالت بدون اینترنت فقط اعتبار امضاشدۀ ذخیره‌شده قابل بررسی است.',error:'دریافت وضعیت سرور انجام نشد؛ داده‌ها تغییر نکردند.',none:'هنوز مجوز امضاشده برای این دستگاه دریافت نشده است.',notice:'مجوز ۳۶۵ روزه از پایان اشتراک بیشتر نمی‌شود؛ فروش‌های ارسال‌نشده را حفظ کنید.'},
 ps:{heading:'زما د آفلاین جواز حالت',sub:'اصلي وسیله او فعال ګډون ته اړتیا لري.',not:'لومړی کلاوډ حساب ته ننوځئ او دوکان وټاکئ.',loading:'د سرور حالت کتل کېږي...',active:'آفلاین فعال دی',disabled:'آفلاین جواز نشته',duration:'موده',expired:'د ګډون پای',effective:'د وسیلې د لاسلیک شوي جواز پای',remaining:'پاتې ورځې',refresh:'حالت تازه کړئ',need:'د لاسلیک شوي جواز لپاره انټرنېټ او د اصلي وسیلې تایید پکار دی.',off:'بې انټرنېټه یوازې ساتل شوی جواز لیدل کېږي.',error:'د سرور حالت ونه موندل شو؛ معلومات نه دي بدل شوي.',none:'د دې وسیلې جواز نه دی ترلاسه شوی.',notice:'۳۶۵ ورځې اجازه د ګډون تر پایه محدوده ده؛ نالېږل شوې معاملې وساتئ.'},
 en:{heading:'My offline licence',sub:'A signed licence is bound to the main device and active subscription.',not:'Sign in to your cloud account and select your store first.',loading:'Checking licence with server...',active:'Offline enabled',disabled:'Offline not enabled',duration:'Allowed duration',expired:'Subscription expires',effective:'Signed device licence expires',remaining:'Days remaining',refresh:'Refresh status',need:'Connect online and verify your main device to request a signed licence.',off:'While offline, only a previously verified signed lease can be checked.',error:'Server status unavailable; no data was changed.',none:'No signed licence is stored for this device.',notice:'365-day permission never exceeds subscription expiry. Keep unsynced transactions safe.'}
};
const locale=()=>{let v=($('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const time=x=>{let d=new Date(x);return x&&!Number.isNaN(d.getTime())?d.toLocaleDateString(locale()==='en'?'en-GB':locale()==='ps'?'ps-AF':'fa-AF',{year:'numeric',month:'short',day:'numeric'}):'—'};
const el=(tag,cl,t)=>{const a=document.createElement(tag);if(cl)a.className=cl;if(t!==undefined)a.textContent=t;return a};
const sessionInfo=()=>window.zaviCloudRestoreInfo?.()||{};
let loading=false;
async function load(){
 const card=$('#z70-store-status');if(!card||loading)return;const d=dict[locale()];
 const out=$('#z70-store-details'),note=$('#z70-store-message');if(!out||!note)return;
 out.replaceChildren();loading=true;const button=$('#z70-store-refresh');if(button)button.disabled=true;
 const ws=sessionInfo().workspace,secure=window.zaviSecureOfflineLicense;
 if(!ws){note.textContent=d.not;loading=false;if(button)button.disabled=false;return}
 try{
   const cache=await secure?.cached(ws).catch(()=>null)||null;
   const signed=cache?.claims?.exp&&cache.claims.workspace_id===ws&&window.zaviOfflineStatus?.()?.valid_now===true;
   let data=null;
   if(navigator.onLine!==false){
     const ss=await window.zaviCloudRefreshAuthSession?.()||window.zaviCloudGetAuthSession?.();
     const cfg=window.zaviCloudGetPublicConfig?.();
     if(ss?.access_token&&cfg?.url&&cfg?.key){
      note.textContent=d.loading;
      const response=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_v28_offline_license_status',{
       method:'POST',headers:{'content-type':'application/json','apikey':cfg.key,'authorization':'Bearer '+ss.access_token},
       body:JSON.stringify({p_workspace_id:ws})
      });
      if(!response.ok)throw Error('server:'+response.status);
      const result=await response.json();data=Array.isArray(result)?result[0]:result;
     }
   }
   function field(key,value){let row=el('div','z70-field');row.append(el('span','',key),el('strong','',String(value)));out.append(row)}
   if(data){
    field(d.duration,data.offline_allowed_days?data.offline_allowed_days+' '+(locale()==='en'?'days':'روز'):'—');
    field(d.expired,time(data.subscription_expires_at));
   }
   field(d.effective,signed?time(cache.claims.exp*1000):'—');
   if(signed){const days=Math.max(0,Math.ceil((cache.claims.exp*1000-Date.now())/86400000));field(d.remaining,days);note.textContent=d.active}
   else note.textContent=data?.offline_enabled?d.need:(!data&&navigator.onLine===false?d.off:d.disabled);
   if(!signed&&!data)out.append(el('p','z70-muted',d.none));
 }catch(e){note.textContent=d.error;out.append(el('p','z70-muted',d.off))}
 finally{loading=false;if(button)button.disabled=false}
}
function mount(){
 const content=$('#content');if(!content)return;
 const settings=$('.zavi-clean-settings-hub',content);if(!settings)return;
 if($('#z70-store-status',content))return;
 const d=dict[locale()],card=el('section','z70-store-card');card.id='z70-store-status';
 const title=el('div','z70-store-title');const inner=el('div','');
 inner.append(el('strong','',d.heading),el('small','',d.sub));
 const btn=el('button','',d.refresh);btn.type='button';btn.id='z70-store-refresh';btn.addEventListener('click',load);
 title.append(inner,btn);
 const notice=el('p','z70-store-notice',d.notice);const details=el('div','z70-store-details');details.id='z70-store-details';const msg=el('p','z70-store-message',d.not);msg.id='z70-store-message';msg.setAttribute('role','status');
 card.append(title,details,msg,notice);settings.before(card);load();
}
function start(){
 const content=$('#content');if(!content)return;
 let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})};
 new MutationObserver(schedule).observe(content,{childList:true});
 ['zavi-cloud-workspace-selected','zavi-cloud-session-changed','zavi-offline-lease-ready','zavi-cloud-logged-out','online','offline'].forEach(event=>window.addEventListener(event,()=>{if($('#z70-store-status'))load();else schedule()}));
 document.addEventListener('change',event=>{if(event.target?.id==='zaviTopLanguage')schedule()});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();