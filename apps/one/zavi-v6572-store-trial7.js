/* ZAVI ONE 65.72: customer-facing 7-day trial subscription readout.
   Uses owner/workspace-scoped existing RPC and AUTH, caches expiry for DISPLAY only.
   No entitlement is granted locally; server and signed lease remain authoritative. */
(()=>{'use strict';
const q=(s,p=document)=>p.querySelector(s);
const D={
 fa:{heading:'اشتراک و آزمایش ۷ روزه',waiting:'برای مشاهده، وارد حساب ابری خود شوید.',check:'بررسی اعتبار',loading:'در حال بررسی اشتراک...',trial:'آزمایش رایگان ۷ روزه',annual:'اشتراک سالانه',semiannual:'اشتراک شش‌ماهه',lifetime:'اشتراک دائمی',unknown:'اشتراک',active:'فعال',suspended:'غیرفعال',expired:'منقضی',remaining:'روز باقی‌مانده',ends:'پایان اعتبار',cached:'آخرین وضعیت ذخیره‌شده (فقط جهت اطلاع)',error:'اتصال برقرار نیست. وضعیت سرور دریافت نشد.',note:'تمدید ۷ روزه فقط توسط مدیر مرکزی انجام می‌شود. حسابداری آفلاین به مجوز امضاشدۀ دستگاه وابسته است.'},
 en:{heading:'Subscription & 7-day trial',waiting:'Sign in to your cloud account to check your plan.',check:'Check status',loading:'Checking subscription...',trial:'7-day free trial',annual:'Annual plan',semiannual:'Six-month plan',lifetime:'Lifetime plan',unknown:'Subscription',active:'Active',suspended:'Suspended',expired:'Expired',remaining:'days remaining',ends:'Expires',cached:'Last cached information (display only)',error:'Network unavailable. Server status could not be fetched.',note:'Only central ADMIN can grant trials. Offline bookkeeping requires a separately signed device licence.'},
 ps:{heading:'ګډون او ۷ ورځنۍ ازموینه',waiting:'لومړی خپل کلاوډ حساب ته ننوځئ.',check:'وضعیت وګورئ',loading:'ګډون کتل کېږي...',trial:'۷ ورځنۍ وړیا ازموینه',annual:'کلنی ګډون',semiannual:'شپږ میاشتنی ګډون',lifetime:'دایمي ګډون',unknown:'ګډون',active:'فعال',suspended:'بند',expired:'ختم شوی',remaining:'ورځې پاتې',ends:'د اعتبار پای',cached:'وروستی خوندي وضعیت (یوازې معلومات)',error:'انټرنېټ نشته یا سرور ته لاسرسی نه شته.',note:'یوازې مرکزي مالک ۷ ورځې ورکوي. آفلاین حسابداري د وسیلې لاسلیک شوي جواز ته اړتیا لري.'}
};
const lang=()=>{let v=(q('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const el=(tag,cl,txt)=>{let x=document.createElement(tag);if(cl)x.className=cl;x.textContent=txt||'';return x};
let busy=false;
function view(data,stale){
 const w=D[lang()],target=q('#z72-trial-info');if(!target)return;target.replaceChildren();
 const plan=String(data.plan||'').toLowerCase();
 const planlabel=({trial:w.trial,annual:w.annual,semiannual:w.semiannual,lifetime:w.lifetime})[plan]||w.unknown;
 const expiry=data.expires_at&&Number.isFinite(Date.parse(data.expires_at))?new Date(data.expires_at):null;
 const days=expiry?Math.max(0,Math.ceil((expiry.getTime()-Date.now())/86400000)):null;
 const badge=el('strong','z72-trial-type',planlabel);const currentlyValid=data.status==='active'&&(plan==='lifetime'||(!expiry?false:expiry.getTime()>Date.now()));const status=el('span','z72-trial-badge',currentlyValid?w.active:data.status==='active'?w.expired:w.suspended);
 const heading=el('div','z72-trial-line');heading.append(badge,status);
 target.append(heading);
 if(expiry){target.append(el('p','',w.ends+': '+expiry.toLocaleDateString(lang()==='en'?'en-GB':'fa-AF',{year:'numeric',month:'short',day:'numeric'})));
  target.append(el('strong','z72-trial-days',days+' '+w.remaining));}
 if(stale)target.append(el('small','',w.cached));
}
function workspace(){try{return window.zaviCloudRestoreInfo?.().workspace||null}catch(e){return null}}
async function refresh(){
 if(busy)return;const target=q('#z72-trial-info');if(!target)return;
 const w=D[lang()],ws=workspace(),message=q('#z72-trial-message'),btn=q('#z72-trial-refresh');
 if(!ws){message.textContent=w.waiting;return}
 const key='zavi_trial_display_'+ws;
 busy=true;if(btn)btn.disabled=true;message.textContent=w.loading;
 try{
  if(navigator.onLine===false)throw Error('offline');
  const auth=await (window.zaviCloudRefreshAuthSession?.()||window.zaviCloudGetAuthSession?.());
  const cfg=window.zaviCloudGetPublicConfig?.();
  if(!auth?.access_token||!cfg?.url||!cfg?.key)throw Error('no-cloud-session');
  const r=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_subscription_details',{
   method:'POST',headers:{'content-type':'application/json','apikey':cfg.key,'authorization':'Bearer '+auth.access_token},
   body:JSON.stringify({p_workspace_id:ws})
  });
  if(!r.ok)throw Error('HTTP '+r.status);
  const j=await r.json(),obj=Array.isArray(j)?j[0]:j;
  if(!obj){target.replaceChildren();message.textContent=w.waiting;return}
  view(obj,false);message.textContent='';
  try{sessionStorage.setItem(key,JSON.stringify({plan:obj.plan,status:obj.status,expires_at:obj.expires_at,at:Date.now()}))}catch(e){}
 }catch(e){
  message.textContent=w.error;
  let cache;try{cache=JSON.parse(sessionStorage.getItem(key)||'null')}catch(e){}
  if(cache&&Date.now()-cache.at<86400000)view(cache,true);
 }finally{busy=false;if(btn)btn.disabled=false}
}
function mount(){
 const content=q('#content'),hub=q('.zavi-clean-settings-hub',content||document);
 if(!content||!hub||q('#z72-trial-card',content))return;
 const w=D[lang()],card=el('section','z72-trial-card');card.id='z72-trial-card';
 const head=el('div','z72-trial-head');
 const title=el('strong','',w.heading),button=el('button','',w.check);button.id='z72-trial-refresh';button.type='button';button.addEventListener('click',refresh);
 head.append(title,button);
 const info=el('div','z72-trial-info');info.id='z72-trial-info';
 const msg=el('p','z72-trial-message',w.waiting);msg.id='z72-trial-message';msg.setAttribute('role','status');
 card.append(head,info,msg,el('small','z72-trial-note',w.note));
 const offline=q('#z70-store-status',content);(offline||hub).before(card);
 refresh();
}
function start(){
 const content=q('#content');if(!content)return;
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mount()})}).observe(content,{childList:true});
 window.addEventListener('online',()=>{if(q('#z72-trial-card'))refresh()});
 ['zavi-cloud-workspace-selected','zavi-cloud-session-changed'].forEach(x=>window.addEventListener(x,()=>{if(q('#z72-trial-card'))refresh()}));
 mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();