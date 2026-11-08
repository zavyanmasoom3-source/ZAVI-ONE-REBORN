/* ZAVI ONE 65.79: signed offline lease automatically obtained after verified cloud owner login.
 * The existing ES256 service validates workspace, subscription, device registration and expiry.
 * No permission flag is stored locally; users cannot mint or extend a lease offline. */
(()=>{'use strict';
 const q=(s,p=document)=>p.querySelector(s);
 const words={
  fa:{ok:'مجوز آفلاین خودکار فعال شد',fail:'مجوز آفلاین این دستگاه هنوز آماده نیست. حساب ابری و دستگاه اصلی را بررسی کنید.',pending:'در حال گرفتن مجوز آفلاین امضاشده از سرور…',expired:'حساب ابری یا دستگاه مجاز نیست.',title:'آفلاین خودکار'},
  en:{ok:'Automatic offline access enabled',fail:'This device cannot receive an offline licence yet. Check cloud login and main device.',pending:'Requesting signed offline licence…',expired:'Cloud subscription or authorised device is not valid.',title:'Automatic offline'},
  ps:{ok:'آفلاین جواز په خپله فعال شو',fail:'د دې وسیلې جواز نه دی چمتو؛ کلاوډ حساب او اصلي وسیله وګورئ.',pending:'له سرور څخه د لاسلیک شوي آفلاین جواز ترلاسه کول…',expired:'کلاوډ ګډون يا وسیله اجازه نه لري.',title:'خپلکار آفلاین'}
 };
 const lang=()=>{const l=(q('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa'};
 const t=()=>words[lang()];
 let working=false,last='',lastAttempt=0,doneExp=0,failCode='',generation=0;
 const info=()=>window.zaviCloudRestoreInfo?.()||{};
 const authenticated=()=>window.zaviCloudGetAuthSession?.()?.user?.id||'';
 function message(str,kind){
  const box=q('#z79-auto-offline');if(!box)return;
  box.dataset.kind=kind;box.textContent=t().title+': '+str;
 }
 function render(){
  const parent=q('#z70-store-status');
  if(!parent||!q('.zavi-clean-settings-hub',q('#content')||document))return;
  let box=q('#z79-auto-offline');
  if(!box){box=document.createElement('div');box.id='z79-auto-offline';box.className='z79-auto-offline';box.setAttribute('role','status');parent.append(box)}
  message(doneExp>Date.now()?t().ok:failCode?t().fail:t().pending,doneExp>Date.now()?'good':failCode?'warning':'pending');
 }
 async function run(force=false){
  const s=info(),uid=authenticated(),ws=s.workspace;
  // No cloud account, revoked main device, or coworker -> never auto-grant.
  if(!uid||s.role!=='owner'||!ws||navigator.onLine===false)return;
  const signed=window.zaviSecureOfflineLicense;
  if(!signed?.device?.()||!signed?.workspace||signed.workspace()!==ws||!signed?.request||!signed?.cached)return;
  const stamp=uid+'/'+ws+'/'+signed.device(),now=Date.now();
  if(working||(!force&&stamp===last&&now-lastAttempt<20000))return;
  working=true;last=stamp;lastAttempt=now;const serial=++generation;
  try{
   const cached=await signed.cached(ws).catch(()=>null);
   if(!force&&cached?.claims?.exp*1000>now+48*3600000){doneExp=cached.claims.exp*1000;failCode='';render();return}
   const session=await window.zaviCloudRefreshAuthSession?.()||window.zaviCloudGetAuthSession?.();
   const cfg=window.zaviCloudGetPublicConfig?.();
   if(!session?.access_token||!cfg?.url||!cfg?.key||uid!==authenticated()||ws!==info().workspace)return;
   render();
   // The FIRST device can register automatically under its cloud-owner identity.
   // If another device is active, do NOT replace or revoke it; unsynced sales stay safe.
   const activation=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_v26_register_device',{
    method:'POST',
    headers:{'content-type':'application/json','apikey':cfg.key,'authorization':'Bearer '+session.access_token},
    body:JSON.stringify({p_workspace_id:ws,p_device_id:signed.device(),p_device_name:'ZAVI ONE Android'})
   });
   if(!activation.ok)throw Error('DEVICE_REGISTRATION_REJECTED_'+activation.status);
   const deviceState=await activation.json();
   if(deviceState==='ANOTHER_DEVICE_ACTIVE')throw Error('ANOTHER_DEVICE_ACTIVE');
   if(!['DEVICE_ACTIVATED','DEVICE_ALREADY_ACTIVE'].includes(deviceState))throw Error('DEVICE_NOT_AUTHORISED');
   // Server signs only after checking owner, subscription validity and active registered device.
   const lease=await signed.request(ws,session,cfg);
   if(serial!==generation||uid!==authenticated()||ws!==info().workspace)return;
   doneExp=(Number(lease?.claims?.exp)||0)*1000;
   failCode='';render();
   window.dispatchEvent(new CustomEvent('zavi-offline-lease-ready',{detail:{workspace_id:ws,expires_at:new Date(doneExp).toISOString()}}));
   // A signed permit is not enough for offline work: cache the application files too.
   void Promise.resolve(window.zaviAutoOffline?.prepare?.()).catch(()=>{});
  }catch(e){failCode=String(e?.code||e?.message||'UNAVAILABLE').slice(0,100);doneExp=0;render()}
  finally{working=false}
 }
 function start(){
  const target=q('#content');
  if(target)new MutationObserver(()=>render()).observe(target,{childList:true});
  for(const evt of ['zavi-cloud-session-changed','zavi-cloud-workspace-selected','zavi-cloud-owner-ready','zavi-subscription-updated','zavi-admin-trial-granted','online']){
   window.addEventListener(evt,()=>{lastAttempt=0;run(true)});
  }
  window.addEventListener('offline',render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});
  window.addEventListener('focus',()=>run());
  document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage')render()});
  // Reconfirm server entitlements while an owner uses the app for hours; remote
  // ADMIN renewals should refresh the signed device lease without a manual action.
  setInterval(()=>{if(!document.hidden&&navigator.onLine!==false&&Date.now()-lastAttempt>45*60*1000)run(true)},10*60*1000);
  render();setTimeout(()=>run(),1250);setTimeout(()=>run(),5000);
 }
 // Public method only requests a server-signed owner lease. It never grants access locally.
 window.ZaviAutoLease=Object.freeze({refresh:()=>run(true)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
